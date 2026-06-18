import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/DataStore.js';
import type { CookingSchedule, ScheduleItem, ScheduleOverview } from '../types/index.js';
import {
  buildCookingSchedule,
  computeConflictsForItems,
  summarizeSchedule,
} from '../services/scheduler.js';

const router = Router();

function getScheduleContext(feastId: string) {
  const feast = dataStore.getFeastById(feastId);
  if (!feast) return null;
  const recipes = dataStore.getRecipes();
  const members = dataStore.getMembers();
  return { feast, recipes, members };
}

router.post('/:feastId/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { feastId } = req.params;
    const ctx = getScheduleContext(feastId);
    if (!ctx) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }
    const { feast, recipes, members } = ctx;
    const mealTime = (req.body?.mealTime as string) || feast.schedule?.mealTime || '18:00';

    const schedule = buildCookingSchedule({ feast, recipes, members, mealTime });
    dataStore.updateFeast(feastId, { schedule });

    res.json({ success: true, data: schedule });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to generate schedule' });
  }
});

router.put('/:feastId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { feastId } = req.params;
    const feast = dataStore.getFeastById(feastId);
    if (!feast) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }

    const { mealTime, items } = req.body as { mealTime: string; items: ScheduleItem[] };
    const recipes = dataStore.getRecipes();
    const conflicts = computeConflictsForItems(items, recipes, mealTime);

    const now = new Date().toISOString();
    const schedule: CookingSchedule = {
      feastId,
      mealTime,
      items,
      conflicts,
      generatedAt: feast.schedule?.generatedAt ?? now,
      updatedAt: now,
    };

    dataStore.updateFeast(feastId, { schedule });
    res.json({ success: true, data: schedule });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to save schedule' });
  }
});

router.post('/:feastId/recalculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { feastId } = req.params;
    const ctx = getScheduleContext(feastId);
    if (!ctx) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }
    const { feast, recipes, members } = ctx;

    const { mealTime, items } = req.body as { mealTime: string; items: ScheduleItem[] };

    const schedule = buildCookingSchedule({
      feast,
      recipes,
      members,
      mealTime,
      existingItems: items,
      generatedAt: feast.schedule?.generatedAt,
    });

    dataStore.updateFeast(feastId, { schedule });
    res.json({ success: true, data: schedule });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to recalculate schedule' });
  }
});

router.post('/:feastId/conflicts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { feastId } = req.params;
    const feast = dataStore.getFeastById(feastId);
    if (!feast) {
      res.status(404).json({ success: false, error: 'Feast not found' });
      return;
    }
    const { mealTime, items } = req.body as { mealTime: string; items: ScheduleItem[] };
    const recipes = dataStore.getRecipes();
    const conflicts = computeConflictsForItems(items, recipes, mealTime);
    res.json({ success: true, data: conflicts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to detect conflicts' });
  }
});

router.get('/recent', async (_req: Request, res: Response): Promise<void> => {
  try {
    const feasts = dataStore
      .getFeasts()
      .filter((f) => f.schedule)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const overviews: ScheduleOverview[] = feasts.map((feast) => {
      const schedule = feast.schedule as CookingSchedule;
      const summary = summarizeSchedule(schedule);
      return {
        feastId: feast.id,
        feastName: feast.name,
        feastDate: feast.date,
        mealTime: schedule.mealTime,
        itemCount: schedule.items.length,
        conflictCount: schedule.conflicts.length,
        earliestStart: summary.earliestStart,
        memberCount: summary.memberCount,
        updatedAt: schedule.updatedAt,
      };
    });

    res.json({ success: true, data: overviews });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to get recent schedules' });
  }
});

export default router;
