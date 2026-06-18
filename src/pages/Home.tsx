import { useState, useEffect } from 'react';
import { ChefHat, Users, ClipboardList, MessageSquare, ChevronRight, Sparkles, Clock, AlertCircle, ShoppingCart, CalendarClock, CookingPot, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { statsApi, recipeApi, feastApi, scheduleApi } from '@/lib/api';
import type { StatsOverview, Recipe, Feast, FeastPurchaseOverview, ScheduleOverview, FeastRiskOverviewItem } from '@/types';

export default function Home() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [recentFeasts, setRecentFeasts] = useState<Feast[]>([]);
  const [purchaseOverview, setPurchaseOverview] = useState<FeastPurchaseOverview[]>([]);
  const [recentSchedules, setRecentSchedules] = useState<ScheduleOverview[]>([]);
  const [riskOverview, setRiskOverview] = useState<FeastRiskOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsApi.getOverview(),
      recipeApi.getAll(),
      feastApi.getAll(),
      statsApi.getPurchaseOverview(),
      scheduleApi.getRecent().catch(() => []),
      statsApi.getFeastRiskOverview().catch(() => []),
    ]).then(([overview, recipes, feasts, purchase, schedules, risks]) => {
      setOverview(overview);
      setRecentRecipes(recipes.slice(0, 3));
      setRecentFeasts(feasts.slice(0, 3));
      setPurchaseOverview(purchase);
      setRecentSchedules(schedules);
      setRiskOverview(risks);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: '菜谱总数',
      key: 'totalRecipes',
      icon: ChefHat,
      color: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50',
    },
    {
      label: '家宴次数',
      key: 'totalFeasts',
      icon: Users,
      color: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-50',
    },
    {
      label: '复盘记录',
      key: 'totalReviews',
      icon: ClipboardList,
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
    },
    {
      label: '家庭成员',
      key: 'totalMembers',
      icon: MessageSquare,
      color: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50',
    },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 p-8 md:p-12 text-white shadow-2xl shadow-orange-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-yellow-200" />
            <span className="text-sm text-orange-100 font-medium">欢迎回家，今天也要好好吃饭</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">手写菜谱复原与家宴分工协同系统</h2>
          <p className="text-orange-100 max-w-2xl text-base md:text-lg leading-relaxed">
            把长辈的味道传下去。录入手写菜谱或口述做法，自动拆解成标准化做菜卡，
            筹备家宴时智能分配任务，记录每一次的美味记忆。
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const value = overview ? overview[stat.key] : 0;
          return (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-2xl p-5 border border-white/60 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${stat.color} text-white mb-3 shadow-lg`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold text-stone-800">{value}</div>
              <div className="text-sm text-stone-500 mt-1">{stat.label}</div>
            </div>
          );
        })}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-stone-800">最近菜谱</h3>
              <p className="text-sm text-stone-500">点击菜谱复原页查看更多</p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400" />
          </div>
          <div className="space-y-3">
            {recentRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-transparent border border-orange-100 hover:border-orange-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-stone-800">{recipe.name}</h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {recipe.servings}人份
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.steps.reduce((s, step) => s + step.duration, 0)}分钟
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {recipe.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {recentRecipes.length === 0 && (
              <div className="text-center py-8 text-stone-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无菜谱</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-stone-800">最近家宴</h3>
              <p className="text-sm text-stone-500">点击家宴分工页查看更多</p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400" />
          </div>
          <div className="space-y-3">
            {recentFeasts.map((feast) => (
              <div
                key={feast.id}
                className="p-4 rounded-xl bg-gradient-to-r from-rose-50 to-transparent border border-rose-100 hover:border-rose-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-stone-800">{feast.name}</h4>
                    <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                      <span>{feast.date}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {feast.people}人
                      </span>
                      <span>{feast.recipeIds.length}道菜</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      feast.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : feast.status === 'in-progress'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {feast.status === 'completed'
                      ? '已完成'
                      : feast.status === 'in-progress'
                      ? '进行中'
                      : '筹备中'}
                  </span>
                </div>
              </div>
            ))}
            {recentFeasts.length === 0 && (
              <div className="text-center py-8 text-stone-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无知宴记录</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <CookingPot className="w-5 h-5 text-rose-500" />
              最近家宴排程概览
            </h3>
            <p className="text-sm text-stone-500 mt-1">已生成烹饪排程的家宴一览</p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentSchedules.map((s) => (
            <div
              key={s.feastId}
              className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-transparent border border-rose-100 hover:border-rose-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-stone-800 text-sm">{s.feastName}</h4>
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />
                    {s.feastDate} · 开饭 {s.mealTime}
                  </p>
                </div>
                {s.conflictCount > 0 ? (
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    {s.conflictCount} 冲突
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    无冲突
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-stone-700">{s.itemCount}</div>
                  <div className="text-stone-400">步骤</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">{s.memberCount}</div>
                  <div className="text-stone-400">成员</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-stone-700">{s.earliestStart}</div>
                  <div className="text-stone-400">最早开工</div>
                </div>
              </div>
            </div>
          ))}
          {recentSchedules.length === 0 && (
            <div className="col-span-full text-center py-8 text-stone-400">
              <CookingPot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无排程，前往家宴分工页生成烹饪排程</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              近期家宴忌口风险概览
            </h3>
            <p className="text-sm text-stone-500 mt-1">口味与忌口适配度及风险处理进度</p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {riskOverview.slice(0, 6).map((item) => {
            const scoreBg =
              item.overallScore >= 80
                ? 'from-green-400 to-emerald-500'
                : item.overallScore >= 60
                ? 'from-amber-400 to-orange-500'
                : 'from-red-400 to-rose-500';
            return (
              <div
                key={item.feastId}
                className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-transparent border border-amber-100 hover:border-amber-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-stone-800 text-sm">{item.feastName}</h4>
                    <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      {item.feastDate}
                    </p>
                  </div>
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${scoreBg} text-white text-sm font-bold shadow-md`}>
                    {item.overallScore}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs mb-2">
                  {item.riskCount > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <AlertTriangle size={12} />
                        {item.riskCount}项风险
                      </span>
                      {item.criticalCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                          <AlertCircle size={12} />
                          {item.criticalCount}项严重
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 size={12} />
                      无风险
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>处理进度</span>
                    <span className="font-medium text-stone-700">{item.processingRate}%</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${item.processingRate}%` }}
                    ></div>
                  </div>
                  {item.pendingCount > 0 && (
                    <div className="text-[11px] text-amber-600">还有{item.pendingCount}项待处理</div>
                  )}
                </div>
              </div>
            );
          })}
          {riskOverview.length === 0 && (
            <div className="col-span-full text-center py-8 text-stone-400">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无风险数据，开始创建家宴并设置成员口味画像吧</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
              近期家宴采购概览
            </h3>
            <p className="text-sm text-stone-500 mt-1">各场家宴食材采购进度一览</p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-400" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchaseOverview.map((item) => (
            <div
              key={item.feastId}
              className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-transparent border border-blue-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-stone-800 text-sm">{item.feastName}</h4>
                  <p className="text-xs text-stone-500 mt-0.5">{item.feastDate}</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  {item.completionRate}%
                </span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all"
                  style={{ width: `${item.completionRate}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-stone-700">{item.totalIngredients}</div>
                  <div className="text-stone-400">总食材</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-emerald-600">{item.purchasedCount}</div>
                  <div className="text-stone-400">已采购</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-red-500">{item.outOfStockCount}</div>
                  <div className="text-stone-400">缺货</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-amber-500">{item.replacedCount}</div>
                  <div className="text-stone-400">替代</div>
                </div>
              </div>
            </div>
          ))}
          {purchaseOverview.length === 0 && (
            <div className="col-span-full text-center py-8 text-stone-400">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无采购数据</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
