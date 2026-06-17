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
} from '@/types';

const COLORS = ['#f97316', '#f43f5e', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#14b8a6'];

export default function Stats() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>([]);
  const [timeDistribution, setTimeDistribution] = useState<TimeDistributionItem[]>([]);
  const [errorProne, setErrorProne] = useState<ErrorProneItem[]>([]);
  const [memberCompletion, setMemberCompletion] = useState<MemberCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsApi.getOverview(),
      statsApi.getPopularDishes(),
      statsApi.getTimeDistribution(),
      statsApi.getErrorProne(),
      statsApi.getMemberCompletion(),
    ]).then(([o, p, t, e, m]) => {
      setOverview(o);
      setPopularDishes(p);
      setTimeDistribution(t);
      setErrorProne(e);
      setMemberCompletion(m);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-indigo-500" />
          数据统计
        </h1>
        <p className="text-sm text-stone-500 mt-1">高频家宴菜、步骤耗时、易出错环节、成员协作完成率</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
