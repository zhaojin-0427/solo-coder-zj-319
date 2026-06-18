import { useState, useEffect } from 'react';
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Clock,
  Flame,
  AlertTriangle,
  Lightbulb,
  ChefHat,
  Timer,
  Layers,
  UtensilsCrossed,
} from 'lucide-react';
import { recipeApi, stepApi } from '@/lib/api';
import type { Recipe, StepCard, HeatLevel, StepType, KitchenEquipment } from '@/types';
import { clsx } from 'clsx';

const heatLevelMap: Record<HeatLevel, { label: string; color: string; bg: string }> = {
  high: { label: '🔥 大火', color: 'text-red-700', bg: 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' },
  medium: { label: '🔥 中火', color: 'text-orange-700', bg: 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200' },
  low: { label: '🔥 小火', color: 'text-yellow-700', bg: 'bg-gradient-to-r from-yellow-50 to-lime-50 border-yellow-200' },
  none: { label: '✨ 无火', color: 'text-stone-600', bg: 'bg-gradient-to-r from-stone-50 to-slate-50 border-stone-200' },
};

const stepTypeMap: Record<StepType, { label: string; color: string; icon: string }> = {
  'wash-cut': { label: '洗切备菜', color: 'bg-blue-500', icon: '🔪' },
  'prep': { label: '备料调味', color: 'bg-purple-500', icon: '🧂' },
  'cooking': { label: '烹饪烧制', color: 'bg-rose-500', icon: '🍳' },
  'plating': { label: '装盘出品', color: 'bg-emerald-500', icon: '🍽️' },
};

const equipmentOptions: { value: KitchenEquipment; label: string }[] = [
  { value: 'none', label: '无设备' },
  { value: 'gas-stove', label: '燃气灶' },
  { value: 'wok', label: '炒锅' },
  { value: 'steamer', label: '蒸锅' },
  { value: 'oven', label: '烤箱' },
  { value: 'rice-cooker', label: '电饭煲' },
  { value: 'cutting-board', label: '案板' },
  { value: 'pot', label: '炖锅' },
];

export default function Steps() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<StepCard | null>(null);

  const fetchRecipes = () => {
    setLoading(true);
    recipeApi.getAll().then((data) => {
      setRecipes(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const toggleRecipe = (id: string) => {
    setExpandedRecipeId(expandedRecipeId === id ? null : id);
  };

  const handleDragStart = (step: StepCard) => {
    setDraggedStep(step);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStep: StepCard) => {
    if (!draggedStep || draggedStep.id === targetStep.id || draggedStep.recipeId !== targetStep.recipeId) {
      setDraggedStep(null);
      return;
    }

    const recipe = recipes.find((r) => r.id === draggedStep.recipeId);
    if (!recipe) return;

    const steps = [...recipe.steps];
    const fromIdx = steps.findIndex((s) => s.id === draggedStep.id);
    const toIdx = steps.findIndex((s) => s.id === targetStep.id);

    const [moved] = steps.splice(fromIdx, 1);
    steps.splice(toIdx, 0, moved);

    const reordered = steps.map((s, idx) => ({ ...s, order: idx + 1 }));

    try {
      await stepApi.reorder(
        recipe.id,
        reordered.map((s) => s.id)
      );
      fetchRecipes();
    } catch (e) {
      console.error(e);
    }
    setDraggedStep(null);
  };

  const updateStepField = async (step: StepCard, field: keyof StepCard, value: any) => {
    try {
      await stepApi.update(step.id, { [field]: value });
      fetchRecipes();
    } catch (e) {
      console.error(e);
    }
  };

  const updateRecipeField = async (recipe: Recipe, field: keyof Recipe, value: unknown) => {
    try {
      await recipeApi.update(recipe.id, { [field]: value } as Partial<Recipe>);
      fetchRecipes();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-purple-500" />
          步骤卡整理
        </h1>
        <p className="text-sm text-stone-500 mt-1">调整步骤顺序、修改火候时长、完善失误提示和经验备注</p>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16 text-stone-400 bg-white rounded-2xl border border-dashed border-stone-200">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>还没有菜谱，先去菜谱复原页新建菜谱吧</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            const totalDuration = recipe.steps.reduce((s, st) => s + st.duration, 0);
            return (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleRecipe(recipe.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                      <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-stone-800">{recipe.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-stone-500">
                        <span>{recipe.steps.length}个步骤</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          约{totalDuration}分钟
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                      {(['wash-cut', 'prep', 'cooking', 'plating'] as StepType[]).map((type) => {
                        const count = recipe.steps.filter((s) => s.type === type).length;
                        if (count === 0) return null;
                        return (
                          <span
                            key={type}
                            className={clsx(
                              'text-xs px-2.5 py-1 rounded-full text-white font-medium',
                              stepTypeMap[type].color
                            )}
                          >
                            {stepTypeMap[type].icon} {count}
                          </span>
                        );
                      })}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/50 p-4 md:p-6">
                    <div className="mb-4 p-4 rounded-xl bg-white border border-stone-200">
                      <div className="flex items-center gap-1.5 mb-3 text-stone-700 font-semibold text-sm">
                        <Timer className="w-4 h-4 text-orange-500" />
                        出品时间约束（用于烹饪排程倒排）
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-stone-500 mb-1.5">最晚出锅时间</label>
                          <input
                            type="time"
                            value={recipe.latestReadyTime ?? ''}
                            onChange={(e) =>
                              updateRecipeField(
                                recipe,
                                'latestReadyTime',
                                e.target.value || undefined
                              )
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-orange-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1.5">保温时长（分钟，超出将提示冲突）</label>
                          <input
                            type="number"
                            min={0}
                            value={recipe.keepWarmDuration ?? ''}
                            onChange={(e) =>
                              updateRecipeField(
                                recipe,
                                'keepWarmDuration',
                                e.target.value === '' ? undefined : Number(e.target.value)
                              )
                            }
                            placeholder="留空表示不限制"
                            className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-sm outline-none focus:border-orange-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-orange-200 via-rose-200 to-emerald-200 rounded-full hidden md:block"></div>

                      <div className="space-y-4">
                        {recipe.steps.map((step) => {
                          const isDragging = draggedStep?.id === step.id;
                          return (
                            <div
                              key={step.id}
                              draggable
                              onDragStart={() => handleDragStart(step)}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(step)}
                              className={clsx(
                                'relative rounded-2xl border-2 transition-all',
                                heatLevelMap[step.heatLevel].bg,
                                isDragging ? 'opacity-50 scale-[0.98]' : 'hover:shadow-md',
                                'cursor-grab active:cursor-grabbing'
                              )}
                            >
                              <div className="flex flex-col md:flex-row md:items-start gap-4 p-4 md:p-5">
                                <div className="flex md:flex-col items-center md:items-start gap-3">
                                  <div className="relative z-10 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-xl font-bold text-stone-700 border-2 border-white">
                                    {step.order}
                                  </div>
                                  <div className="md:hidden text-xs text-stone-400">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <input
                                      type="text"
                                      value={step.title}
                                      onChange={(e) => updateStepField(step, 'title', e.target.value)}
                                      className="font-bold text-lg text-stone-800 bg-white/70 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-orange-200 border border-transparent focus:border-orange-200"
                                    />
                                    <span
                                      className={clsx(
                                        'text-xs px-2.5 py-1 rounded-full text-white font-medium',
                                        stepTypeMap[step.type].color
                                      )}
                                    >
                                      {stepTypeMap[step.type].icon} {stepTypeMap[step.type].label}
                                    </span>
                                  </div>

                                  <textarea
                                    value={step.description}
                                    onChange={(e) => updateStepField(step, 'description', e.target.value)}
                                    className="w-full p-3 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 resize-none min-h-[70px]"
                                  />

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                                      <label className="block text-xs text-stone-500 mb-1.5 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> 时长
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min={1}
                                          value={step.duration}
                                          onChange={(e) => updateStepField(step, 'duration', Number(e.target.value))}
                                          className="w-full px-2 py-1 rounded-lg border border-stone-200 text-sm outline-none focus:border-orange-400"
                                        />
                                        <span className="text-xs text-stone-500">分钟</span>
                                      </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                                      <label className="block text-xs text-stone-500 mb-1.5 flex items-center gap-1">
                                        <Flame className="w-3 h-3" /> 火候
                                      </label>
                                      <select
                                        value={step.heatLevel}
                                        onChange={(e) => updateStepField(step, 'heatLevel', e.target.value as HeatLevel)}
                                        className="w-full px-2 py-1 rounded-lg border border-stone-200 text-sm outline-none focus:border-orange-400"
                                      >
                                        <option value="high">大火</option>
                                        <option value="medium">中火</option>
                                        <option value="low">小火</option>
                                        <option value="none">无火</option>
                                      </select>
                                    </div>

                                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                                      <label className="block text-xs text-stone-500 mb-1.5">类型</label>
                                      <select
                                        value={step.type}
                                        onChange={(e) => updateStepField(step, 'type', e.target.value as StepType)}
                                        className="w-full px-2 py-1 rounded-lg border border-stone-200 text-sm outline-none focus:border-orange-400"
                                      >
                                        <option value="wash-cut">洗切备菜</option>
                                        <option value="prep">备料调味</option>
                                        <option value="cooking">烹饪烧制</option>
                                        <option value="plating">装盘出品</option>
                                      </select>
                                    </div>

                                    <div className="p-3 rounded-xl bg-white border border-stone-200">
                                      <label className="block text-xs text-stone-500 mb-1.5 flex items-center gap-1">
                                        <UtensilsCrossed className="w-3 h-3" /> 设备
                                      </label>
                                      <select
                                        value={step.equipment ?? 'none'}
                                        onChange={(e) =>
                                          updateStepField(step, 'equipment', e.target.value as KitchenEquipment)
                                        }
                                        className="w-full px-2 py-1 rounded-lg border border-stone-200 text-sm outline-none focus:border-orange-400"
                                      >
                                        {equipmentOptions.map((o) => (
                                          <option key={o.value} value={o.value}>
                                            {o.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200">
                                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                                      <Layers className="w-3.5 h-3.5" />
                                      <span>与同菜其他步骤的关系</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-stone-400">
                                        当前：{step.parallel ? '可并行' : '需串行'}
                                      </span>
                                      <button
                                        onClick={() => updateStepField(step, 'parallel', !step.parallel)}
                                        className={clsx(
                                          'text-xs px-3 py-1 rounded-full font-medium transition-colors',
                                          step.parallel
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        )}
                                      >
                                        {step.parallel ? '✓ 可并行' : '↻ 需串行'}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid md:grid-cols-2 gap-3">
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-100">
                                      <div className="flex items-center gap-1.5 mb-2 text-red-700 font-semibold text-sm">
                                        <AlertTriangle className="w-4 h-4" />
                                        常见失误
                                      </div>
                                      <div className="space-y-1.5">
                                        {step.commonMistakes.length > 0 ? (
                                          step.commonMistakes.map((mistake, mIdx) => (
                                            <div
                                              key={mIdx}
                                              className="text-sm text-red-700 bg-white rounded-lg px-3 py-1.5 border border-red-100 flex items-start gap-2"
                                            >
                                              <span className="text-red-400 mt-0.5">•</span>
                                              {mistake}
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-xs text-red-300 italic">暂无失误提示</p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                                      <div className="flex items-center gap-1.5 mb-2 text-amber-700 font-semibold text-sm">
                                        <Lightbulb className="w-4 h-4" />
                                        凭经验判断
                                      </div>
                                      <textarea
                                        value={step.tips}
                                        onChange={(e) => updateStepField(step, 'tips', e.target.value)}
                                        placeholder="添加经验备注..."
                                        className="w-full p-2 rounded-lg bg-white border border-amber-200 text-sm text-amber-800 outline-none focus:ring-2 focus:ring-amber-100 resize-none min-h-[60px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-white/70 border border-stone-200 flex items-center justify-center gap-2 text-sm text-stone-500">
                      <GripVertical className="w-4 h-4" />
                      <span>拖动步骤卡片可调整顺序</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
