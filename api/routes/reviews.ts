import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/DataStore.js';
import type { Review } from '../types/index.js';

const router = Router();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { feastId, recipeId } = req.query;
    let reviews = dataStore.getReviews();

    if (feastId) {
      reviews = reviews.filter((r) => r.feastId === feastId);
    }
    if (recipeId) {
      reviews = reviews.filter((r) => r.recipeId === recipeId);
    }

    reviews = reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, data: reviews });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get reviews' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reviews = dataStore.getReviews();
    const review = reviews.find((r) => r.id === id);
    if (!review) {
      res.status(404).json({ success: false, error: 'Review not found' });
      return;
    }
    res.json({ success: true, data: review });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get review' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { feastId, recipeId, recipeName, tasteDeviation, adjustmentSuggestion, rating, errorSteps } = req.body as {
      feastId?: string;
      recipeId: string;
      recipeName: string;
      tasteDeviation: string;
      adjustmentSuggestion: string;
      rating: number;
      errorSteps: string[];
    };

    if (!recipeId || !recipeName) {
      res.status(400).json({ success: false, error: 'Recipe ID and name are required' });
      return;
    }

    const review: Review = {
      id: generateId('rv'),
      feastId,
      recipeId,
      recipeName,
      tasteDeviation: tasteDeviation || '',
      adjustmentSuggestion: adjustmentSuggestion || '',
      rating: rating || 0,
      errorSteps: errorSteps || [],
      createdAt: new Date().toISOString(),
    };

    const saved = dataStore.addReview(review);
    res.json({ success: true, data: saved });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create review' });
  }
});

export default router;
