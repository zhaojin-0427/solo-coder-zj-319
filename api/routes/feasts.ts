import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/DataStore.js';
import type { Feast, FeastTask, CalculatedIngredient, Recipe, TaskType } from '../types/index.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function calculateIngredients(recipes: Recipe[], basePeople: number, targetPeople: number): CalculatedIngredient[] {
  const factor = targetPeople / basePeople;
  const ingredientMap = new Map<string, CalculatedIngredient>();

  for (const recipe of recipes) {
    const recipeFactor = (recipe.servings > 0 ? factor : 1) * (targetPeople / (basePeople || 1));
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
        ingredientMap.set(key, {
          name: ing.name,
          amount: scaledAmount,
          unit: ing.unit,
          category: ing.category,
          sourceRecipes: [recipe.name],
        });
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
    const ingredients = calculateIngredients(selectedRecipes, baseServings, people || existing.people);

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

export default router;
