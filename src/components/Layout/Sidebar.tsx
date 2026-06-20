import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  ClipboardList,
  QrCode,
  Users,
  Tag,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Shirt,
  MapPin,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/receive', label: '收件登记', icon: Inbox },
  { path: '/orders', label: '订单管理', icon: ClipboardList },
  { path: '/pickup', label: '取件核销', icon: QrCode },
  { path: '/members', label: '会员管理', icon: Users },
  { path: '/pickup-points', label: '收件点管理', icon: MapPin },
  { path: '/batches', label: '批次单管理', icon: Package },
  { path: '/pricing', label: '定价配置', icon: Tag },
  { path: '/statistics', label: '数据统计', icon: BarChart3 },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-primary-500 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500">
            <Shirt className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">洁衣管家</span>
              <span className="text-xs text-primary-200">智能洗衣管理</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-primary-100 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-2',
            collapsed && 'justify-center'
          )}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-sm font-bold">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">管理员</p>
              <p className="truncate text-xs text-primary-200">admin@clean.com</p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-10 items-center justify-center border-t border-white/10 text-primary-200 transition-colors hover:bg-white/10 hover:text-white"
      >
        {collapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>
    </aside>
  );
}
