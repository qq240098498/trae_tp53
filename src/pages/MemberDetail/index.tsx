import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Wallet,
  Coins,
  ShoppingBag,
  History,
  CreditCard,
  Phone,
  Calendar,
} from 'lucide-react';
import { useMemberStore } from '@/store/memberStore';
import { useOrderStore } from '@/store/orderStore';
import { formatDate } from '@/utils/dateUtils';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import type { MemberLevel } from '@/types';

const levelConfig: Record<MemberLevel, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  normal: { label: '普通会员', variant: 'default' },
  silver: { label: '银卡会员', variant: 'info' },
  gold: { label: '金卡会员', variant: 'warning' },
  platinum: { label: '铂金会员', variant: 'purple' },
};

type TabType = 'recharge' | 'consume';

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMemberById } = useMemberStore();
  const { orders } = useOrderStore();

  const [activeTab, setActiveTab] = useState<TabType>('recharge');

  const member = id ? getMemberById(id) : undefined;

  const memberOrders = useMemo(() => {
    if (!member) return [];
    return orders
      .filter((o) => o.memberId === member.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [member, orders]);

  if (!member) {
    return (
      <div className="space-y-6 p-6">
        <Button
          variant="ghost"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
          onClick={() => navigate('/members')}
        >
          返回会员列表
        </Button>
        <Card>
          <div className="py-16">
            <Empty />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
          onClick={() => navigate('/members')}
        >
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary-900">会员详情</h1>
          <p className="mt-1 text-sm text-gray-500">查看会员的完整信息和记录</p>
        </div>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200">
              <User className="h-10 w-10 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
                <Tag variant={levelConfig[member.level].variant} size="md">
                  {levelConfig[member.level].label}
                </Tag>
              </div>
              <p className="mt-1 font-mono text-sm text-gray-500">{member.memberNo}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>注册于 {formatDate(member.createdAt, 'YYYY-MM-DD')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="md:ml-auto">
            <Button
              leftIcon={<Wallet className="h-4 w-4" />}
              onClick={() => navigate(`/members/recharge?id=${member.id}`)}
            >
              会员充值
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary-50 to-blue-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">当前余额</p>
              <p className="mt-2 font-mono text-2xl font-bold text-primary-600">
                ¥{member.balance.toFixed(2)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Wallet className="h-5 w-5 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-accent-50 to-emerald-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">累计消费</p>
              <p className="mt-2 font-mono text-2xl font-bold text-accent-600">
                ¥{member.totalSpent.toFixed(2)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100">
              <ShoppingBag className="h-5 w-5 text-accent-600" />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-warning-50 to-orange-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">累计积分</p>
              <p className="mt-2 font-mono text-2xl font-bold text-warning-600">
                {member.points}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100">
              <Coins className="h-5 w-5 text-warning-600" />
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">订单数量</p>
              <p className="mt-2 font-mono text-2xl font-bold text-purple-600">
                {member.orderCount}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center border-b border-surface-200 px-5">
          <button
            onClick={() => setActiveTab('recharge')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'recharge'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <History className="h-4 w-4" />
            充值记录
          </button>
          <button
            onClick={() => setActiveTab('consume')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'consume'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            消费记录
          </button>
        </div>

        {activeTab === 'recharge' && (
          <div>
            {member.rechargeRecords.length === 0 ? (
              <div className="py-16">
                <Empty />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50">
                      <th className="px-5 py-3 font-medium text-gray-600">充值时间</th>
                      <th className="px-5 py-3 font-medium text-gray-600">充值金额</th>
                      <th className="px-5 py-3 font-medium text-gray-600">赠送金额</th>
                      <th className="px-5 py-3 font-medium text-gray-600">支付方式</th>
                      <th className="px-5 py-3 font-medium text-gray-600">操作人</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...member.rechargeRecords]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-surface-100 transition-colors hover:bg-surface-50"
                        >
                          <td className="px-5 py-4 text-gray-600">
                            {formatDate(record.createdAt, 'YYYY-MM-DD HH:mm')}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono font-semibold text-primary-600">
                              ¥{record.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono font-semibold text-accent-600">
                              +¥{record.bonusAmount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-700">{record.paymentMethod}</td>
                          <td className="px-5 py-4 text-gray-700">{record.operator}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'consume' && (
          <div>
            {memberOrders.length === 0 ? (
              <div className="py-16">
                <Empty />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 bg-surface-50">
                      <th className="px-5 py-3 font-medium text-gray-600">消费时间</th>
                      <th className="px-5 py-3 font-medium text-gray-600">订单号</th>
                      <th className="px-5 py-3 font-medium text-gray-600">消费金额</th>
                      <th className="px-5 py-3 font-medium text-gray-600">获得积分</th>
                      <th className="px-5 py-3 font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-surface-100 transition-colors hover:bg-surface-50"
                      >
                        <td className="px-5 py-4 text-gray-600">
                          {formatDate(order.createdAt, 'YYYY-MM-DD HH:mm')}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-primary-700">{order.orderNo}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono font-semibold text-primary-600">
                            ¥{order.totalAmount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono font-semibold text-warning-600">
                            +{Math.floor(order.totalAmount)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            查看订单
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
