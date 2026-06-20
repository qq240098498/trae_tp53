import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  CheckCircle,
  DollarSign,
  Clock,
  Plus,
  Scan,
  Wallet,
  Search,
  AlertTriangle,
  Send,
  ChevronRight,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useMemberStore } from '@/store/memberStore';
import {
  calculateOverdueDays,
  formatDate,
  formatRelativeTime,
  isToday,
  OVERDUE_THRESHOLD_DAYS,
} from '@/utils/dateUtils';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import { cn } from '@/lib/utils';
import type { Order, ClothingItem, OrderStatus, ClothingCategory } from '@/types';

interface StatCardConfig {
  title: string;
  value: number | string;
  description: string;
  gradient: string;
  icon: React.ReactNode;
  iconBg: string;
}

interface QuickActionConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  path: string;
}

interface OverdueItemRow {
  order: Order;
  item: ClothingItem;
  overdueDays: number;
}

const categoryNames: Record<ClothingCategory, string> = {
  laundry: '普通洗衣',
  dry_clean: '干洗',
  wash: '水洗',
  iron: '熨烫',
  leather: '皮具护理',
  shoes: '鞋子洗护',
};

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  received: { label: '已收件', variant: 'primary' },
  washing: { label: '洗涤中', variant: 'info' },
  ready: { label: '待取件', variant: 'success' },
  picked_up: { label: '已取件', variant: 'default' },
  overdue: { label: '已超期', variant: 'danger' },
};

function getCategoryName(category: ClothingCategory): string {
  return categoryNames[category] || category;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { orders, checkOverdueOrders } = useOrderStore();
  const { members } = useMemberStore();

  useEffect(() => {
    checkOverdueOrders();
  }, [checkOverdueOrders]);

  const stats = useMemo<StatCardConfig[]>(() => {
    const todayReceived = orders.reduce((count, order) => {
      if (isToday(order.createdAt)) return count + 1;
      return count;
    }, 0);

    const todayPickedUp = orders.reduce((count, order) => {
      const pickedItems = order.clothes.filter((c) => c.pickedUpAt && isToday(c.pickedUpAt));
      return count + pickedItems.length;
    }, 0);

    const todayRevenue = orders.reduce((sum, order) => {
      if (isToday(order.createdAt)) return sum + order.paidAmount;
      return sum;
    }, 0);

    const pendingPickup = orders.reduce((count, order) => {
      const pendingItems = order.clothes.filter((c) => c.status === 'ready' || c.status === 'overdue');
      return count + pendingItems.length;
    }, 0);

    return [
      {
        title: '今日收件数',
        value: todayReceived,
        description: '订单总数',
        gradient: 'from-primary-50 to-blue-50',
        icon: <Package className="h-6 w-6 text-primary-600" />,
        iconBg: 'bg-primary-100',
      },
      {
        title: '今日取件数',
        value: todayPickedUp,
        description: '衣物件数',
        gradient: 'from-accent-50 to-emerald-50',
        icon: <CheckCircle className="h-6 w-6 text-accent-600" />,
        iconBg: 'bg-accent-100',
      },
      {
        title: '今日营收',
        value: `¥${todayRevenue.toFixed(2)}`,
        description: `会员数: ${members.length}`,
        gradient: 'from-warning-50 to-orange-50',
        icon: <DollarSign className="h-6 w-6 text-warning-600" />,
        iconBg: 'bg-warning-100',
      },
      {
        title: '待取件数',
        value: pendingPickup,
        description: `超期阈值: ${OVERDUE_THRESHOLD_DAYS}天`,
        gradient: 'from-purple-50 to-indigo-50',
        icon: <Clock className="h-6 w-6 text-purple-600" />,
        iconBg: 'bg-purple-100',
      },
    ];
  }, [orders, members.length]);

  const quickActions: QuickActionConfig[] = [
    {
      title: '收件登记',
      description: '录入新订单',
      icon: <Plus className="h-7 w-7 text-white" />,
      iconBg: 'bg-gradient-to-br from-primary-500 to-primary-700',
      path: '/receive',
    },
    {
      title: '取件核销',
      description: '扫码取件',
      icon: <Scan className="h-7 w-7 text-white" />,
      iconBg: 'bg-gradient-to-br from-accent-500 to-accent-700',
      path: '/pickup',
    },
    {
      title: '会员充值',
      description: '储值充卡',
      icon: <Wallet className="h-7 w-7 text-white" />,
      iconBg: 'bg-gradient-to-br from-warning-500 to-warning-700',
      path: '/members',
    },
    {
      title: '订单查询',
      description: '搜索订单',
      icon: <Search className="h-7 w-7 text-white" />,
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-700',
      path: '/orders',
    },
  ];

  const overdueItems = useMemo<OverdueItemRow[]>(() => {
    const rows: OverdueItemRow[] = [];
    for (const order of orders) {
      if (order.status === 'picked_up') continue;
      for (const item of order.clothes) {
        if (item.status === 'picked_up') continue;
        const overdueDays = calculateOverdueDays(item.receivedAt, OVERDUE_THRESHOLD_DAYS);
        if (overdueDays > 0) {
          rows.push({ order, item, overdueDays });
        }
      }
    }
    return rows.sort((a, b) => b.overdueDays - a.overdueDays);
  }, [orders]);

  const recentOrders = useMemo<Order[]>(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  const handleSendReminder = (phone: string, customerName: string) => {
    alert(`已向 ${customerName} (${phone}) 发送取件提醒短信`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">工作台首页</h1>
          <p className="mt-1 text-sm text-gray-500">{formatDate(new Date(), 'YYYY年MM月DD日 HH:mm')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            hover
            className={cn(
              'bg-gradient-to-br overflow-hidden opacity-0',
              stat.gradient,
              'animate-fade-in-up'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-2 font-mono text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500">{stat.description}</p>
              </div>
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', stat.iconBg)}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900">快捷入口</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary-200"
              >
                <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105', action.iconBg)}>
                  {action.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800">{action.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900">最近订单</h2>
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />} onClick={() => navigate('/orders')}>
              查看全部
            </Button>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-gray-400">暂无订单</div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-surface-100 bg-surface-50 p-3 transition-colors hover:bg-surface-100"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-primary-700">{order.orderNo}</span>
                      <Tag variant={statusConfig[order.status].variant} size="sm">
                        {statusConfig[order.status].label}
                      </Tag>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {order.customerName} · {order.customerPhone} · {order.clothes.length}件衣物
                    </p>
                    <p className="text-xs text-gray-400">{formatRelativeTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-base font-bold text-primary-700">¥{order.paidAmount.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-gradient-to-r from-warning-100 to-warning-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-warning-800">
              超期提醒：当前有 <span className="text-warning-600">{overdueItems.length}</span> 件衣物超期未取
            </p>
            <p className="text-xs text-warning-700">超过 {OVERDUE_THRESHOLD_DAYS} 天未取件的衣物，请及时联系客户</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {overdueItems.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CheckCircle className="mx-auto mb-2 h-10 w-10 text-accent-400" />
              <p>暂无超期衣物</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 font-medium text-gray-600">衣物编码</th>
                  <th className="px-4 py-3 font-medium text-gray-600">客户姓名</th>
                  <th className="px-4 py-3 font-medium text-gray-600">手机号</th>
                  <th className="px-4 py-3 font-medium text-gray-600">品类</th>
                  <th className="px-4 py-3 font-medium text-gray-600">入库时间</th>
                  <th className="px-4 py-3 font-medium text-gray-600">超期天数</th>
                  <th className="px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {overdueItems.map(({ order, item, overdueDays }) => (
                  <tr
                    key={item.id}
                    className="border-b border-surface-100 transition-colors hover:bg-warning-50/50"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-primary-700">{item.code}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{order.customerName}</td>
                    <td className="px-4 py-3 text-gray-600">{order.customerPhone}</td>
                    <td className="px-4 py-3">
                      <Tag variant="primary" size="sm">
                        {getCategoryName(item.category)}
                      </Tag>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(item.receivedAt, 'YYYY-MM-DD')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-base font-bold text-red-600">{overdueDays}天</span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="warning"
                        size="sm"
                        leftIcon={<Send className="h-3.5 w-3.5" />}
                        onClick={() => handleSendReminder(order.customerPhone, order.customerName)}
                      >
                        发送提醒
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
