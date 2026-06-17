import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/DataStore.js';
import type { Recipe, Ingredient, StepCard } from '../types/index.js';
import { parseRecipeText } from '../services/recipeParser.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const recipes = dataStore.getRecipes();
    res.json({
      success: true,
      data: recipes,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get recipes' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const recipe = dataStore.getRecipeById(id);
    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }
    res.json({ success: true, data: recipe });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get recipe' });
  }
});

router.post('/parse', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, name } = req.body as { text: string; name?: string };
    if (!text || text.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Text is required' });
      return;
    }
    const parsed = parseRecipeText(text, name);
    res.json({ success: true, data: parsed });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to parse recipe' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, source, originalText, servings, ingredients, steps, tags } = req.body as {
      name: string;
      source: string;
      originalText: string;
      servings: number;
      ingredients: Omit<Ingredient, 'id'>[];
      steps: Omit<StepCard, 'id' | 'recipeId'>[];
      tags: string[];
    };

    const recipeId = generateId('r');
    const now = new Date().toISOString();

    const recipeIngredients: Ingredient[] = ingredients.map((ing) => ({
      ...ing,
      id: generateId('i'),
    }));

    const ingredientIdMap = new Map<string, string>();
    ingredients.forEach((_ing, idx) => {
      ingredientIdMap.set(String(idx), recipeIngredients[idx].id);
    });

    const recipeSteps: StepCard[] = steps.map((step, idx) => ({
      ...step,
      id: generateId('s'),
      recipeId,
      order: idx + 1,
    }));

    const recipe: Recipe = {
      id: recipeId,
      name,
      source: source || '手动录入',
      originalText: originalText || '',
      servings: servings || 2,
      ingredients: recipeIngredients,
      steps: recipeSteps,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    };

    const saved = dataStore.addRecipe(recipe);
    res.json({ success: true, data: saved });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to create recipe' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = dataStore.getRecipeById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }

    const updates = req.body as Partial<Recipe>;

    if (updates.ingredients) {
      updates.ingredients = updates.ingredients.map((ing) =>
        ing.id ? ing : { ...ing, id: generateId('i') }
      ) as Ingredient[];
    }

    if (updates.steps) {
      updates.steps = updates.steps.map((step, idx) => ({
        ...step,
        id: step.id || generateId('s'),
        recipeId: id,
        order: step.order || idx + 1,
      })) as StepCard[];
    }

    const updated = dataStore.updateRecipe(id, updates);
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update recipe' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = dataStore.deleteRecipe(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete recipe' });
  }
});

export default router;
