import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Wallet,
  Search,
  Coins,
  CheckCircle,
  Banknote,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { useMemberStore } from '@/store/memberStore';
import { formatDate } from '@/utils/dateUtils';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import Modal from '@/components/Modal';
import { cn } from '@/lib/utils';
import type { Member, MemberLevel } from '@/types';

const levelConfig: Record<MemberLevel, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  normal: { label: '普通会员', variant: 'default' },
  silver: { label: '银卡会员', variant: 'info' },
  gold: { label: '金卡会员', variant: 'warning' },
  platinum: { label: '铂金会员', variant: 'purple' },
};

const PRESET_AMOUNTS = [100, 300, 500, 1000, 2000];

const BONUS_RULES: { amount: number; bonus: number }[] = [
  { amount: 100, bonus: 0 },
  { amount: 300, bonus: 30 },
  { amount: 500, bonus: 80 },
  { amount: 1000, bonus: 200 },
  { amount: 2000, bonus: 500 },
];

type PaymentMethod = '现金' | '微信支付' | '支付宝';

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: '现金', label: '现金', icon: <Banknote className="h-5 w-5" /> },
  { value: '微信支付', label: '微信支付', icon: <Smartphone className="h-5 w-5" /> },
  { value: '支付宝', label: '支付宝', icon: <CreditCard className="h-5 w-5" /> },
];

function calculateBonus(amount: number): number {
  let bonus = 0;
  for (const rule of BONUS_RULES) {
    if (amount >= rule.amount) {
      bonus = rule.bonus;
    }
  }
  return bonus;
}

export default function MemberRecharge() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getMemberById, getMemberByPhone, getMemberByMemberNo, recharge } = useMemberStore();

  const memberIdParam = searchParams.get('id');

  const [searchQuery, setSearchQuery] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [searchError, setSearchError] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('微信支付');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [lastRecharge, setLastRecharge] = useState<{ amount: number; bonus: number } | null>(null);

  useEffect(() => {
    if (memberIdParam) {
      const found = getMemberById(memberIdParam);
      if (found) {
        setMember(found);
      }
    }
  }, [memberIdParam, getMemberById]);

  const currentAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : 0);
  const currentBonus = calculateBonus(currentAmount);
  const totalRecharge = currentAmount + currentBonus;

  const handleSearch = () => {
    setSearchError('');
    const query = searchQuery.trim();
    if (!query) {
      setSearchError('请输入手机号或会员号');
      return;
    }

    let found = getMemberByPhone(query);
    if (!found) {
      found = getMemberByMemberNo(query);
    }

    if (found) {
      setMember(found);
      setSelectedAmount(null);
      setCustomAmount('');
    } else {
      setSearchError('未找到该会员');
      setMember(null);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleConfirmRecharge = () => {
    if (!member) return;
    if (!currentAmount || currentAmount <= 0) {
      alert('请选择或输入充值金额');
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleRecharge = async () => {
    if (!member) return;

    setRechargeLoading(true);

    recharge({
      memberId: member.id,
      amount: currentAmount,
      bonusAmount: currentBonus,
      paymentMethod,
      operator: '管理员',
    });

    setLastRecharge({ amount: currentAmount, bonus: currentBonus });
    setRechargeLoading(false);
    setConfirmModalOpen(false);
    setSuccessModalOpen(true);

    const updatedMember = getMemberById(member.id);
    if (updatedMember) {
      setMember(updatedMember);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    setSelectedAmount(null);
    setCustomAmount('');
    setLastRecharge(null);
  };

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
          <h1 className="text-2xl font-bold text-primary-900">会员充值</h1>
          <p className="mt-1 text-sm text-gray-500">为会员账户充值储值金额</p>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Search className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-gray-800">查询会员</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="请输入手机号或会员号"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <Button onClick={handleSearch}>查询会员</Button>
        </div>
        {searchError && (
          <p className="mt-2 text-sm text-red-500">{searchError}</p>
        )}
      </Card>

      {member && (
        <>
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                    <Tag variant={levelConfig[member.level].variant} size="sm">
                      {levelConfig[member.level].label}
                    </Tag>
                  </div>
                  <p className="mt-0.5 font-mono text-sm text-gray-500">{member.memberNo}</p>
                  <p className="text-sm text-gray-600">{member.phone}</p>
                </div>
              </div>
              <div className="sm:ml-auto flex gap-6">
                <div>
                  <p className="text-xs text-gray-500">当前余额</p>
                  <p className="mt-1 font-mono text-xl font-bold text-primary-600">
                    ¥{member.balance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">注册时间</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {formatDate(member.createdAt, 'YYYY-MM-DD')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-800">充值金额</h3>
            </div>

            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {PRESET_AMOUNTS.map((amount) => {
                const bonus = calculateBonus(amount);
                return (
                  <button
                    key={amount}
                    onClick={() => handleAmountSelect(amount)}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-lg border-2 py-4 transition-all',
                      selectedAmount === amount
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-surface-200 bg-white hover:border-primary-300'
                    )}
                  >
                    <span className="font-mono text-lg font-bold text-gray-900">
                      ¥{amount}
                    </span>
                    {bonus > 0 && (
                      <span className="mt-1 text-xs font-medium text-accent-600">
                        送¥{bonus}
                      </span>
                    )}
                    {bonus === 0 && (
                      <span className="mt-1 text-xs text-gray-400">无赠送</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1.5">自定义金额</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="输入自定义充值金额"
                  min={0}
                  step={0.01}
                  className="w-full h-10 pl-7 pr-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Banknote className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-800">支付方式</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-lg border-2 py-4 transition-all',
                    paymentMethod === method.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-surface-200 bg-white hover:border-primary-300'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    paymentMethod === method.value
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-surface-100 text-gray-500'
                  )}>
                    {method.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{method.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">充值金额</span>
                <span className="font-mono text-lg font-semibold text-gray-900">
                  ¥{currentAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  <Coins className="h-4 w-4 text-accent-500" />
                  赠送金额
                </span>
                <span className="font-mono text-lg font-semibold text-accent-600">
                  +¥{currentBonus.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-surface-100 pt-3 flex items-center justify-between">
                <span className="font-semibold text-gray-800">到账金额</span>
                <span className="font-mono text-2xl font-bold text-primary-600">
                  ¥{totalRecharge.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                className="w-full h-11 text-base"
                disabled={!currentAmount || currentAmount <= 0}
                onClick={handleConfirmRecharge}
              >
                确认充值
              </Button>
            </div>
          </Card>
        </>
      )}

      <Modal
        open={confirmModalOpen}
        title="确认充值"
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleRecharge}
        confirmLoading={rechargeLoading}
        confirmText="确认支付"
      >
        {member && (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.phone}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">充值金额</span>
                <span className="font-mono font-semibold">¥{currentAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">赠送金额</span>
                <span className="font-mono font-semibold text-accent-600">+¥{currentBonus.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">支付方式</span>
                <span>{paymentMethod}</span>
              </div>
            </div>
            <div className="border-t border-surface-100 pt-3 flex justify-between">
              <span className="font-semibold">合计支付</span>
              <span className="font-mono text-xl font-bold text-primary-600">
                ¥{currentAmount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={successModalOpen}
        onClose={handleSuccessClose}
        showClose={false}
        closeOnOverlayClick={false}
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleSuccessClose}
              className="flex-1"
            >
              继续充值
            </Button>
            <Button
              onClick={() => {
                handleSuccessClose();
                navigate('/members');
              }}
              className="flex-1"
            >
              返回列表
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 mb-4">
            <CheckCircle className="h-9 w-9 text-accent-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">充值成功</h3>
          <p className="mt-1 text-sm text-gray-500">会员账户已成功充值</p>
          {lastRecharge && (
            <div className="mt-4 w-full rounded-lg bg-surface-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">充值金额</span>
                <span className="font-mono font-semibold">¥{lastRecharge.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">赠送金额</span>
                <span className="font-mono font-semibold text-accent-600">
                  +¥{lastRecharge.bonus.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-surface-200 pt-2 flex justify-between">
                <span className="font-semibold">到账总额</span>
                <span className="font-mono text-lg font-bold text-primary-600">
                  ¥{(lastRecharge.amount + lastRecharge.bonus).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
