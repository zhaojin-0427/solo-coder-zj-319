import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  ChefHat,
  Award,
  CheckCircle2,
  ShoppingCart,
  Package,
  XCircle,
  RefreshCw,
  UtensilsCrossed,
  CookingPot,
  Timer,
  AlertOctagon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { statsApi } from '@/lib/api';
import type {
  StatsOverview,
  PopularDish,
  TimeDistributionItem,
  ErrorProneItem,
  MemberCompletion,
  PurchaseStats,
  EquipmentUsageItem,
  ScheduleSummary,
  MemberScheduleLoad,
} from '@/types';

const COLORS = ['#f97316', '#f43f5e', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#14b8a6'];

export default function Stats() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([]);
  const [timeDistribution, setTimeDistribution] = useState<TimeDistributionItem[]>([]);
  const [errorProne, setErrorProne] = useState<ErrorProneItem[]>([]);
  const [memberCompletion, setMemberCompletion] = useState<MemberCompletion[]>([]);
  const [purchaseStats, setPurchaseStats] = useState<PurchaseStats | null>(null);
  const [equipmentUsage, setEquipmentUsage] = useState<EquipmentUsageItem[]>([]);
  const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary | null>(null);
  const [memberLoad, setMemberLoad] = useState<MemberScheduleLoad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsApi.getOverview(),
      statsApi.getPopularDishes(),
      statsApi.getTimeDistribution(),
      statsApi.getErrorProne(),
      statsApi.getMemberCompletion(),
      statsApi.getPurchaseStats(),
      statsApi.getEquipmentUsage().catch(() => []),
      statsApi.getScheduleSummary().catch(() => null),
      statsApi.getMemberScheduleLoad().catch(() => []),
    ]).then(([o, p, t, e, m, ps, eu, ss, ml]) => {
      setOverview(o);
      setPopularDishes(p);
      setTimeDistribution(t);
      setErrorProne(e);
      setMemberCompletion(m);
      setPurchaseStats(ps);
      setEquipmentUsage(eu);
      setScheduleSummary(ss);
      setMemberLoad(ml);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: '菜谱总数',
      value: overview?.totalRecipes || 0,
      icon: ChefHat,
      gradient: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: '家宴次数',
      value: overview?.totalFeasts || 0,
      icon: Users,
      gradient: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-50',
      iconColor: 'text-rose-500',
    },
    {
      label: '复盘记录',
      value: overview?.totalReviews || 0,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: '家庭成员',
      value: overview?.totalMembers || 0,
      icon: Award,
      gradient: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: '采购完成率',
      value: `${purchaseStats?.purchaseCompletionRate || 0}%`,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: '缺货替代次数',
      value: (purchaseStats?.outOfStockCount || 0) + (purchaseStats?.replacedCount || 0),
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
  ];

  const pieData = timeDistribution.map((d) => ({
    name: d.label,
    value: d.avgMinutes,
  }));

  const completionChartData = memberCompletion.map((m) => ({
    name: m.name,
    完成率: m.completionRate,
    任务数: m.totalTasks,
  }));

  const purchaseStatusData = purchaseStats
    ? [
        { name: '已采购', value: purchaseStats.purchasedCount, color: '#10b981' },
        { name: '待采购', value: purchaseStats.pendingCount, color: '#94a3b8' },
        { name: '已缺货', value: purchaseStats.outOfStockCount, color: '#ef4444' },
        { name: '已替代', value: purchaseStats.replacedCount, color: '#f59e0b' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-indigo-500" />
          数据统计
        </h1>
        <p className="text-sm text-stone-500 mt-1">高频家宴菜、步骤耗时、易出错环节、成员协作完成率</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`${card.bg} rounded-2xl p-5 border border-white/60 shadow-sm`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-md`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-stone-800">{card.value}</div>
              <div className="text-sm text-stone-500 mt-1">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-2 mb-5">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-stone-800">高频家宴菜</h3>
          </div>
          {popularDishes.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularDishes} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#475569' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value} 次`, '出场次数']}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {popularDishes.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={ChefHat} text="暂无家宴记录" />
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-stone-800">各步骤平均耗时分布</h3>
          </div>
          {pieData.length > 0 && pieData.some((d) => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.filter((d) => d.value > 0).map((_, idx) => (
                      <Cell key={idx} fill={['#3b82f6', '#8b5cf6', '#f43f5e', '#10b981'][idx]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value} 分钟`, '平均耗时']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Clock} text="暂无步骤数据" />
          )}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {timeDistribution.map((t, idx) => (
              <div key={t.type} className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#f43f5e', '#10b981'][idx] }}
                ></span>
                <span className="text-stone-600">{t.label}</span>
                <span className="ml-auto font-semibold text-stone-800">{t.avgMinutes}分钟</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-stone-800">最易出错环节</h3>
          </div>
          {errorProne.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorProne} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="step"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value} 次`, '出错次数']}
                  />
                  <Bar dataKey="errorCount" radius={[6, 6, 0, 0]}>
                    {errorProne.map((_, idx) => (
                      <Cell key={idx} fill={['#f87171', '#fb923c', '#facc15', '#a78bfa', '#60a5fa'][idx % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={AlertTriangle} text="还没有出错记录，继续保持！" />
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-stone-800">家庭成员协作完成率</h3>
          </div>
          {memberCompletion.some((m) => m.totalTasks > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={memberCompletion.filter((m) => m.totalTasks > 0)}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickCount={5}
                  />
                  <Radar
                    name="完成率"
                    dataKey="completionRate"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value}%`, '完成率']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Users} text="暂无任务分配记录" />
          )}
          <div className="mt-4 space-y-2">
            {memberCompletion.map((m) => (
              <div key={m.memberId} className="flex items-center gap-3">
                <span className="text-sm text-stone-600 w-20 truncate">{m.name}</span>
                <div className="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                    style={{ width: `${m.completionRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-stone-800 w-14 text-right flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {m.completedTasks}/{m.totalTasks}
                </span>
                <span className="text-xs font-bold text-emerald-600 w-10 text-right">{m.completionRate}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-2 mb-5">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-stone-800">食材采购状态分布</h3>
          </div>
          {purchaseStatusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purchaseStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {purchaseStatusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value} 种`, '食材数量']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={ShoppingCart} text="暂无采购数据" />
          )}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-stone-600">已采购</span>
              <span className="ml-auto font-semibold text-stone-800">{purchaseStats?.purchasedCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-stone-400"></span>
              <span className="text-stone-600">待采购</span>
              <span className="ml-auto font-semibold text-stone-800">{purchaseStats?.pendingCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-stone-600">已缺货</span>
              <span className="ml-auto font-semibold text-stone-800">{purchaseStats?.outOfStockCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-stone-600">已替代</span>
              <span className="ml-auto font-semibold text-stone-800">{purchaseStats?.replacedCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-stone-800">采购指标概览</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-700 font-medium">采购完成率</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700">{purchaseStats?.purchaseCompletionRate || 0}%</div>
              <div className="text-xs text-emerald-600 mt-1">
                {purchaseStats?.purchasedCount || 0} / {purchaseStats?.totalIngredients || 0} 种食材
              </div>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-stone-500" />
                <span className="text-sm text-stone-700 font-medium">待采购数</span>
              </div>
              <div className="text-2xl font-bold text-stone-700">{purchaseStats?.pendingCount || 0}</div>
              <div className="text-xs text-stone-500 mt-1">待采购食材种类</div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 font-medium">缺货率</span>
              </div>
              <div className="text-2xl font-bold text-red-700">{purchaseStats?.outOfStockRate || 0}%</div>
              <div className="text-xs text-red-600 mt-1">
                {purchaseStats?.outOfStockCount || 0} 种食材缺货
              </div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700 font-medium">替代率</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">{purchaseStats?.replacementRate || 0}%</div>
              <div className="text-xs text-amber-600 mt-1">
                {purchaseStats?.replacedCount || 0} 种食材已替代
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-2 mb-5">
            <UtensilsCrossed className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-stone-800">厨房设备使用频率</h3>
          </div>
          {equipmentUsage.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equipmentUsage} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#475569' }}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, _name, props) => [
                      `${value} 次 · ${props.payload.totalMinutes} 分钟`,
                      '使用情况',
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {equipmentUsage.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={UtensilsCrossed} text="暂无排程数据，先生成烹饪排程" />
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-2 mb-5">
            <Timer className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-stone-800">按成员统计的排程负载时长</h3>
          </div>
          {memberLoad.some((m) => m.totalMinutes > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberLoad} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} unit="分" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, _name, props) => [
                      `${value} 分钟 · ${props.payload.itemCount} 步`,
                      '排程负载',
                    ]}
                  />
                  <Bar dataKey="totalMinutes" radius={[6, 6, 0, 0]} fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Users} text="暂无排程数据" />
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-2 mb-5">
            <CookingPot className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-stone-800">烹饪排程概览</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <CookingPot className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-700 font-medium">排程家宴数</span>
              </div>
              <div className="text-2xl font-bold text-orange-700">{scheduleSummary?.totalSchedules || 0}</div>
              <div className="text-xs text-orange-600 mt-1">已生成排程的家宴</div>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-stone-500" />
                <span className="text-sm text-stone-700 font-medium">平均步骤数</span>
              </div>
              <div className="text-2xl font-bold text-stone-700">{scheduleSummary?.avgItems || 0}</div>
              <div className="text-xs text-stone-500 mt-1">每场家宴平均步骤</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700 font-medium">平均冲突数</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">{scheduleSummary?.avgConflicts || 0}</div>
              <div className="text-xs text-amber-600 mt-1">每场家宴平均冲突</div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700 font-medium">冲突总数</span>
              </div>
              <div className="text-2xl font-bold text-red-700">{scheduleSummary?.totalConflicts || 0}</div>
              <div className="text-xs text-red-600 mt-1">所有排程冲突合计</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="h-64 flex items-center justify-center text-stone-400">
      <div className="text-center">
        <Icon className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">{text}</p>
      </div>
    </div>
  );
}
