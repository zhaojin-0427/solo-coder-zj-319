import { useState, useEffect } from 'react';
import { ChefHat, Users, ClipboardList, MessageSquare, ChevronRight, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { statsApi, recipeApi, feastApi } from '@/lib/api';
import type { StatsOverview, Recipe, Feast } from '@/types';

export default function Home() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [recentFeasts, setRecentFeasts] = useState<Feast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      statsApi.getOverview(),
      recipeApi.getAll(),
      feastApi.getAll(),
    ]).then(([overview, recipes, feasts]) => {
      setOverview(overview);
      setRecentRecipes(recipes.slice(0, 3));
      setRecentFeasts(feasts.slice(0, 3));
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
    </div>
  );
}
