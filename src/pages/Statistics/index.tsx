import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  CreditCard,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useOrderStore } from '@/store/orderStore';
import { useMemberStore } from '@/store/memberStore';
import {
  formatDate,
  startOfDay,
  endOfDay,
  addDays,
  diffInDays,
  getToday,
} from '@/utils/dateUtils';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import { cn } from '@/lib/utils';
import type { Order, Member, ClothingCategory, WashMethod, MemberLevel } from '@/types';

type TimeRangeType = 'day' | 'week' | 'month' | 'custom';

interface DateRange {
  start: Date;
  end: Date;
}

const categoryNames: Record<ClothingCategory, string> = {
  laundry: '普通洗衣',
  dry_clean: '干洗',
  wash: '水洗',
  iron: '熨烫',
  leather: '皮具护理',
  shoes: '鞋子洗护',
};

const washMethodNames: Record<WashMethod, string> = {
  standard: '标准洗',
  gentle: '轻柔洗',
  deep_clean: '深度清洗',
  hand_wash: '手洗',
};

const memberLevelNames: Record<MemberLevel, string> = {
  normal: '普通会员',
  silver: '银卡会员',
  gold: '金卡会员',
  platinum: '铂金会员',
};

const CHART_COLORS = [
  '#1e3a5f',
  '#3eb489',
  '#ff8c42',
  '#7c3aed',
  '#0ea5e9',
  '#f59e0b',
];

function getDefaultDateRange(type: TimeRangeType): DateRange {
  const today = getToday();
  switch (type) {
    case 'day':
      return { start: today, end: today };
    case 'week':
      return { start: addDays(today, -6), end: today };
    case 'month':
      return { start: addDays(today, -29), end: today };
    default:
      return { start: addDays(today, -6), end: today };
  }
}

function isInDateRange(dateStr: string, range: DateRange): boolean {
  const d = new Date(dateStr);
  return d >= startOfDay(range.start) && d <= endOfDay(range.end);
}

function getPreviousRange(range: DateRange): DateRange {
  const days = diffInDays(range.start, range.end) + 1;
  const prevEnd = addDays(range.start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));
  return { start: prevStart, end: prevEnd };
}

function formatMoney(value: number): string {
  return `¥${value.toFixed(2)}`;
}

function getGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function generateDateList(range: DateRange): Date[] {
  const dates: Date[] = [];
  const days = diffInDays(range.start, range.end) + 1;
  for (let i = 0; i < days; i++) {
    dates.push(addDays(range.start, i));
  }
  return dates;
}

interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

interface PaymentMethodPoint {
  name: string;
  value: number;
}

interface CategoryOrderPoint {
  name: string;
  value: number;
}

interface WashMethodPoint {
  name: string;
  count: number;
}

interface MemberGrowthPoint {
  date: string;
  count: number;
}

interface MemberLevelPoint {
  name: string;
  value: number;
}

interface MemberRankItem {
  rank: number;
  memberNo: string;
  name: string;
  level: MemberLevel;
  totalSpent: number;
  orderCount: number;
}

export default function Statistics() {
  const { orders } = useOrderStore();
  const { members } = useMemberStore();

  const [rangeType, setRangeType] = useState<TimeRangeType>('week');
  const [dateRange, setDateRange] = useState<DateRange>(() => getDefaultDateRange('week'));
  const [customStart, setCustomStart] = useState(formatDate(addDays(getToday(), -6), 'YYYY-MM-DD'));
  const [customEnd, setCustomEnd] = useState(formatDate(getToday(), 'YYYY-MM-DD'));
  const [activeTab, setActiveTab] = useState<'revenue' | 'business' | 'member'>('revenue');

  const handleRangeChange = (type: TimeRangeType) => {
    setRangeType(type);
    if (type !== 'custom') {
      setDateRange(getDefaultDateRange(type));
    }
  };

  const handleCustomApply = () => {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      setDateRange({ start, end });
    }
  };

  const shiftDateRange = (direction: -1 | 1) => {
    const days = diffInDays(dateRange.start, dateRange.end) + 1;
    const shiftDays = days * direction;
    setDateRange({
      start: addDays(dateRange.start, shiftDays),
      end: addDays(dateRange.end, shiftDays),
    });
  };

  const previousRange = useMemo(() => getPreviousRange(dateRange), [dateRange]);

  const currentOrders = useMemo(
    () => orders.filter((o) => isInDateRange(o.createdAt, dateRange)),
    [orders, dateRange]
  );

  const previousOrders = useMemo(
    () => orders.filter((o) => isInDateRange(o.createdAt, previousRange)),
    [orders, previousRange]
  );

  const currentMembers = useMemo(
    () => members.filter((m) => isInDateRange(m.createdAt, dateRange)),
    [members, dateRange]
  );

  const previousMembers = useMemo(
    () => members.filter((m) => isInDateRange(m.createdAt, previousRange)),
    [members, previousRange]
  );

  const stats = useMemo(() => {
    const currentRevenue = currentOrders.reduce((sum, o) => sum + o.paidAmount, 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + o.paidAmount, 0);

    const currentOrderCount = currentOrders.length;
    const previousOrderCount = previousOrders.length;

    const currentNewMembers = currentMembers.length;
    const previousNewMembers = previousMembers.length;

    const currentAvgTicket = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
    const previousAvgTicket = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;

    return [
      {
        title: '总营收',
        value: formatMoney(currentRevenue),
        growth: getGrowthRate(currentRevenue, previousRevenue),
        icon: <DollarSign className="h-6 w-6 text-primary-600" />,
        iconBg: 'bg-primary-100',
        gradient: 'from-primary-50 to-blue-50',
      },
      {
        title: '订单数量',
        value: currentOrderCount,
        growth: getGrowthRate(currentOrderCount, previousOrderCount),
        icon: <ShoppingBag className="h-6 w-6 text-accent-600" />,
        iconBg: 'bg-accent-100',
        gradient: 'from-accent-50 to-emerald-50',
      },
      {
        title: '新增会员数',
        value: currentNewMembers,
        growth: getGrowthRate(currentNewMembers, previousNewMembers),
        icon: <Users className="h-6 w-6 text-warning-600" />,
        iconBg: 'bg-warning-100',
        gradient: 'from-warning-50 to-orange-50',
      },
      {
        title: '平均客单价',
        value: formatMoney(currentAvgTicket),
        growth: getGrowthRate(currentAvgTicket, previousAvgTicket),
        icon: <CreditCard className="h-6 w-6 text-purple-600" />,
        iconBg: 'bg-purple-100',
        gradient: 'from-purple-50 to-indigo-50',
      },
    ];
  }, [currentOrders, previousOrders, currentMembers, previousMembers]);

  const revenueTrendData = useMemo<RevenueTrendPoint[]>(() => {
    const dates = generateDateList(dateRange);
    return dates.map((d) => {
      const dayRevenue = orders
        .filter((o) => isInDateRange(o.createdAt, { start: d, end: d }))
        .reduce((sum, o) => sum + o.paidAmount, 0);
      return {
        date: formatDate(d, 'MM-DD'),
        revenue: Number(dayRevenue.toFixed(2)),
      };
    });
  }, [orders, dateRange]);

  const paymentMethodData = useMemo<PaymentMethodPoint[]>(() => {
    const map = new Map<string, number>();
    for (const order of currentOrders) {
      const current = map.get(order.paymentMethod) ?? 0;
      map.set(order.paymentMethod, current + order.paidAmount);
    }
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [currentOrders]);

  const categoryOrderData = useMemo<CategoryOrderPoint[]>(() => {
    const map = new Map<ClothingCategory, number>();
    for (const order of currentOrders) {
      for (const item of order.clothes) {
        const current = map.get(item.category) ?? 0;
        map.set(item.category, current + 1);
      }
    }
    return Array.from(map.entries()).map(([category, value]) => ({
      name: categoryNames[category] || category,
      value,
    }));
  }, [currentOrders]);

  const washMethodData = useMemo<WashMethodPoint[]>(() => {
    const map = new Map<WashMethod, number>();
    for (const order of currentOrders) {
      for (const item of order.clothes) {
        const current = map.get(item.washMethod) ?? 0;
        map.set(item.washMethod, current + 1);
      }
    }
    return (Object.keys(washMethodNames) as WashMethod[]).map((method) => ({
      name: washMethodNames[method],
      count: map.get(method) ?? 0,
    }));
  }, [currentOrders]);

  const memberGrowthData = useMemo<MemberGrowthPoint[]>(() => {
    const dates = generateDateList(dateRange);
    let cumulative = members.filter((m) => new Date(m.createdAt) < startOfDay(dateRange.start)).length;
    return dates.map((d) => {
      const dayNew = members.filter((m) => isInDateRange(m.createdAt, { start: d, end: d })).length;
      cumulative += dayNew;
      return {
        date: formatDate(d, 'MM-DD'),
        count: cumulative,
      };
    });
  }, [members, dateRange]);

  const memberLevelData = useMemo<MemberLevelPoint[]>(() => {
    const map = new Map<MemberLevel, number>();
    for (const member of members) {
      const current = map.get(member.level) ?? 0;
      map.set(member.level, current + 1);
    }
    return Array.from(map.entries()).map(([level, value]) => ({
      name: memberLevelNames[level] || level,
      value,
    }));
  }, [members]);

  const memberRankData = useMemo<MemberRankItem[]>(() => {
    return [...members]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map((m, idx) => ({
        rank: idx + 1,
        memberNo: m.memberNo,
        name: m.name,
        level: m.level,
        totalSpent: m.totalSpent,
        orderCount: m.orderCount,
      }));
  }, [members]);

  const tabs = [
    { key: 'revenue' as const, label: '营收分析', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'business' as const, label: '业务分析', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'member' as const, label: '会员分析', icon: <PieChartIcon className="h-4 w-4" /> },
  ];

  const levelTagVariant: Record<MemberLevel, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
    normal: 'default',
    silver: 'info',
    gold: 'warning',
    platinum: 'purple',
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">数据统计</h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(dateRange.start, 'YYYY年MM月DD日')} - {formatDate(dateRange.end, 'YYYY年MM月DD日')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-surface-200 bg-white p-1">
            {(['day', 'week', 'month'] as TimeRangeType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleRangeChange(type)}
                className={cn(
                  'h-8 rounded-md px-3 text-sm font-medium transition-all duration-200',
                  rangeType === type
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-surface-50'
                )}
              >
                {type === 'day' ? '日' : type === 'week' ? '周' : '月'}
              </button>
            ))}
            <button
              onClick={() => handleRangeChange('custom')}
              className={cn(
                'h-8 rounded-md px-3 text-sm font-medium transition-all duration-200',
                rangeType === 'custom'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-surface-50'
              )}
            >
              自定义
            </button>
          </div>

          {rangeType === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2 py-1">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-7 bg-transparent text-sm text-gray-700 outline-none"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-7 bg-transparent text-sm text-gray-700 outline-none"
                />
              </div>
              <Button size="sm" onClick={handleCustomApply}>
                应用
              </Button>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftDateRange(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-gray-600 transition-all hover:bg-surface-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => shiftDateRange(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-gray-600 transition-all hover:bg-surface-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            hover
            className={cn(
              'bg-gradient-to-br overflow-hidden opacity-0 animate-fade-in-up',
              stat.gradient
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-2 font-mono text-3xl font-bold text-gray-900">{stat.value}</p>
                <div className="mt-2 flex items-center gap-1">
                  {stat.growth >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-accent-600" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      stat.growth >= 0 ? 'text-accent-600' : 'text-red-500'
                    )}
                  >
                    {stat.growth >= 0 ? '+' : ''}
                    {stat.growth.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">环比</span>
                </div>
              </div>
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', stat.iconBg)}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-surface-200 bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium transition-all duration-200',
              activeTab === tab.key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-surface-50'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-900">营收趋势</h2>
              <Tag variant="primary" size="sm">
                按日统计
              </Tag>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `¥${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [formatMoney(value), '营收']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1e3a5f"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-900">支付方式占比</h2>
            </div>
            <div className="h-80">
              {paymentMethodData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-400">暂无数据</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {paymentMethodData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatMoney(value), '金额']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'business' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-900">品类订单占比</h2>
            </div>
            <div className="h-80">
              {categoryOrderData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-400">暂无数据</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryOrderData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryOrderData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}件`, '订单数']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-900">洗涤方式分布</h2>
              <Tag variant="success" size="sm">
                按件数统计
              </Tag>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={washMethodData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value}件`, '件数']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="#3eb489" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'member' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary-900">会员增长趋势</h2>
                <Tag variant="warning" size="sm">
                  累计会员数
                </Tag>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={memberGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => [`${value}人`, '会员数']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#ff8c42"
                      strokeWidth={2}
                      dot={{ fill: '#ff8c42', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary-900">会员等级分布</h2>
              </div>
              <div className="h-80">
                {memberLevelData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-400">暂无数据</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={memberLevelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {memberLevelData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value}人`, '人数']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-900">会员消费排行榜 TOP 5</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="px-4 py-3 font-medium text-gray-600">排名</th>
                    <th className="px-4 py-3 font-medium text-gray-600">会员编号</th>
                    <th className="px-4 py-3 font-medium text-gray-600">姓名</th>
                    <th className="px-4 py-3 font-medium text-gray-600">等级</th>
                    <th className="px-4 py-3 font-medium text-gray-600">累计消费</th>
                    <th className="px-4 py-3 font-medium text-gray-600">订单数</th>
                  </tr>
                </thead>
                <tbody>
                  {memberRankData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    memberRankData.map((item) => (
                      <tr
                        key={item.memberNo}
                        className="border-b border-surface-100 transition-colors hover:bg-surface-50"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                              item.rank === 1
                                ? 'bg-warning-100 text-warning-700'
                                : item.rank === 2
                                ? 'bg-gray-200 text-gray-700'
                                : item.rank === 3
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-surface-100 text-gray-600'
                            )}
                          >
                            {item.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-primary-700">{item.memberNo}</td>
                        <td className="px-4 py-3 text-gray-800">{item.name}</td>
                        <td className="px-4 py-3">
                          <Tag variant={levelTagVariant[item.level]} size="sm">
                            {memberLevelNames[item.level]}
                          </Tag>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-primary-700">
                          {formatMoney(item.totalSpent)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.orderCount} 单</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
