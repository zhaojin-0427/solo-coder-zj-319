import type {
  Feast,
  Recipe,
  Member,
  ScheduleItem,
  ScheduleConflict,
  CookingSchedule,
  KitchenEquipment,
} from '../types/index.js';

export const EQUIPMENT_LABELS: Record<KitchenEquipment, string> = {
  'gas-stove': '燃气灶',
  'wok': '炒锅',
  'steamer': '蒸锅',
  'oven': '烤箱',
  'rice-cooker': '电饭煲',
  'cutting-board': '案板',
  'pot': '汤锅',
  'none': '无需设备',
};

export const EQUIPMENT_ORDER: KitchenEquipment[] = [
  'gas-stove',
  'wok',
  'steamer',
  'pot',
  'oven',
  'rice-cooker',
  'cutting-board',
  'none',
];

type Minutes = number;

const DEFAULT_MEAL_TIME = '18:00';

export function parseTime(t: string | undefined): Minutes | undefined {
  if (!t) return undefined;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return undefined;
  const val = Number(m[1]) * 60 + Number(m[2]);
  if (Number.isNaN(val)) return undefined;
  return val;
}

export function formatTime(min: Minutes): string {
  const wrapped = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface TaskAssign {
  taskId: string;
  memberId?: string;
}

function buildTaskAssignMap(feast: Feast): Map<string, TaskAssign> {
  const map = new Map<string, TaskAssign>();
  for (const task of feast.tasks) {
    if (!task.recipeId) continue;
    const key = `${task.recipeId}_${task.type}`;
    if (!map.has(key)) {
      map.set(key, { taskId: task.id, memberId: task.assignedMemberId });
    }
  }
  return map;
}

function overlap(aStart: Minutes, aEnd: Minutes, bStart: Minutes, bEnd: Minutes): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function hasResourceConflict(a: ScheduleItem, b: ScheduleItem): boolean {
  const eqConflict =
    !!a.equipment && a.equipment === b.equipment && a.equipment !== 'none';
  const memConflict = !!a.memberId && a.memberId === b.memberId;
  return eqConflict || memConflict;
}

function conflictType(a: ScheduleItem, b: ScheduleItem): ScheduleConflict['type'] {
  if (!!a.equipment && a.equipment === b.equipment && a.equipment !== 'none') {
    return 'equipment';
  }
  return 'member';
}

function detectConflicts(
  items: ScheduleItem[],
  recipes: Recipe[],
  mealTimeMin: Minutes
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      const aStart = parseTime(a.startTime) ?? 0;
      const aEnd = parseTime(a.endTime) ?? 0;
      const bStart = parseTime(b.startTime) ?? 0;
      const bEnd = parseTime(b.endTime) ?? 0;
      if (!overlap(aStart, aEnd, bStart, bEnd)) continue;
      if (!hasResourceConflict(a, b)) continue;

      const type = conflictType(a, b);
      const pairId = [a.id, b.id].sort().join('|');
      if (conflicts.some((c) => c.id === `${type}_${pairId}`)) continue;

      if (type === 'equipment') {
        const eqLabel = EQUIPMENT_LABELS[a.equipment as KitchenEquipment];
        conflicts.push({
          id: `equipment_${pairId}`,
          type: 'equipment',
          severity: 'error',
          message: `设备冲突：${eqLabel} 在 ${a.startTime} 被同时占用（${a.recipeName}·${a.stepTitle} 与 ${b.recipeName}·${b.stepTitle}）`,
          itemIds: [a.id, b.id],
        });
      } else {
        conflicts.push({
          id: `member_${pairId}`,
          type: 'member',
          severity: 'error',
          message: `人员冲突：${a.memberName} 在 ${a.startTime} 有重叠任务（${a.recipeName}·${a.stepTitle} 与 ${b.recipeName}·${b.stepTitle}）`,
          itemIds: [a.id, b.id],
        });
      }
    }
  }

  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const dishGroups = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    if (!item.recipeId) continue;
    const arr = dishGroups.get(item.recipeId) ?? [];
    arr.push(item);
    dishGroups.set(item.recipeId, arr);
  }

  for (const [recipeId, dishItems] of dishGroups) {
    const recipe = recipeMap.get(recipeId);
    if (!recipe) continue;
    const last = dishItems.reduce((acc, cur) => {
      const accEnd = parseTime(acc.endTime) ?? 0;
      const curEnd = parseTime(cur.endTime) ?? 0;
      return curEnd > accEnd ? cur : acc;
    });
    const lastEnd = parseTime(last.endTime) ?? 0;
    const latestReady = parseTime(recipe.latestReadyTime);

    if (latestReady !== undefined && lastEnd > latestReady) {
      conflicts.push({
        id: `too-late_${recipeId}`,
        type: 'too-late',
        severity: 'error',
        message: `超时：${recipe.name} 出锅时间为 ${last.endTime}，晚于最晚出锅时间 ${recipe.latestReadyTime}`,
        itemIds: [last.id],
      });
    } else if (lastEnd > mealTimeMin) {
      conflicts.push({
        id: `too-late_meal_${recipeId}`,
        type: 'too-late',
        severity: 'error',
        message: `超时：${recipe.name} 出锅时间为 ${last.endTime}，晚于开饭时间 ${formatTime(mealTimeMin)}`,
        itemIds: [last.id],
      });
    }

    if (recipe.keepWarmDuration !== undefined && recipe.keepWarmDuration !== null) {
      const wait = mealTimeMin - lastEnd;
      if (wait > recipe.keepWarmDuration) {
        conflicts.push({
          id: `keep-warm_${recipeId}`,
          type: 'keep-warm',
          severity: 'warning',
          message: `保温超时：${recipe.name} 在 ${last.endTime} 出锅，距开饭还有 ${wait} 分钟，超过保温时长 ${recipe.keepWarmDuration} 分钟`,
          itemIds: [last.id],
        });
      }
    }
  }

  return conflicts;
}

export interface GenerateInput {
  feast: Feast;
  recipes: Recipe[];
  members: Member[];
  mealTime: string;
  existingItems?: ScheduleItem[];
  generatedAt?: string;
}

export function generateSchedule(input: GenerateInput): {
  items: ScheduleItem[];
  conflicts: ScheduleConflict[];
} {
  const mealTimeMin = parseTime(input.mealTime) ?? parseTime(DEFAULT_MEAL_TIME) ?? 18 * 60;

  const lockMap = new Map<string, ScheduleItem>();
  if (input.existingItems) {
    for (const it of input.existingItems) {
      if (it.locked && it.stepId) lockMap.set(it.stepId, it);
    }
  }

  const memberMap = new Map(input.members.map((m) => [m.id, m]));
  const taskAssignMap = buildTaskAssignMap(input.feast);

  const items: ScheduleItem[] = [];

  for (const recipeId of input.feast.recipeIds) {
    const recipe = input.recipes.find((r) => r.id === recipeId);
    if (!recipe) continue;
    const steps = [...recipe.steps].sort((a, b) => a.order - b.order);
    if (steps.length === 0) continue;

    const latestReady = parseTime(recipe.latestReadyTime);
    const dishEnd = Math.min(mealTimeMin, latestReady ?? mealTimeMin);

    let nextEnd = dishEnd;
    let nextStart = dishEnd;

    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      const assign = taskAssignMap.get(`${step.recipeId}_${step.type}`);
      const memberId = assign?.memberId;
      const memberName = memberId ? memberMap.get(memberId)?.name : undefined;
      const lock = step.id ? lockMap.get(step.id) : undefined;

      let start: Minutes;
      let end: Minutes;

      if (lock) {
        start = parseTime(lock.startTime) ?? 0;
        end = parseTime(lock.endTime) ?? start + step.duration;
      } else {
        if (i === steps.length - 1) {
          end = dishEnd;
        } else {
          end = step.parallel ? nextEnd : nextStart;
        }
        start = end - step.duration;
      }

      if (start < 0) {
        start = 0;
        end = start + step.duration;
      }

      const item: ScheduleItem = {
        id: `${recipe.id}_${step.id}`,
        taskId: assign?.taskId ?? `task_${step.id}`,
        stepId: step.id,
        recipeId: recipe.id,
        recipeName: recipe.name,
        stepTitle: step.title,
        stepOrder: step.order,
        type: step.type,
        memberId,
        memberName,
        equipment: step.equipment ?? 'none',
        duration: step.duration,
        startTime: formatTime(start),
        endTime: formatTime(end),
        locked: !!lock,
        parallel: !!step.parallel,
      };
      items.push(item);

      nextEnd = end;
      nextStart = start;
    }
  }

  const conflicts = detectConflicts(items, input.recipes, mealTimeMin);

  items.sort((a, b) => (parseTime(a.startTime) ?? 0) - (parseTime(b.startTime) ?? 0));

  return { items, conflicts };
}

export function buildCookingSchedule(input: GenerateInput): CookingSchedule {
  const { items, conflicts } = generateSchedule(input);
  const now = new Date().toISOString();
  return {
    feastId: input.feast.id,
    mealTime: input.mealTime,
    items,
    conflicts,
    generatedAt: input.generatedAt ?? now,
    updatedAt: now,
  };
}

export function summarizeSchedule(schedule: CookingSchedule): {
  earliestStart: string;
  memberCount: number;
} {
  if (schedule.items.length === 0) {
    return { earliestStart: '--:--', memberCount: 0 };
  }
  const starts = schedule.items.map((it) => parseTime(it.startTime) ?? 0);
  const earliest = Math.min(...starts);
  const memberSet = new Set(
    schedule.items.map((it) => it.memberId).filter((id): id is string => !!id)
  );
  return {
    earliestStart: formatTime(earliest),
    memberCount: memberSet.size,
  };
}

export function computeConflictsForItems(
  items: ScheduleItem[],
  recipes: Recipe[],
  mealTime: string
): ScheduleConflict[] {
  const mealTimeMin = parseTime(mealTime) ?? parseTime(DEFAULT_MEAL_TIME) ?? 18 * 60;
  return detectConflicts(items, recipes, mealTimeMin);
}

export function applyManualAdjustments(
  baseItems: ScheduleItem[],
  overrides: ScheduleItem[]
): ScheduleItem[] {
  const overrideMap = new Map(overrides.map((o) => [o.id, o]));
  return baseItems.map((it) => {
    const ov = overrideMap.get(it.id);
    if (!ov) return it;
    return {
      ...it,
      startTime: ov.startTime,
      endTime: ov.endTime,
      locked: ov.locked,
    };
  });
}
