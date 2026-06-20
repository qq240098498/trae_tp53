import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const titleMap: Record<string, string> = {
  '/': '工作台',
  '/receive': '收件登记',
  '/orders': '订单管理',
  '/pickup': '取件核销',
  '/members': '会员管理',
  '/pricing': '定价配置',
  '/statistics': '数据统计',
};

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle = titleMap[location.pathname] || '工作台';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between border-b border-surface-200 bg-white px-6',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-primary-500">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-300" />
          <input
            type="text"
            placeholder="搜索订单、会员、衣物..."
            className="h-9 w-64 rounded-lg border border-surface-200 bg-surface-50 pl-10 pr-4 text-sm text-gray-700 placeholder-surface-300 outline-none transition-colors focus:border-accent-400 focus:bg-white"
          />
        </div>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-primary-500 transition-colors hover:bg-surface-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-warning-500" />
          </span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-sm font-bold text-white">
              A
            </div>
            <div className="hidden items-center gap-1 text-left md:flex">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-primary-500">管理员</span>
                <span className="text-xs text-surface-300">门店管理员</span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-surface-300 transition-transform',
                  userMenuOpen && 'rotate-180'
                )}
              />
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-surface-200 bg-white shadow-lg">
              <div className="border-b border-surface-100 p-3">
                <p className="text-sm font-medium text-primary-500">管理员</p>
                <p className="text-xs text-surface-300">admin@clean.com</p>
              </div>
              <div className="py-1">
                <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-surface-50">
                  <User className="h-4 w-4" />
                  <span>个人中心</span>
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-surface-50">
                  <Settings className="h-4 w-4" />
                  <span>系统设置</span>
                </button>
              </div>
              <div className="border-t border-surface-100 py-1">
                <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-warning-500 transition-colors hover:bg-warning-50">
                  <LogOut className="h-4 w-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
