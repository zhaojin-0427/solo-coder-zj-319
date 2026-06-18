import { useState } from 'react';
import {
  Clock,
  RefreshCw,
  Save,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  AlertOctagon,
  UtensilsCrossed,
  Users,
  CalendarClock,
  CookingPot,
} from 'lucide-react';
import { scheduleApi } from '@/lib/api';
import type {
  Feast,
  Recipe,
  Member,
  CookingSchedule,
  ScheduleItem,
  ScheduleConflict,
  ScheduleConflictType,
  KitchenEquipment,
  TaskType,
} from '@/types';
import { clsx } from 'clsx';

const equipmentLabel: Record<KitchenEquipment, string> = {
  'gas-stove': '燃气灶',
  wok: '炒锅',
  steamer: '蒸锅',
  oven: '烤箱',
  'rice-cooker': '电饭煲',
  'cutting-board': '案板',
  pot: '炖锅',
  none: '无设备',
};

const stepTypeColor: Record<TaskType, string> = {
  'wash-cut': 'bg-blue-400',
  prep: 'bg-purple-400',
  cooking: 'bg-rose-400',
  plating: 'bg-emerald-400',
};

const conflictConfig: Record<
  ScheduleConflictType,
  { label: string; color: string; bg: string; icon: typeof AlertTriangle }
> = {
  equipment: { label: '设备冲突', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertOctagon },
  member: { label: '人员冲突', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: AlertTriangle },
  'keep-warm': { label: '保温超时', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle },
  'too-late': { label: '超最晚出锅', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertOctagon },
};

function parseTime(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatTime(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function errMsg(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

interface Props {
  feast: Feast;
  recipes: Recipe[];
  members: Member[];
  onSaved: () => void;
}

export default function FeastSchedulePanel({ feast, members, onSaved }: Props) {
  const [schedule, setSchedule] = useState<CookingSchedule | null>(feast.schedule ?? null);
  const [mealTime, setMealTime] = useState<string>(feast.schedule?.mealTime ?? '18:00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      const s = await scheduleApi.generate(feast.id, mealTime);
      setSchedule(s);
    } catch (e) {
      setError(errMsg(e, '生成失败'));
    } finally {
      setBusy(false);
    }
  };

  const handleRecalculate = async () => {
    if (!schedule) return;
    setBusy(true);
    setError(null);
    try {
      const s = await scheduleApi.recalculate(feast.id, schedule.items);
      setSchedule(s);
    } catch (e) {
      setError(errMsg(e, '重算失败'));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!schedule) return;
    setBusy(true);
    setError(null);
    try {
      const s = await scheduleApi.save(feast.id, { mealTime, items: schedule.items });
      setSchedule(s);
      onSaved();
    } catch (e) {
      setError(errMsg(e, '保存失败'));
    } finally {
      setBusy(false);
    }
  };

  const toggleLock = (itemId: string) => {
    setSchedule((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it) =>
              it.id === itemId ? { ...it, locked: !it.locked } : it
            ),
          }
        : prev
    );
  };

  const handleStartTimeChange = async (itemId: string, newStart: string) => {
    if (!schedule) return;
    const items = schedule.items.map((it) => {
      if (it.id !== itemId) return it;
      const start = parseTime(newStart);
      return { ...it, startTime: formatTime(start), endTime: formatTime(start + it.duration), locked: true };
    });
    setSchedule({ ...schedule, items });
    try {
      const s = await scheduleApi.recalculate(feast.id, items);
      setSchedule(s);
    } catch (e) {
      setError(errMsg(e, '重算失败'));
    }
  };

  const items = schedule?.items ?? [];
  const conflicts = schedule?.conflicts ?? [];
  const errorCount = conflicts.filter((c) => c.severity === 'error').length;
  const warningCount = conflicts.filter((c) => c.severity === 'warning').length;

  const minStart = items.length ? Math.min(...items.map((i) => parseTime(i.startTime))) : 0;
  const maxEnd = items.length ? Math.max(...items.map((i) => parseTime(i.endTime))) : 0;
  const span = Math.max(1, maxEnd - minStart);

  const memberGroups: { key: string; name: string; avatar: string; items: ScheduleItem[] }[] = [];
  const groupMap = new Map<string, { name: string; avatar: string; items: ScheduleItem[] }>();
  for (const it of items) {
    const key = it.memberId ?? 'unassigned';
    const member = members.find((m) => m.id === it.memberId);
    const name = it.memberName ?? member?.name ?? '未分配';
    const avatar = member?.avatar ?? '👤';
    if (!groupMap.has(key)) groupMap.set(key, { name, avatar, items: [] });
    groupMap.get(key)!.items.push(it);
  }
  for (const [key, val] of groupMap) {
    val.items.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    memberGroups.push({ key, ...val });
  }

  const conflictItemIds = new Set(conflicts.flatMap((c) => c.itemIds));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-white border border-stone-200">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-rose-500" />
          <label className="text-sm text-stone-600">开饭时间</label>
          <input
            type="time"
            value={mealTime}
            onChange={(e) => setMealTime(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-rose-400"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-medium hover:shadow-md transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          生成排程
        </button>
        <button
          onClick={handleRecalculate}
          disabled={busy || !schedule}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重算（保留锁定）
        </button>
        <button
          onClick={handleSave}
          disabled={busy || !schedule}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          保存排程
        </button>
        <div className="ml-auto text-xs text-stone-400">
          {schedule ? `更新于 ${new Date(schedule.updatedAt).toLocaleString('zh-CN')}` : '尚未生成排程'}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!schedule ? (
        <div className="text-center py-12 text-stone-400 bg-white rounded-2xl border border-dashed border-stone-200">
          <CookingPot className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">设置开饭时间后点击「生成排程」，系统将根据菜品步骤、负责人与设备自动倒排时间线</p>
          <p className="text-xs mt-1 text-stone-400">历史家宴默认不包含排程，生成不影响原有页面</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-stone-700">{items.length} 个步骤</span>
            </div>
            {errorCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                <AlertOctagon className="w-3 h-3" />
                {errorCount} 个错误冲突
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                <AlertTriangle className="w-3 h-3" />
                {warningCount} 个提醒
              </span>
            )}
            {conflicts.length === 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                ✓ 无冲突
              </span>
            )}
            <span className="text-xs text-stone-400">
              时间线 {formatTime(minStart)} ~ {formatTime(maxEnd)}（开饭 {schedule.mealTime}）
            </span>
          </div>

          {conflicts.length > 0 && (
            <div className="space-y-2">
              {conflicts.map((c) => (
                <ConflictRow key={c.id} conflict={c} />
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-bold text-stone-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              按成员排程时间线
            </h4>
            {memberGroups.map((g) => (
              <div key={g.key} className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{g.avatar}</span>
                  <span className="font-semibold text-stone-800">{g.name}</span>
                  <span className="text-xs text-stone-400">
                    {g.items.length} 步 · 共 {g.items.reduce((s, i) => s + i.duration, 0)} 分钟
                  </span>
                </div>
                <div className="space-y-2">
                  {g.items.map((it) => (
                    <ScheduleItemRow
                      key={it.id}
                      item={it}
                      minStart={minStart}
                      span={span}
                      conflict={conflictItemIds.has(it.id)}
                      onToggleLock={() => toggleLock(it.id)}
                      onStartTimeChange={(v) => handleStartTimeChange(it.id, v)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {memberGroups.length === 0 && (
              <div className="text-center py-8 text-sm text-stone-400 bg-white rounded-xl border border-dashed border-stone-200">
                暂无可排程步骤，请先为任务分配负责人
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 锁定后重算将保留该步时间</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 拖动/修改开始时间将自动锁定并重算后续</span>
            <span className="flex items-center gap-1"><Save className="w-3 h-3" /> 保存后刷新页面排程与冲突状态持久化</span>
          </div>
        </>
      )}
    </div>
  );
}

function ConflictRow({ conflict }: { conflict: ScheduleConflict }) {
  const cfg = conflictConfig[conflict.type];
  const Icon = cfg.icon;
  return (
    <div className={clsx('flex items-start gap-2 p-3 rounded-xl border text-sm', cfg.bg)}>
      <Icon className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', cfg.color)} />
      <div>
        <span className={clsx('font-semibold', cfg.color)}>{cfg.label}</span>
        <span className="text-stone-600 ml-1">{conflict.message}</span>
      </div>
    </div>
  );
}

interface ItemRowProps {
  item: ScheduleItem;
  minStart: number;
  span: number;
  conflict: boolean;
  onToggleLock: () => void;
  onStartTimeChange: (v: string) => void;
}

function ScheduleItemRow({ item, minStart, span, conflict, onToggleLock, onStartTimeChange }: ItemRowProps) {
  const start = parseTime(item.startTime);
  const end = parseTime(item.endTime);
  const leftPct = ((start - minStart) / span) * 100;
  const widthPct = Math.max(2, ((end - start) / span) * 100);
  const color = stepTypeColor[item.type];

  return (
    <div
      className={clsx(
        'rounded-xl border p-3 transition-all',
        conflict ? 'border-red-200 bg-red-50/40' : 'border-stone-100 bg-stone-50/60'
      )}
    >
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <span className="text-xs font-mono text-stone-500 w-28">
          {item.startTime} - {item.endTime}
        </span>
        <span className={clsx('text-xs px-2 py-0.5 rounded-full text-white font-medium', color)}>
          {item.stepOrder}. {item.stepTitle}
        </span>
        {item.recipeName && (
          <span className="text-xs text-stone-500">· {item.recipeName}</span>
        )}
        {item.equipment && item.equipment !== 'none' && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
            <UtensilsCrossed className="w-3 h-3" />
            {equipmentLabel[item.equipment]}
          </span>
        )}
        {item.parallel && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">可并行</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-stone-400">开始</label>
          <input
            type="time"
            value={item.startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="px-2 py-1 rounded-lg border border-stone-200 text-xs outline-none focus:border-rose-400"
          />
          <button
            onClick={onToggleLock}
            title={item.locked ? '已锁定，点击解锁' : '点击锁定'}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              item.locked ? 'text-rose-500 bg-rose-50' : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100'
            )}
          >
            {item.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className="relative h-6 bg-stone-100 rounded-lg overflow-hidden">
        <div
          className={clsx('absolute top-0 bottom-0 rounded-lg flex items-center px-2', color, 'opacity-90')}
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        >
          <span className="text-[10px] text-white font-medium truncate">{item.duration}分钟</span>
        </div>
      </div>
    </div>
  );
}
