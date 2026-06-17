import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/DataStore.js';
import type { StepCard } from '../types/index.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

router.get('/recipe/:recipeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const recipe = dataStore.getRecipeById(recipeId);
    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }
    res.json({ success: true, data: recipe.steps });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get steps' });
  }
});

router.post('/recipe/:recipeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const recipe = dataStore.getRecipeById(recipeId);
    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }

    const stepData = req.body as Omit<StepCard, 'id' | 'recipeId'>;
    const newStep: StepCard = {
      ...stepData,
      id: generateId('s'),
      recipeId,
      order: recipe.steps.length + 1,
    };

    const updated = dataStore.updateRecipe(recipeId, {
      steps: [...recipe.steps, newStep],
    });

    res.json({ success: true, data: updated?.steps });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create step' });
  }
});

router.put('/:stepId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { stepId } = req.params;
    const stepUpdates = req.body as Partial<StepCard>;

    const recipes = dataStore.getRecipes();
    for (const recipe of recipes) {
      const stepIdx = recipe.steps.findIndex((s) => s.id === stepId);
      if (stepIdx !== -1) {
        const newSteps = [...recipe.steps];
        newSteps[stepIdx] = { ...newSteps[stepIdx], ...stepUpdates, id: stepId, recipeId: recipe.id };
        const updated = dataStore.updateRecipe(recipe.id, { steps: newSteps });
        res.json({ success: true, data: updated?.steps[stepIdx] });
        return;
      }
    }

    res.status(404).json({ success: false, error: 'Step not found' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update step' });
  }
});

router.delete('/:stepId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { stepId } = req.params;

    const recipes = dataStore.getRecipes();
    for (const recipe of recipes) {
      const stepIdx = recipe.steps.findIndex((s) => s.id === stepId);
      if (stepIdx !== -1) {
        const newSteps = recipe.steps
          .filter((s) => s.id !== stepId)
          .map((s, idx) => ({ ...s, order: idx + 1 }));
        const updated = dataStore.updateRecipe(recipe.id, { steps: newSteps });
        res.json({ success: true, data: updated?.steps });
        return;
      }
    }

    res.status(404).json({ success: false, error: 'Step not found' });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete step' });
  }
});

router.post('/reorder/recipe/:recipeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const { orderedIds } = req.body as { orderedIds: string[] };
    const recipe = dataStore.getRecipeById(recipeId);

    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }

    const stepMap = new Map(recipe.steps.map((s) => [s.id, s]));
    const newSteps = orderedIds
      .map((id, idx) => {
        const step = stepMap.get(id);
        return step ? { ...step, order: idx + 1 } : null;
      })
      .filter((s): s is StepCard => s !== null);

    const remaining = recipe.steps
      .filter((s) => !orderedIds.includes(s.id))
      .map((s, idx) => ({ ...s, order: newSteps.length + idx + 1 }));

    const updated = dataStore.updateRecipe(recipeId, { steps: [...newSteps, ...remaining] });
    res.json({ success: true, data: updated?.steps });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to reorder steps' });
  }
});

export default router;
