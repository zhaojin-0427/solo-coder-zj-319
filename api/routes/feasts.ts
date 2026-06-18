import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/DataStore.js';
import type {
  Feast,
  FeastTask,
  CalculatedIngredient,
  Recipe,
  TaskType,
  PurchaseStatus,
  ReplacementIngredient,
  FeastRiskResolution,
  ConflictResolutionStatus,
  FeastRiskCheck,
} from '../types/index.js';
import {
  computeFeastCompatibility,
  computeRecipeCompatibility,
} from '../services/compatibility.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function calculateIngredients(
  recipes: Recipe[],
  basePeople: number,
  targetPeople: number,
  existingIngredients?: CalculatedIngredient[]
): CalculatedIngredient[] {
  const factor = targetPeople / basePeople;
  const ingredientMap = new Map<string, CalculatedIngredient>();
  const existingMap = new Map<string, CalculatedIngredient>();

  if (existingIngredients) {
    for (const ing of existingIngredients) {
      const key = `${ing.name}_${ing.unit}`;
      existingMap.set(key, ing);
    }
  }

  for (const recipe of recipes) {
    const perRecipeFactor = targetPeople / Math.max(recipe.servings, 1);

    for (const ing of recipe.ingredients) {
      const key = `${ing.name}_${ing.unit}`;
      const existing = ingredientMap.get(key);
      const scaledAmount = Math.round(ing.amount * perRecipeFactor * 100) / 100;

      if (existing) {
        existing.amount = Math.round((existing.amount + scaledAmount) * 100) / 100;
        if (!existing.sourceRecipes.includes(recipe.name)) {
          existing.sourceRecipes.push(recipe.name);
        }
      } else {
        const existingPurchaseData = existingMap.get(key);
        const newIngredient: CalculatedIngredient = {
          name: ing.name,
          amount: scaledAmount,
          unit: ing.unit,
          category: ing.category,
          sourceRecipes: [recipe.name],
          purchaseStatus: existingPurchaseData?.purchaseStatus || 'pending',
          outOfStockNote: existingPurchaseData?.outOfStockNote,
          replacement: existingPurchaseData?.replacement,
          purchasedAt: existingPurchaseData?.purchasedAt,
        };
        ingredientMap.set(key, newIngredient);
      }
    }
  }

  return Array.from(ingredientMap.values());
}

function generateTasks(recipes: Recipe[]): FeastTask[] {
  const tasks: FeastTask[] = [];
  const typeOrder: TaskType[] = ['wash-cut', 'prep', 'cooking', 'plating'];

  for (const type of typeOrder) {
    for (const recipe of recipes) {
      const stepsOfType = recipe.steps.filter((s) => s.type === type);
      if (stepsOfType.length > 0) {
        const combinedDesc = stepsOfType.map((s) => s.title).join('、');
        tasks.push({
          id: generateId('t'),
          type,
          description: `${recipe.name}：${combinedDesc}`,
          stepId: stepsOfType[0].id,
          recipeId: recipe.id,
          recipeName: recipe.name,
          assignedMemberId: undefined,
          completed: false,
        });
      }
    }
  }

  return tasks;
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const feasts = dataStore.getFeasts().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, data: feasts });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get feasts' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const feast = dataStore.getFeastById(id);
    if (!feast) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }
    res.json({ success: true, data: feast });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get feast' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, date, people, recipeIds } = req.body as {
      name: string;
      date: string;
      people: number;
      recipeIds: string[];
    };

    if (!name || !recipeIds || recipeIds.length === 0) {
      res.status(400).json({ success: false, error: 'Name and recipeIds are required' });
      return;
    }

    const allRecipes = dataStore.getRecipes();
    const selectedRecipes = allRecipes.filter((r) => recipeIds.includes(r.id));

    if (selectedRecipes.length === 0) {
      res.status(400).json({ success: false, error: 'No valid recipes selected' });
      return;
    }

    const baseServings = selectedRecipes.reduce((sum, r) => sum + r.servings, 0) / selectedRecipes.length;
    const ingredients = calculateIngredients(selectedRecipes, baseServings, people);
    const tasks = generateTasks(selectedRecipes);

    const feast: Feast = {
      id: generateId('f'),
      name,
      date: date || new Date().toISOString().split('T')[0],
      people: people || 4,
      recipeIds,
      ingredients,
      tasks,
      status: 'planning',
      createdAt: new Date().toISOString(),
    };

    const saved = dataStore.addFeast(feast);
    res.json({ success: true, data: saved });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to create feast' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = dataStore.getFeastById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    const updates = req.body as Partial<Feast>;
    const updated = dataStore.updateFeast(id, updates);
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update feast' });
  }
});

router.put('/:id/recalculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { people } = req.body as { people: number };
    const existing = dataStore.getFeastById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    const allRecipes = dataStore.getRecipes();
    const selectedRecipes = allRecipes.filter((r) => existing.recipeIds.includes(r.id));
    const baseServings = selectedRecipes.reduce((sum, r) => sum + r.servings, 0) / Math.max(selectedRecipes.length, 1);
    const ingredients = calculateIngredients(
      selectedRecipes,
      baseServings,
      people || existing.people,
      existing.ingredients
    );

    const updated = dataStore.updateFeast(id, {
      people: people || existing.people,
      ingredients,
    });

    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to recalculate feast' });
  }
});

router.put('/:id/tasks/:taskId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, taskId } = req.params;
    const taskUpdates = req.body as Partial<FeastTask>;
    const existing = dataStore.getFeastById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    const newTasks = existing.tasks.map((t) =>
      t.id === taskId ? { ...t, ...taskUpdates } : t
    );

    const updated = dataStore.updateFeast(id, { tasks: newTasks });
    res.json({ success: true, data: updated?.tasks.find((t) => t.id === taskId) });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

router.post('/:id/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const taskData = req.body as Omit<FeastTask, 'id' | 'completed'>;
    const existing = dataStore.getFeastById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    const newTask: FeastTask = {
      ...taskData,
      id: generateId('t'),
      completed: false,
    };

    const updated = dataStore.updateFeast(id, {
      tasks: [...existing.tasks, newTask],
    });

    res.json({ success: true, data: updated?.tasks });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to add task' });
  }
});

router.delete('/:id/tasks/:taskId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, taskId } = req.params;
    const existing = dataStore.getFeastById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    const newTasks = existing.tasks.filter((t) => t.id !== taskId);
    const updated = dataStore.updateFeast(id, { tasks: newTasks });
    res.json({ success: true, data: updated?.tasks });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = dataStore.deleteFeast(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete feast' });
  }
});

router.put('/:id/ingredients/:ingredientName/purchase-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, ingredientName } = req.params;
    const { status, outOfStockNote, replacement } = req.body as {
      status: PurchaseStatus;
      outOfStockNote?: string;
      replacement?: ReplacementIngredient;
    };

    const existing = dataStore.getFeastById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    const decodedName = decodeURIComponent(ingredientName);

    const updatedIngredients = existing.ingredients.map((ing) => {
      if (ing.name === decodedName) {
        const updated: CalculatedIngredient = {
          ...ing,
          purchaseStatus: status,
          purchasedAt: status === 'purchased' ? new Date().toISOString() : ing.purchasedAt,
        };
        if (outOfStockNote !== undefined) {
          updated.outOfStockNote = outOfStockNote;
        }
        if (replacement !== undefined) {
          updated.replacement = replacement;
        }
        if (status !== 'out-of-stock') {
          delete updated.outOfStockNote;
        }
        if (status !== 'replaced') {
          delete updated.replacement;
        }
        return updated;
      }
      return ing;
    });

    const updated = dataStore.updateFeast(id, { ingredients: updatedIngredients });
    const updatedIngredient = updated?.ingredients.find((ing) => ing.name === decodedName);

    res.json({ success: true, data: updatedIngredient });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to update ingredient purchase status' });
  }
});

router.put('/:id/ingredients/batch-update', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { updates } = req.body as {
      updates: Array<{
        name: string;
        status?: PurchaseStatus;
        outOfStockNote?: string;
        replacement?: ReplacementIngredient;
      }>;
    };

    const existing = dataStore.getFeastById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    let updatedIngredients = [...existing.ingredients];

    for (const update of updates) {
      updatedIngredients = updatedIngredients.map((ing) => {
        if (ing.name === update.name) {
          const updated: CalculatedIngredient = { ...ing };
          if (update.status !== undefined) {
            updated.purchaseStatus = update.status;
            updated.purchasedAt = update.status === 'purchased' ? new Date().toISOString() : ing.purchasedAt;
          }
          if (update.outOfStockNote !== undefined) {
            updated.outOfStockNote = update.outOfStockNote;
          }
          if (update.replacement !== undefined) {
            updated.replacement = update.replacement;
          }
          if (update.status && update.status !== 'out-of-stock') {
            delete updated.outOfStockNote;
          }
          if (update.status && update.status !== 'replaced') {
            delete updated.replacement;
          }
          return updated;
        }
        return ing;
      });
    }

    const updated = dataStore.updateFeast(id, { ingredients: updatedIngredients });
    res.json({ success: true, data: updated?.ingredients });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to batch update ingredients' });
  }
});

router.post('/:id/compatibility', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body as { memberIds?: string[] };
    const existing = dataStore.getFeastById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    const allRecipes = dataStore.getRecipes();
    const selectedRecipes = allRecipes.filter((r) => existing.recipeIds.includes(r.id));

    let members = dataStore.getMembers();
    if (memberIds && memberIds.length > 0) {
      members = members.filter((m) => memberIds.includes(m.id));
    } else if (existing.attendeeMemberIds && existing.attendeeMemberIds.length > 0) {
      members = members.filter((m) => existing.attendeeMemberIds!.includes(m.id));
    }

    const compatibility = computeFeastCompatibility(id, selectedRecipes, members);

    const now = new Date().toISOString();
    const existingResolutions = existing.riskCheck?.resolutions || [];
    const riskCheck: FeastRiskCheck = {
      feastId: id,
      compatibility,
      resolutions: existingResolutions,
      generatedAt: existing.riskCheck?.generatedAt || now,
      updatedAt: now,
    };

    dataStore.updateFeast(id, { riskCheck, attendeeMemberIds: memberIds || existing.attendeeMemberIds });

    res.json({ success: true, data: compatibility });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to compute compatibility' });
  }
});

router.get('/:id/compatibility', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = dataStore.getFeastById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    if (existing.riskCheck) {
      res.json({ success: true, data: existing.riskCheck.compatibility });
      return;
    }

    const allRecipes = dataStore.getRecipes();
    const selectedRecipes = allRecipes.filter((r) => existing.recipeIds.includes(r.id));
    let members = dataStore.getMembers();
    if (existing.attendeeMemberIds && existing.attendeeMemberIds.length > 0) {
      members = members.filter((m) => existing.attendeeMemberIds!.includes(m.id));
    }

    const compatibility = computeFeastCompatibility(id, selectedRecipes, members);
    res.json({ success: true, data: compatibility });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to get compatibility' });
  }
});

router.get('/:id/risk-check', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = dataStore.getFeastById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    if (!existing.riskCheck) {
      const allRecipes = dataStore.getRecipes();
      const selectedRecipes = allRecipes.filter((r) => existing.recipeIds.includes(r.id));
      let members = dataStore.getMembers();
      if (existing.attendeeMemberIds && existing.attendeeMemberIds.length > 0) {
        members = members.filter((m) => existing.attendeeMemberIds!.includes(m.id));
      }

      const compatibility = computeFeastCompatibility(id, selectedRecipes, members);
      const now = new Date().toISOString();
      const riskCheck: FeastRiskCheck = {
        feastId: id,
        compatibility,
        resolutions: [],
        generatedAt: now,
        updatedAt: now,
      };
      dataStore.updateFeast(id, { riskCheck });
      res.json({ success: true, data: riskCheck });
      return;
    }

    res.json({ success: true, data: existing.riskCheck });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to get risk check' });
  }
});

router.put('/:id/attendees', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body as { memberIds: string[] };
    const existing = dataStore.getFeastById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    const updated = dataStore.updateFeast(id, { attendeeMemberIds: memberIds });
    res.json({ success: true, data: updated?.attendeeMemberIds });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to update attendees' });
  }
});

router.put('/:id/risks/:riskId/resolution', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, riskId } = req.params;
    const body = req.body as {
      status: ConflictResolutionStatus;
      resolutionType?: FeastRiskResolution['resolutionType'];
      resolutionNote?: string;
      handledBy?: string;
    };
    const existing = dataStore.getFeastById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    const now = new Date().toISOString();
    const existingResolutions = existing.riskCheck?.resolutions || [];
    const idx = existingResolutions.findIndex((r) => r.riskId === riskId);

    const resolution: FeastRiskResolution =
      idx >= 0
        ? {
            ...existingResolutions[idx],
            status: body.status,
            resolutionType: body.resolutionType ?? existingResolutions[idx].resolutionType,
            resolutionNote: body.resolutionNote ?? existingResolutions[idx].resolutionNote,
            handledBy: body.handledBy ?? existingResolutions[idx].handledBy,
            handledAt: now,
          }
        : {
            id: generateId('res'),
            feastId: id,
            riskId,
            status: body.status,
            resolutionType: body.resolutionType,
            resolutionNote: body.resolutionNote,
            handledBy: body.handledBy,
            handledAt: now,
          };

    const newResolutions =
      idx >= 0
        ? existingResolutions.map((r, i) => (i === idx ? resolution : r))
        : [...existingResolutions, resolution];

    const compatibility = existing.riskCheck?.compatibility;
    const riskCheck: FeastRiskCheck = {
      feastId: id,
      compatibility: compatibility!,
      resolutions: newResolutions,
      generatedAt: existing.riskCheck?.generatedAt || now,
      updatedAt: now,
    };

    const updated = dataStore.updateFeast(id, { riskCheck });
    res.json({ success: true, data: updated?.riskCheck });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to update risk resolution' });
  }
});

router.get('/:id/recipe-compatibility/:recipeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, recipeId } = req.params;
    const feast = dataStore.getFeastById(id);
    const recipe = dataStore.getRecipeById(recipeId);

    if (!feast || !recipe) {
      res.status(404).json({ success: false, error: 'Feast or recipe not found' });
      return;
    }

    let members = dataStore.getMembers();
    if (feast.attendeeMemberIds && feast.attendeeMemberIds.length > 0) {
      members = members.filter((m) => feast.attendeeMemberIds!.includes(m.id));
    }

    const score = computeRecipeCompatibility(recipe, members);
    res.json({ success: true, data: score });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to compute recipe compatibility' });
  }
});

export default router;
