import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  ChefHat,
  Calendar,
  RefreshCw,
  Check,
  CheckCircle2,
  Circle,
  ShoppingCart,
  Trash2,
  Edit3,
  AlertTriangle,
  ArrowLeftRight,
  Clock,
  Package,
  CookingPot,
} from 'lucide-react';
import { feastApi, recipeApi, memberApi } from '@/lib/api';
import FeastSchedulePanel from '@/components/FeastSchedulePanel';
import type {
  Feast,
  Recipe,
  Member,
  FeastTask,
  TaskType,
  FeastStatus,
  CalculatedIngredient,
  PurchaseStatus,
  ReplacementIngredient,
} from '@/types';
import { clsx } from 'clsx';

const taskTypeConfig: Record<TaskType, { label: string; color: string; icon: string; bg: string }> = {
  'wash-cut': { label: '洗切备菜', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200', icon: '🔪' },
  'prep': { label: '备料调味', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200', icon: '🧂' },
  'cooking': { label: '烹饪烧制', color: 'text-rose-700', bg: 'bg-rose-100 border-rose-200', icon: '🍳' },
  'plating': { label: '装盘出品', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200', icon: '🍽️' },
};

const statusConfig: Record<FeastStatus, { label: string; color: string; dot: string }> = {
  planning: { label: '筹备中', color: 'bg-stone-100 text-stone-700', dot: 'bg-stone-400' },
  'in-progress': { label: '进行中', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
};

const categoryLabels: Record<string, { label: string; color: string }> = {
  main: { label: '主料', color: 'bg-rose-100 text-rose-700' },
  seasoning: { label: '调料', color: 'bg-amber-100 text-amber-700' },
  side: { label: '配菜', color: 'bg-emerald-100 text-emerald-700' },
};

const purchaseStatusConfig: Record<PurchaseStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: '待采购', color: 'text-stone-600', bg: 'bg-stone-100 border-stone-200', dot: 'bg-stone-400' },
  purchased: { label: '已采购', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200', dot: 'bg-emerald-500' },
  'out-of-stock': { label: '已缺货', color: 'text-red-700', bg: 'bg-red-100 border-red-200', dot: 'bg-red-500' },
  replaced: { label: '已替代', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200', dot: 'bg-amber-500' },
};

function getPurchaseStats(ingredients: CalculatedIngredient[]) {
  const total = ingredients.length;
  let purchased = 0;
  let pending = 0;
  let outOfStock = 0;
  let replaced = 0;

  for (const ing of ingredients) {
    const status = ing.purchaseStatus || 'pending';
    switch (status) {
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
    total,
    purchased,
    pending,
    outOfStock,
    replaced,
    completionRate: total > 0 ? Math.round((purchased / total) * 100) : 0,
  };
}

export default function Feasts() {
  const [feasts, setFeasts] = useState<Feast[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [feastTab, setFeastTab] = useState<'plan' | 'schedule'>('plan');

  const [feastName, setFeastName] = useState('');
  const [feastDate, setFeastDate] = useState(new Date().toISOString().split('T')[0]);
  const [feastPeople, setFeastPeople] = useState(4);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [f, r, m] = await Promise.all([
      feastApi.getAll(),
      recipeApi.getAll(),
      memberApi.getAll(),
    ]);
    setFeasts(f);
    setRecipes(r);
    setMembers(m);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleRecipe = (id: string) => {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!feastName.trim() || selectedRecipes.length === 0) return;
    try {
      await feastApi.create({
        name: feastName,
        date: feastDate,
        people: feastPeople,
        recipeIds: selectedRecipes,
      });
      setShowModal(false);
      setActiveTab('list');
      setFeastName('');
      setSelectedRecipes([]);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecalculate = async (feastId: string, people: number) => {
    try {
      await feastApi.recalculate(feastId, people);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (feastId: string, status: FeastStatus) => {
    try {
      await feastApi.update(feastId, { status });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignTask = async (feastId: string, taskId: string, memberId: string | undefined) => {
    try {
      await feastApi.updateTask(feastId, taskId, { assignedMemberId: memberId });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTask = async (feastId: string, taskId: string, completed: boolean) => {
    try {
      await feastApi.updateTask(feastId, taskId, { completed });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFeast = async (id: string) => {
    if (!confirm('确定要删除这个家宴吗？')) return;
    try {
      await feastApi.delete(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePurchaseStatus = async (
    feastId: string,
    ingredientName: string,
    status: PurchaseStatus,
    outOfStockNote?: string,
    replacement?: ReplacementIngredient
  ) => {
    try {
      await feastApi.updateIngredientPurchaseStatus(feastId, ingredientName, {
        status,
        outOfStockNote,
        replacement,
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const getMemberById = (id?: string) => members.find((m) => m.id === id);
  const getRecipeById = (id: string) => recipes.find((r) => r.id === id);

  const groupedIngredients = (ings: CalculatedIngredient[]) => {
    const groups: Record<string, CalculatedIngredient[]> = { main: [], seasoning: [], side: [] };
    for (const ing of ings) {
      const cat = ing.category || 'main';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ing);
    }
    return groups;
  };

  const groupedTasks = (tasks: FeastTask[]) => {
    const groups: Record<TaskType, FeastTask[]> = {
      'wash-cut': [],
      'prep': [],
      'cooking': [],
      'plating': [],
    };
    for (const task of tasks) {
      groups[task.type].push(task);
    }
    return groups;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-rose-500" />
            家宴分工
          </h1>
          <p className="text-sm text-stone-500 mt-1">按人数自动换算食材用量，给家庭成员分配洗切备料任务</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true);
            setActiveTab('create');
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-rose-500/30 hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          新建家宴
        </button>
      </div>

      {feasts.length === 0 ? (
        <div className="text-center py-16 text-stone-400 bg-white rounded-2xl border border-dashed border-stone-200">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>还没有家宴记录，点击右上角创建第一场家宴吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feasts.map((feast) => {
            const isExpanded = expandedId === feast.id;
            const completedTasks = feast.tasks.filter((t) => t.completed).length;
            const totalTasks = feast.tasks.length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const purchaseStats = getPurchaseStats(feast.ingredients);

            return (
              <div
                key={feast.id}
                className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : feast.id)}
                  className="w-full px-6 py-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md shadow-rose-500/20">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-stone-800">{feast.name}</h3>
                          <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', statusConfig[feast.status].color)}>
                            <span className={clsx('inline-block w-1.5 h-1.5 rounded-full mr-1.5', statusConfig[feast.status].dot)}></span>
                            {statusConfig[feast.status].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-stone-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {feast.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {feast.people}人
                          </span>
                          <span className="flex items-center gap-1">
                            <ChefHat className="w-3.5 h-3.5" />
                            {feast.recipeIds.length}道菜
                          </span>
                          <span>{completedTasks}/{totalTasks}任务完成</span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="w-3.5 h-3.5" />
                            采购 {purchaseStats.purchased}/{purchaseStats.total}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex flex-col gap-1 w-40">
                        <div className="text-xs text-stone-400 flex items-center gap-1">
                          <span>任务进度</span>
                          <span className="ml-auto text-emerald-600 font-medium">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                          <span>采购进度</span>
                          <span className="ml-auto text-blue-600 font-medium">{purchaseStats.completionRate}%</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all"
                            style={{ width: `${purchaseStats.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="sm:hidden text-sm text-emerald-600 font-medium">{progress}%</div>
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-stone-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/50 p-4 md:p-6 space-y-6">
                    <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 pb-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-stone-600">人数:</label>
                        <select
                          value={feast.people}
                          onChange={(e) => handleRecalculate(feast.id, Number(e.target.value))}
                          className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-sm outline-none focus:border-rose-400"
                        >
                          {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                            <option key={n} value={n}>{n}人</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleRecalculate(feast.id, feast.people)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        重新换算
                      </button>
                      <div className="flex-1"></div>
                      <select
                        value={feast.status}
                        onChange={(e) => handleUpdateStatus(feast.id, e.target.value as FeastStatus)}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-sm outline-none focus:border-rose-400"
                      >
                        <option value="planning">筹备中</option>
                        <option value="in-progress">进行中</option>
                        <option value="completed">已完成</option>
                      </select>
                      <button
                        onClick={() => handleDeleteFeast(feast.id)}
                        className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFeastTab('plan')}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          feastTab === 'plan' ? 'bg-rose-500 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'
                        )}
                      >
                        食材与采购分工
                      </button>
                      <button
                        onClick={() => setFeastTab('schedule')}
                        className={clsx(
                          'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          feastTab === 'schedule' ? 'bg-rose-500 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'
                        )}
                      >
                        <CookingPot className="w-3.5 h-3.5" />
                        烹饪排程
                      </button>
                      {feast.schedule && (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                          已排程
                        </span>
                      )}
                    </div>

                    {feastTab === 'schedule' ? (
                      <FeastSchedulePanel feast={feast} recipes={recipes} members={members} onSaved={fetchData} />
                    ) : (
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-stone-800 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-amber-500" />
                            食材清单（{feast.people}人份）
                          </h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1 text-emerald-600">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              已采购 {purchaseStats.purchased}
                            </span>
                            <span className="flex items-center gap-1 text-stone-500">
                              <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                              待采购 {purchaseStats.pending}
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              缺货 {purchaseStats.outOfStock}
                            </span>
                            <span className="flex items-center gap-1 text-amber-500">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              替代 {purchaseStats.replaced}
                            </span>
                          </div>
                        </div>
                        {Object.entries(groupedIngredients(feast.ingredients)).map(([cat, ings]) => {
                          if (ings.length === 0) return null;
                          const cfg = categoryLabels[cat] || categoryLabels.main;
                          return (
                            <div key={cat}>
                              <div className={clsx('text-xs font-semibold mb-2 inline-block px-2 py-1 rounded-md', cfg.color)}>
                                {cfg.label}
                              </div>
                              <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                                {ings.map((ing, idx) => {
                                  const status = ing.purchaseStatus || 'pending';
                                  const statusCfg = purchaseStatusConfig[status];
                                  return (
                                    <div key={idx} className="px-4 py-3">
                                      <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => {
                                              const nextStatus: PurchaseStatus = status === 'purchased' ? 'pending' : 'purchased';
                                              handleUpdatePurchaseStatus(feast.id, ing.name, nextStatus);
                                            }}
                                            className={clsx(
                                              'flex-shrink-0 transition-colors',
                                              status === 'purchased' ? 'text-emerald-500' : 'text-stone-300 hover:text-stone-500'
                                            )}
                                          >
                                            {status === 'purchased' ? (
                                              <CheckCircle2 className="w-5 h-5" />
                                            ) : (
                                              <Circle className="w-5 h-5" />
                                            )}
                                          </button>
                                          <div>
                                            <span className={clsx(
                                              'text-stone-700 font-medium',
                                              status === 'purchased' && 'text-stone-400 line-through'
                                            )}>
                                              {ing.name}
                                            </span>
                                            <p className="text-xs text-stone-400 mt-0.5">
                                              {ing.sourceRecipes.join('、')}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-stone-800">
                                            {ing.amount} {ing.unit}
                                          </span>
                                          <select
                                            value={status}
                                            onChange={(e) => handleUpdatePurchaseStatus(
                                              feast.id,
                                              ing.name,
                                              e.target.value as PurchaseStatus
                                            )}
                                            className={clsx(
                                              'px-2 py-1 rounded-lg border text-xs font-medium outline-none focus:ring-2 focus:ring-offset-1',
                                              statusCfg.bg,
                                              statusCfg.color,
                                              'border-transparent'
                                            )}
                                          >
                                            <option value="pending">待采购</option>
                                            <option value="purchased">已采购</option>
                                            <option value="out-of-stock">已缺货</option>
                                            <option value="replaced">已替代</option>
                                          </select>
                                        </div>
                                      </div>
                                      {status === 'out-of-stock' && (
                                        <div className="mt-2 ml-7 pl-3 border-l-2 border-red-200 bg-red-50/50 rounded-r-lg p-2">
                                          <div className="flex items-center gap-1 text-xs text-red-600 font-medium mb-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            缺货备注
                                          </div>
                                          <input
                                            type="text"
                                            value={ing.outOfStockNote || ''}
                                            onChange={(e) => handleUpdatePurchaseStatus(
                                              feast.id,
                                              ing.name,
                                              'out-of-stock',
                                              e.target.value
                                            )}
                                            placeholder="请输入缺货原因..."
                                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-red-200 bg-white outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
                                          />
                                        </div>
                                      )}
                                      {status === 'replaced' && (
                                        <div className="mt-2 ml-7 pl-3 border-l-2 border-amber-200 bg-amber-50/50 rounded-r-lg p-2 space-y-2">
                                          <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                                            <ArrowLeftRight className="w-3 h-3" />
                                            替代食材
                                          </div>
                                          <div className="grid grid-cols-3 gap-2">
                                            <input
                                              type="text"
                                              value={ing.replacement?.name || ''}
                                              onChange={(e) => handleUpdatePurchaseStatus(
                                                feast.id,
                                                ing.name,
                                                'replaced',
                                                undefined,
                                                {
                                                  name: e.target.value,
                                                  amount: ing.replacement?.amount || ing.amount,
                                                  unit: ing.replacement?.unit || ing.unit,
                                                  note: ing.replacement?.note,
                                                }
                                              )}
                                              placeholder="食材名称"
                                              className="col-span-2 px-2 py-1.5 text-xs rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400"
                                            />
                                            <div className="flex gap-1">
                                              <input
                                                type="number"
                                                value={ing.replacement?.amount || ''}
                                                onChange={(e) => handleUpdatePurchaseStatus(
                                                  feast.id,
                                                  ing.name,
                                                  'replaced',
                                                  undefined,
                                                  {
                                                    name: ing.replacement?.name || '',
                                                    amount: Number(e.target.value),
                                                    unit: ing.replacement?.unit || ing.unit,
                                                    note: ing.replacement?.note,
                                                  }
                                                )}
                                                placeholder="数量"
                                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400"
                                              />
                                            </div>
                                          </div>
                                          <input
                                            type="text"
                                            value={ing.replacement?.unit || ''}
                                            onChange={(e) => handleUpdatePurchaseStatus(
                                              feast.id,
                                              ing.name,
                                              'replaced',
                                              undefined,
                                              {
                                                name: ing.replacement?.name || '',
                                                amount: ing.replacement?.amount || ing.amount,
                                                unit: e.target.value,
                                                note: ing.replacement?.note,
                                              }
                                            )}
                                            placeholder="单位"
                                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400"
                                          />
                                          <input
                                            type="text"
                                            value={ing.replacement?.note || ''}
                                            onChange={(e) => handleUpdatePurchaseStatus(
                                              feast.id,
                                              ing.name,
                                              'replaced',
                                              undefined,
                                              {
                                                name: ing.replacement?.name || '',
                                                amount: ing.replacement?.amount || ing.amount,
                                                unit: ing.replacement?.unit || ing.unit,
                                                note: e.target.value,
                                              }
                                            )}
                                            placeholder="备注说明（可选）"
                                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {feast.ingredients.length === 0 && (
                          <div className="text-center py-6 text-sm text-stone-400 bg-white rounded-xl border border-dashed border-stone-200">
                            暂无食材
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-stone-800 flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-500" />
                          分工任务
                        </h4>
                        {Object.entries(groupedTasks(feast.tasks)).map(([type, tasks]) => {
                          const cfg = taskTypeConfig[type as TaskType];
                          if (tasks.length === 0) return null;
                          return (
                            <div key={type}>
                              <div className={clsx('text-xs font-semibold mb-2 inline-flex items-center gap-1 px-2 py-1 rounded-md', cfg.color, 'border', cfg.bg)}>
                                <span>{cfg.icon}</span>
                                {cfg.label}
                              </div>
                              <div className="space-y-2">
                                {tasks.map((task) => {
                                  const assignee = getMemberById(task.assignedMemberId);
                                  return (
                                    <div
                                      key={task.id}
                                      className={clsx(
                                        'bg-white rounded-xl border p-3 flex items-center gap-3 transition-all',
                                        task.completed ? 'border-emerald-200 bg-emerald-50/50' : 'border-stone-200'
                                      )}
                                    >
                                      <button
                                        onClick={() => handleToggleTask(feast.id, task.id, !task.completed)}
                                        className={clsx(
                                          'flex-shrink-0',
                                          task.completed ? 'text-emerald-500' : 'text-stone-300 hover:text-stone-500'
                                        )}
                                      >
                                        {task.completed ? (
                                          <Check className="w-5 h-5" />
                                        ) : (
                                          <Circle className="w-5 h-5" />
                                        )}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <p className={clsx('text-sm font-medium', task.completed ? 'text-stone-400 line-through' : 'text-stone-700')}>
                                          {task.description}
                                        </p>
                                        {task.recipeName && (
                                          <p className="text-xs text-stone-400 mt-0.5">{task.recipeName}</p>
                                        )}
                                      </div>
                                      <select
                                        value={task.assignedMemberId || ''}
                                        onChange={(e) => handleAssignTask(feast.id, task.id, e.target.value || undefined)}
                                        className="px-2 py-1 rounded-lg border border-stone-200 bg-white text-xs outline-none focus:border-rose-300"
                                      >
                                        <option value="">未分配</option>
                                        {members.map((m) => (
                                          <option key={m.id} value={m.id}>
                                            {m.avatar} {m.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {feast.tasks.length === 0 && (
                          <div className="text-center py-6 text-sm text-stone-400 bg-white rounded-xl border border-dashed border-stone-200">
                            暂无任务
                          </div>
                        )}
                      </div>
                    </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-800">新建家宴</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-700 mb-2">家宴名称 *</label>
                  <input
                    type="text"
                    value={feastName}
                    onChange={(e) => setFeastName(e.target.value)}
                    placeholder="如：周末家庭聚餐、妈妈生日宴"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">日期</label>
                  <input
                    type="date"
                    value={feastDate}
                    onChange={(e) => setFeastDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">用餐人数</label>
                  <input
                    type="number"
                    min={1}
                    value={feastPeople}
                    onChange={(e) => setFeastPeople(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-stone-700">
                    选择菜品（{selectedRecipes.length}道已选）
                  </label>
                  <span className="text-xs text-stone-400">
                    {selectedRecipes.reduce((sum, rid) => {
                      const r = getRecipeById(rid);
                      return sum + (r?.servings || 0);
                    }, 0)}人份基准
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 max-h-[300px overflow-y-auto p-1">
                  {recipes.map((recipe) => {
                    const isSelected = selectedRecipes.includes(recipe.id);
                    return (
                      <button
                        key={recipe.id}
                        onClick={() => toggleRecipe(recipe.id)}
                        className={clsx(
                          'text-left p-4 rounded-xl border-2 transition-all',
                          isSelected
                            ? 'border-rose-400 bg-rose-50 shadow-sm'
                            : 'border-stone-200 hover:border-rose-200 bg-white'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={clsx(
                                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                isSelected ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-500'
                              )}
                            >
                              {isSelected ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-stone-800">{recipe.name}</p>
                              <p className="text-xs text-stone-500">{recipe.source}</p>
                            </div>
                          </div>
                          <span className="text-xs text-stone-500">{recipe.servings}人份</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {recipe.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className={clsx(
                                'text-xs px-2 py-0.5 rounded-full',
                                isSelected ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600'
                              )}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100 bg-stone-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl text-stone-600 hover:bg-stone-200 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!feastName.trim() || selectedRecipes.length === 0}
                className={clsx(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all',
                  !feastName.trim() || selectedRecipes.length === 0
                    ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-xl'
                )}
              >
                <Plus className="w-4 h-4" />
                创建家宴
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
