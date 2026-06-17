import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChefHat, ClipboardList, Users, MessageSquare, BarChart3, Home } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/recipes', label: '菜谱复原', icon: ChefHat },
  { to: '/steps', label: '步骤卡整理', icon: ClipboardList },
  { to: '/feasts', label: '家宴分工', icon: Users },
  { to: '/reviews', label: '复盘记录', icon: MessageSquare },
  { to: '/stats', label: '数据统计', icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                  家宴协同系统
                </h1>
                <p className="text-xs text-stone-500">传承味道 · 分工协作</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={clsx(
                      'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/30'
                        : 'text-stone-600 hover:text-orange-600 hover:bg-orange-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
        <div className="md:hidden border-t border-orange-100">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={clsx(
                    'flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all',
                    isActive ? 'text-orange-600' : 'text-stone-500'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
