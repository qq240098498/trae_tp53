import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  User,
  Plus,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Coins,
  ShoppingBag,
  Calendar,
} from 'lucide-react';
import { useMemberStore } from '@/store/memberStore';
import { formatDate } from '@/utils/dateUtils';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import Modal from '@/components/Modal';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import type { MemberLevel, Member } from '@/types';

const levelConfig: Record<MemberLevel, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  normal: { label: '普通会员', variant: 'default' },
  silver: { label: '银卡会员', variant: 'info' },
  gold: { label: '金卡会员', variant: 'warning' },
  platinum: { label: '铂金会员', variant: 'purple' },
};

type LevelFilter = 'all' | MemberLevel;

const levelFilterOptions: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'normal', label: '普通会员' },
  { value: 'silver', label: '银卡会员' },
  { value: 'gold', label: '金卡会员' },
  { value: 'platinum', label: '铂金会员' },
];

const PAGE_SIZE = 8;

interface AddMemberForm {
  name: string;
  phone: string;
  level: MemberLevel;
  initialBalance: string;
}

export default function MemberList() {
  const navigate = useNavigate();
  const { members, searchMembers, addMember } = useMemberStore();

  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddMemberForm>({
    name: '',
    phone: '',
    level: 'normal',
    initialBalance: '',
  });
  const [addLoading, setAddLoading] = useState(false);

  const filteredMembers = useMemo(() => {
    let result = keyword ? searchMembers(keyword) : members;

    if (levelFilter !== 'all') {
      result = result.filter((m) => m.level === levelFilter);
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [members, keyword, levelFilter, searchMembers]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const pageMembers = filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handleViewDetail = (memberId: string) => {
    navigate(`/members/${memberId}`);
  };

  const handleRecharge = (memberId: string) => {
    navigate(`/members/recharge?id=${memberId}`);
  };

  const handleAddMember = () => {
    setAddForm({ name: '', phone: '', level: 'normal', initialBalance: '' });
    setAddModalOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!addForm.name.trim()) {
      alert('请输入会员姓名');
      return;
    }
    if (!addForm.phone.trim()) {
      alert('请输入会员手机号');
      return;
    }
    if (!/^1\d{10}$/.test(addForm.phone.trim())) {
      alert('请输入正确的手机号格式');
      return;
    }

    setAddLoading(true);

    const initialBalance = addForm.initialBalance ? parseFloat(addForm.initialBalance) : 0;

    addMember({
      name: addForm.name.trim(),
      phone: addForm.phone.trim(),
      level: addForm.level,
      initialBalance: isNaN(initialBalance) ? 0 : initialBalance,
    });

    setAddLoading(false);
    setAddModalOpen(false);
  };

  const renderPagination = () => {
    if (filteredMembers.length === 0) return null;

    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, filteredMembers.length);

    return (
      <div className="flex items-center justify-between border-t border-surface-100 px-5 py-3">
        <div className="text-sm text-gray-500">
          显示 {start}-{end} 条，共 {filteredMembers.length} 条
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(1)}
            leftIcon={<ChevronsLeft className="h-3.5 w-3.5" />}
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
          />
          <span className="px-3 text-sm text-gray-600">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            leftIcon={<ChevronRight className="h-3.5 w-3.5" />}
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
            leftIcon={<ChevronsRight className="h-3.5 w-3.5" />}
          />
        </div>
      </div>
    );
  };

  const renderMemberCard = (member: Member) => {
    return (
      <Card key={member.id} hover className="animate-fade-in-up">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">{member.name}</h3>
                  <Tag variant={levelConfig[member.level].variant} size="sm">
                    {levelConfig[member.level].label}
                  </Tag>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 font-mono">{member.memberNo}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary-50 px-3 py-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Wallet className="h-3.5 w-3.5" />
                <span>余额</span>
              </div>
              <p className="mt-1 font-mono text-base font-bold text-primary-600">
                ¥{member.balance.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-warning-50 px-3 py-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Coins className="h-3.5 w-3.5" />
                <span>积分</span>
              </div>
              <p className="mt-1 font-mono text-base font-bold text-warning-600">
                {member.points}
              </p>
            </div>
            <div className="rounded-lg bg-accent-50 px-3 py-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>消费次数</span>
              </div>
              <p className="mt-1 font-mono text-base font-bold text-accent-600">
                {member.orderCount} 次
              </p>
            </div>
            <div className="rounded-lg bg-surface-50 px-3 py-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>注册时间</span>
              </div>
              <p className="mt-1 text-sm text-gray-700">
                {formatDate(member.createdAt, 'YYYY-MM-DD')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => handleViewDetail(member.id)}
            >
              详情
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              leftIcon={<Wallet className="h-3.5 w-3.5" />}
              onClick={() => handleRecharge(member.id)}
            >
              充值
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">会员管理</h1>
          <p className="mt-1 text-sm text-gray-500">查看和管理所有会员信息</p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleAddMember}
        >
          新增会员
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-gray-800">筛选条件</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">搜索会员</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="姓名 / 手机号 / 会员号"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">会员等级</label>
            <div className="flex flex-wrap gap-2">
              {levelFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setLevelFilter(opt.value);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'h-8 px-3 rounded-lg text-sm font-medium transition-colors border',
                    levelFilter === opt.value
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-surface-200 hover:border-primary-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {pageMembers.length === 0 ? (
          <div className="py-16">
            <Empty />
          </div>
        ) : (
          <>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pageMembers.map((member) => renderMemberCard(member))}
              </div>
            </div>
            {renderPagination()}
          </>
        )}
      </Card>

      <Modal
        open={addModalOpen}
        title="新增会员"
        onClose={() => setAddModalOpen(false)}
        onConfirm={handleConfirmAdd}
        confirmLoading={addLoading}
        confirmText="确认创建"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              会员姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="请输入会员姓名"
              className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              手机号码 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addForm.phone}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              placeholder="请输入11位手机号码"
              maxLength={11}
              className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">会员等级</label>
            <select
              value={addForm.level}
              onChange={(e) => setAddForm({ ...addForm, level: e.target.value as MemberLevel })}
              className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
            >
              <option value="normal">普通会员</option>
              <option value="silver">银卡会员</option>
              <option value="gold">金卡会员</option>
              <option value="platinum">铂金会员</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">初始余额（元）</label>
            <input
              type="number"
              value={addForm.initialBalance}
              onChange={(e) => setAddForm({ ...addForm, initialBalance: e.target.value })}
              placeholder="请输入初始充值金额，可选"
              min={0}
              step={0.01}
              className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
