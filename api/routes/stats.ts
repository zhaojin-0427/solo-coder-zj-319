import { Router, type Request, type Response } from 'express';
import { dataStore } from '../data/DataStore.js';
import type {
  StatsOverview,
  PopularDish,
  TimeDistributionItem,
  ErrorProneItem,
  MemberCompletion,
  StepType,
  PurchaseStats,
  FeastPurchaseOverview,
  KitchenEquipment,
  EquipmentUsageItem,
  ScheduleSummary,
  MemberScheduleLoad,
} from '../types/index.js';
import { EQUIPMENT_LABELS, EQUIPMENT_ORDER, parseTime } from '../services/scheduler.js';

const router = Router();

router.get('/overview', async (_req: Request, res: Response): Promise<void> => {
  try {
    const overview: StatsOverview = {
      totalRecipes: dataStore.getRecipes().length,
      totalFeasts: dataStore.getFeasts().length,
      totalReviews: dataStore.getReviews().length,
      totalMembers: dataStore.getMembers().length,
    };
    res.json({ success: true, data: overview });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get overview' });
  }
});

router.get('/popular-dishes', async (_req: Request, res: Response): Promise<void> => {
  try {
    const feasts = dataStore.getFeasts();
    const recipeCountMap = new Map<string, number>();
    const recipeNameMap = new Map<string, string>();

    const recipes = dataStore.getRecipes();
    for (const r of recipes) {
      recipeNameMap.set(r.id, r.name);
    }

    for (const feast of feasts) {
      for (const rid of feast.recipeIds) {
        recipeCountMap.set(rid, (recipeCountMap.get(rid) || 0) + 1);
      }
    }

    const popularDishes: PopularDish[] = Array.from(recipeCountMap.entries())
      .map(([rid, count]) => ({
        name: recipeNameMap.get(rid) || rid,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({ success: true, data: popularDishes });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get popular dishes' });
  }
});

router.get('/time-distribution', async (_req: Request, res: Response): Promise<void> => {
  try {
    const recipes = dataStore.getRecipes();
    const typeDurations = new Map<StepType, { total: number; count: number }>();
    const typeLabels: Record<StepType, string> = {
      'wash-cut': '洗切备菜',
      'prep': '备料调味',
      'cooking': '烹饪烧制',
      'plating': '装盘出品',
    };

    for (const recipe of recipes) {
      for (const step of recipe.steps) {
        const existing = typeDurations.get(step.type) || { total: 0, count: 0 };
        existing.total += step.duration;
        existing.count += 1;
        typeDurations.set(step.type, existing);
      }
    }

    const distribution: TimeDistributionItem[] = (['wash-cut', 'prep', 'cooking', 'plating'] as StepType[]).map(
      (type) => {
        const data = typeDurations.get(type) || { total: 0, count: 0 };
        return {
          type,
          label: typeLabels[type],
          avgMinutes: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
        };
      }
    );

    res.json({ success: true, data: distribution });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get time distribution' });
  }
});

router.get('/error-prone', async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = dataStore.getReviews();
    const recipes = dataStore.getRecipes();
    const stepErrorMap = new Map<string, number>();
    const stepNameMap = new Map<string, string>();

    for (const recipe of recipes) {
      for (const step of recipe.steps) {
        stepNameMap.set(step.id, `${recipe.name} - ${step.title}`);
      }
    }

    for (const review of reviews) {
      for (const stepId of review.errorSteps) {
        stepErrorMap.set(stepId, (stepErrorMap.get(stepId) || 0) + 1);
      }
    }

    const errorProne: ErrorProneItem[] = Array.from(stepErrorMap.entries())
      .map(([stepId, errorCount]) => ({
        step: stepNameMap.get(stepId) || stepId,
        errorCount,
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 10);

    res.json({ success: true, data: errorProne });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get error-prone steps' });
  }
});

router.get('/member-completion', async (_req: Request, res: Response): Promise<void> => {
  try {
    const feasts = dataStore.getFeasts();
    const members = dataStore.getMembers();
    const memberStats = new Map<string, { total: number; completed: number }>();

    for (const feast of feasts) {
      for (const task of feast.tasks) {
        if (task.assignedMemberId) {
          const existing = memberStats.get(task.assignedMemberId) || { total: 0, completed: 0 };
          existing.total += 1;
          if (task.completed) {
            existing.completed += 1;
          }
          memberStats.set(task.assignedMemberId, existing);
        }
      }
    }

    const memberCompletion: MemberCompletion[] = members.map((m) => {
      const stats = memberStats.get(m.id) || { total: 0, completed: 0 };
      return {
        memberId: m.id,
        name: m.name,
        totalTasks: stats.total,
        completedTasks: stats.completed,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      };
    });

    memberCompletion.sort((a, b) => b.completionRate - a.completionRate);
    res.json({ success: true, data: memberCompletion });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get member completion' });
  }
});

router.get('/purchase-stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const feasts = dataStore.getFeasts();
    let totalIngredients = 0;
    let purchasedCount = 0;
    let pendingCount = 0;
    let outOfStockCount = 0;
    let replacedCount = 0;

    for (const feast of feasts) {
      for (const ing of feast.ingredients) {
        totalIngredients += 1;
        switch (ing.purchaseStatus) {
          case 'purchased':
            purchasedCount += 1;
            break;
          case 'pending':
            pendingCount += 1;
            break;
          case 'out-of-stock':
            outOfStockCount += 1;
            break;
          case 'replaced':
            replacedCount += 1;
            break;
          default:
            pendingCount += 1;
        }
      }
    }

    const purchaseStats: PurchaseStats = {
      totalIngredients,
      purchasedCount,
      pendingCount,
      outOfStockCount,
      replacedCount,
      purchaseCompletionRate: totalIngredients > 0 ? Math.round((purchasedCount / totalIngredients) * 100) : 0,
      outOfStockRate: totalIngredients > 0 ? Math.round((outOfStockCount / totalIngredients) * 100) : 0,
      replacementRate: totalIngredients > 0 ? Math.round((replacedCount / totalIngredients) * 100) : 0,
    };

    res.json({ success: true, data: purchaseStats });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get purchase stats' });
  }
});

router.get('/purchase-overview', async (_req: Request, res: Response): Promise<void> => {
  try {
    const feasts = dataStore.getFeasts();
    const sortedFeasts = [...feasts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const overview: FeastPurchaseOverview[] = sortedFeasts.slice(0, 5).map((feast) => {
      let purchased = 0;
      let pending = 0;
      let outOfStock = 0;
      let replaced = 0;
      const total = feast.ingredients.length;

      for (const ing of feast.ingredients) {
        switch (ing.purchaseStatus) {
          case 'purchased':
            purchased += 1;
            break;
          case 'pending':
            pending += 1;
            break;
          case 'out-of-stock':
            outOfStock += 1;
            break;
          case 'replaced':
            replaced += 1;
            break;
          default:
            pending += 1;
        }
      }

      return {
        feastId: feast.id,
        feastName: feast.name,
        feastDate: feast.date,
        totalIngredients: total,
        purchasedCount: purchased,
        pendingCount: pending,
        outOfStockCount: outOfStock,
        replacedCount: replaced,
        completionRate: total > 0 ? Math.round((purchased / total) * 100) : 0,
      };
    });

    res.json({ success: true, data: overview });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get purchase overview' });
  }
});

router.get('/equipment-usage', async (_req: Request, res: Response): Promise<void> => {
  try {
    const feasts = dataStore.getFeasts().filter((f) => f.schedule);
    const eqMap = new Map<KitchenEquipment, { count: number; totalMinutes: number }>();

    for (const feast of feasts) {
      for (const item of feast.schedule!.items) {
        const eq = (item.equipment ?? 'none') as KitchenEquipment;
        const start = parseTime(item.startTime) ?? 0;
        const end = parseTime(item.endTime) ?? 0;
        const existing = eqMap.get(eq) ?? { count: 0, totalMinutes: 0 };
        existing.count += 1;
        existing.totalMinutes += Math.max(0, end - start);
        eqMap.set(eq, existing);
      }
    }

    const result: EquipmentUsageItem[] = EQUIPMENT_ORDER.filter((eq) => eq !== 'none')
      .map((eq) => {
        const data = eqMap.get(eq) ?? { count: 0, totalMinutes: 0 };
        return {
          equipment: eq,
          label: EQUIPMENT_LABELS[eq],
          count: data.count,
          totalMinutes: Math.round(data.totalMinutes),
        };
      })
      .filter((d) => d.count > 0);

    res.json({ success: true, data: result });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get equipment usage' });
  }
});

router.get('/schedule-summary', async (_req: Request, res: Response): Promise<void> => {
  try {
    const feasts = dataStore.getFeasts().filter((f) => f.schedule);
    const totalSchedules = feasts.length;
    let totalItems = 0;
    let totalConflicts = 0;

    for (const feast of feasts) {
      totalItems += feast.schedule!.items.length;
      totalConflicts += feast.schedule!.conflicts.length;
    }

    const summary: ScheduleSummary = {
      totalSchedules,
      totalItems,
      totalConflicts,
      avgConflicts: totalSchedules > 0 ? Math.round((totalConflicts / totalSchedules) * 10) / 10 : 0,
      avgItems: totalSchedules > 0 ? Math.round((totalItems / totalSchedules) * 10) / 10 : 0,
    };

    res.json({ success: true, data: summary });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get schedule summary' });
  }
});

router.get('/member-schedule-load', async (_req: Request, res: Response): Promise<void> => {
  try {
    const feasts = dataStore.getFeasts().filter((f) => f.schedule);
    const members = dataStore.getMembers();
    const loadMap = new Map<string, { totalMinutes: number; itemCount: number }>();

    for (const feast of feasts) {
      for (const item of feast.schedule!.items) {
        if (!item.memberId) continue;
        const start = parseTime(item.startTime) ?? 0;
        const end = parseTime(item.endTime) ?? 0;
        const existing = loadMap.get(item.memberId) ?? { totalMinutes: 0, itemCount: 0 };
        existing.totalMinutes += Math.max(0, end - start);
        existing.itemCount += 1;
        loadMap.set(item.memberId, existing);
      }
    }

    const result: MemberScheduleLoad[] = members.map((m) => {
      const data = loadMap.get(m.id) ?? { totalMinutes: 0, itemCount: 0 };
      return {
        memberId: m.id,
        name: m.name,
        totalMinutes: Math.round(data.totalMinutes),
        itemCount: data.itemCount,
      };
    });

    result.sort((a, b) => b.totalMinutes - a.totalMinutes);
    res.json({ success: true, data: result });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get member schedule load' });
  }
});

export default router;
