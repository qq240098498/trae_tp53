import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Tag,
  Crown,
  Users,
  Sparkles,
  Gem,
} from 'lucide-react';
import { usePricingStore } from '@/store/pricingStore';
import Card from '@/components/Card';
import Button from '@/components/Button';
import TagComponent from '@/components/Tag';
import Modal from '@/components/Modal';
import { cn } from '@/lib/utils';
import type { PricingRule, ExtraFee, MemberLevel, ClothingCategory } from '@/types';

type TabKey = 'category' | 'extra' | 'member';

function generateId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const tabConfig: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'category', label: '品类定价', icon: <Tag className="h-4 w-4" /> },
  { key: 'extra', label: '特殊处理附加费', icon: <Sparkles className="h-4 w-4" /> },
  { key: 'member', label: '会员折扣配置', icon: <Crown className="h-4 w-4" /> },
];

const categoryNames: Record<ClothingCategory, string> = {
  laundry: '普通洗衣',
  dry_clean: '干洗',
  wash: '水洗',
  iron: '熨烫',
  leather: '皮具护理',
  shoes: '鞋子洗护',
};

const allCategories: ClothingCategory[] = [
  'laundry',
  'dry_clean',
  'wash',
  'iron',
  'leather',
  'shoes',
];

const memberLevelConfig: {
  level: MemberLevel;
  name: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  upgradeCondition: string;
}[] = [
  {
    level: 'normal',
    name: '普通会员',
    icon: <Users className="h-6 w-6 text-gray-600" />,
    gradient: 'from-gray-50 to-surface-50',
    iconBg: 'bg-gray-100',
    upgradeCondition: '新用户注册即享',
  },
  {
    level: 'silver',
    name: '银卡会员',
    icon: <Sparkles className="h-6 w-6 text-blue-600" />,
    gradient: 'from-blue-50 to-primary-50',
    iconBg: 'bg-blue-100',
    upgradeCondition: '累计消费满 ¥500',
  },
  {
    level: 'gold',
    name: '金卡会员',
    icon: <Crown className="h-6 w-6 text-warning-600" />,
    gradient: 'from-warning-50 to-orange-50',
    iconBg: 'bg-warning-100',
    upgradeCondition: '累计消费满 ¥2000',
  },
  {
    level: 'platinum',
    name: '铂金会员',
    icon: <Gem className="h-6 w-6 text-purple-600" />,
    gradient: 'from-purple-50 to-indigo-50',
    iconBg: 'bg-purple-100',
    upgradeCondition: '累计消费满 ¥5000',
  },
];

interface NewCategoryForm {
  name: string;
  category: ClothingCategory;
  basePrice: string;
}

interface NewExtraFeeForm {
  name: string;
  price: string;
  applicableCategories: ClothingCategory[];
}

export default function PricingConfig() {
  const [activeTab, setActiveTab] = useState<TabKey>('category');
  const {
    pricingRules,
    extraFees,
    memberDiscounts,
    addPricingRule,
    updatePricingRule,
    addExtraFee,
    updateExtraFee,
    removeExtraFee,
    updateMemberDiscount,
  } = usePricingStore();

  const [editingRuleCategory, setEditingRuleCategory] = useState<ClothingCategory | null>(null);
  const [editingRulePrice, setEditingRulePrice] = useState<string>('');

  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editingFeeData, setEditingFeeData] = useState<{
    name: string;
    price: string;
    applicableCategories: ClothingCategory[];
  }>({ name: '', price: '', applicableCategories: [] });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showExtraFeeModal, setShowExtraFeeModal] = useState(false);

  const [newCategory, setNewCategory] = useState<NewCategoryForm>({
    name: '',
    category: 'laundry',
    basePrice: '',
  });

  const [newExtraFee, setNewExtraFee] = useState<NewExtraFeeForm>({
    name: '',
    price: '',
    applicableCategories: [],
  });

  const [memberDiscountsLocal, setMemberDiscountsLocal] = useState(memberDiscounts);

  const handleStartEditRule = (rule: PricingRule) => {
    setEditingRuleCategory(rule.category);
    setEditingRulePrice(String(rule.basePrice));
  };

  const handleSaveRule = () => {
    if (editingRuleCategory && editingRulePrice) {
      const price = parseFloat(editingRulePrice);
      if (!isNaN(price) && price >= 0) {
        updatePricingRule(editingRuleCategory, { basePrice: price });
      }
    }
    setEditingRuleCategory(null);
    setEditingRulePrice('');
  };

  const handleCancelEditRule = () => {
    setEditingRuleCategory(null);
    setEditingRulePrice('');
  };

  const handleAddCategory = () => {
    const price = parseFloat(newCategory.basePrice);
    if (newCategory.name && newCategory.category && !isNaN(price) && price >= 0) {
      const exists = pricingRules.find((r) => r.category === newCategory.category);
      if (!exists) {
        addPricingRule({
          category: newCategory.category,
          name: newCategory.name,
          basePrice: price,
        });
      }
      setShowCategoryModal(false);
      setNewCategory({ name: '', category: 'laundry', basePrice: '' });
    }
  };

  const handleStartEditFee = (fee: ExtraFee) => {
    setEditingFeeId(fee.id);
    setEditingFeeData({
      name: fee.name,
      price: String(fee.price),
      applicableCategories: [...fee.applicableCategories],
    });
  };

  const handleSaveFee = () => {
    if (editingFeeId) {
      const price = parseFloat(editingFeeData.price);
      if (editingFeeData.name && !isNaN(price) && price >= 0 && editingFeeData.applicableCategories.length > 0) {
        updateExtraFee(editingFeeId, {
          name: editingFeeData.name,
          price: price,
          applicableCategories: editingFeeData.applicableCategories,
        });
      }
    }
    setEditingFeeId(null);
    setEditingFeeData({ name: '', price: '', applicableCategories: [] });
  };

  const handleCancelEditFee = () => {
    setEditingFeeId(null);
    setEditingFeeData({ name: '', price: '', applicableCategories: [] });
  };

  const handleRemoveFee = (id: string) => {
    removeExtraFee(id);
  };

  const handleAddExtraFee = () => {
    const price = parseFloat(newExtraFee.price);
    if (newExtraFee.name && !isNaN(price) && price >= 0 && newExtraFee.applicableCategories.length > 0) {
      addExtraFee({
        id: generateId(),
        name: newExtraFee.name,
        price: price,
        applicableCategories: newExtraFee.applicableCategories,
      });
      setShowExtraFeeModal(false);
      setNewExtraFee({ name: '', price: '', applicableCategories: [] });
    }
  };

  const toggleEditingFeeCategory = (category: ClothingCategory) => {
    setEditingFeeData((prev) => {
      if (prev.applicableCategories.includes(category)) {
        return { ...prev, applicableCategories: prev.applicableCategories.filter((c) => c !== category) };
      }
      return { ...prev, applicableCategories: [...prev.applicableCategories, category] };
    });
  };

  const toggleNewExtraFeeCategory = (category: ClothingCategory) => {
    setNewExtraFee((prev) => {
      if (prev.applicableCategories.includes(category)) {
        return { ...prev, applicableCategories: prev.applicableCategories.filter((c) => c !== category) };
      }
      return { ...prev, applicableCategories: [...prev.applicableCategories, category] };
    });
  };

  const handleMemberDiscountChange = (level: MemberLevel, value: number) => {
    setMemberDiscountsLocal((prev) => ({ ...prev, [level]: value }));
  };

  const handleSaveMemberDiscounts = () => {
    Object.entries(memberDiscountsLocal).forEach(([level, discount]) => {
      updateMemberDiscount(level as MemberLevel, discount);
    });
  };

  const formatDiscount = (discount: number): string => {
    return `${(discount * 10).toFixed(1)}折`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">定价配置</h1>
          <p className="mt-1 text-sm text-gray-500">管理品类定价、附加费及会员折扣策略</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-surface-100 p-1">
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
              activeTab === tab.key
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'category' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900">品类定价</h2>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCategoryModal(true)}
            >
              新增品类
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 font-medium text-gray-600">品类名称</th>
                  <th className="px-4 py-3 font-medium text-gray-600">品类编码</th>
                  <th className="px-4 py-3 font-medium text-gray-600">基础价格</th>
                  <th className="px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {pricingRules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                      暂无品类定价
                    </td>
                  </tr>
                ) : (
                  pricingRules.map((rule) => (
                    <tr
                      key={rule.category}
                      className="border-b border-surface-100 transition-colors hover:bg-surface-50"
                    >
                      <td className="px-4 py-3">
                        <TagComponent variant="primary" size="sm">
                          {rule.name}
                        </TagComponent>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600">{rule.category}</td>
                      <td className="px-4 py-3">
                        {editingRuleCategory === rule.category ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingRulePrice}
                            onChange={(e) => setEditingRulePrice(e.target.value)}
                            className="w-24 rounded-lg border border-primary-200 px-3 py-1.5 font-mono text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                          />
                        ) : (
                          <span className="font-mono text-base font-bold text-primary-700">
                            ¥{rule.basePrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {editingRuleCategory === rule.category ? (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Save className="h-3.5 w-3.5" />}
                                onClick={handleSaveRule}
                              >
                                保存
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<X className="h-3.5 w-3.5" />}
                                onClick={handleCancelEditRule}
                              >
                                取消
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                              onClick={() => handleStartEditRule(rule)}
                            >
                              编辑
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'extra' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900">特殊处理附加费</h2>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowExtraFeeModal(true)}
            >
              新增附加费
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 font-medium text-gray-600">项目名称</th>
                  <th className="px-4 py-3 font-medium text-gray-600">价格</th>
                  <th className="px-4 py-3 font-medium text-gray-600">适用品类</th>
                  <th className="px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {extraFees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                      暂无附加费项目
                    </td>
                  </tr>
                ) : (
                  extraFees.map((fee) => (
                    <tr
                      key={fee.id}
                      className="border-b border-surface-100 transition-colors hover:bg-surface-50"
                    >
                      <td className="px-4 py-3">
                        {editingFeeId === fee.id ? (
                          <input
                            type="text"
                            value={editingFeeData.name}
                            onChange={(e) =>
                              setEditingFeeData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="w-32 rounded-lg border border-primary-200 px-3 py-1.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                          />
                        ) : (
                          <span className="font-medium text-gray-800">{fee.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingFeeId === fee.id ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editingFeeData.price}
                            onChange={(e) =>
                              setEditingFeeData((prev) => ({ ...prev, price: e.target.value }))
                            }
                            className="w-24 rounded-lg border border-primary-200 px-3 py-1.5 font-mono text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                          />
                        ) : (
                          <span className="font-mono text-base font-bold text-accent-600">
                            +¥{fee.price.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingFeeId === fee.id ? (
                          <div className="flex flex-wrap gap-1.5">
                            {allCategories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => toggleEditingFeeCategory(cat)}
                                className={cn(
                                  'rounded-md border px-2 py-1 text-xs transition-colors',
                                  editingFeeData.applicableCategories.includes(cat)
                                    ? 'border-accent-400 bg-accent-50 text-accent-700'
                                    : 'border-surface-200 bg-white text-gray-500 hover:border-surface-300'
                                )}
                              >
                                {categoryNames[cat]}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {fee.applicableCategories.map((cat) => (
                              <TagComponent key={cat} variant="success" size="sm">
                                {categoryNames[cat]}
                              </TagComponent>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {editingFeeId === fee.id ? (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Save className="h-3.5 w-3.5" />}
                                onClick={handleSaveFee}
                              >
                                保存
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<X className="h-3.5 w-3.5" />}
                                onClick={handleCancelEditFee}
                              >
                                取消
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                                onClick={() => handleStartEditFee(fee)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}
                                onClick={() => handleRemoveFee(fee.id)}
                              >
                                删除
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'member' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary-900">会员折扣配置</h2>
            <Button leftIcon={<Save className="h-4 w-4" />} onClick={handleSaveMemberDiscounts}>
              保存配置
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {memberLevelConfig.map((config, index) => {
              const discount = memberDiscountsLocal[config.level];
              return (
                <div
                  key={config.level}
                  className={cn(
                    'flex flex-col rounded-xl border border-surface-200 bg-gradient-to-br p-5 opacity-0 animate-fade-in-up',
                    config.gradient
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">{config.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">{config.upgradeCondition}</p>
                    </div>
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl',
                        config.iconBg
                      )}
                    >
                      {config.icon}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-3xl font-bold text-primary-700">
                        {formatDiscount(discount)}
                      </span>
                      <span className="text-xs text-gray-500">当前折扣</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.5"
                        max="1"
                        step="0.01"
                        value={discount}
                        onChange={(e) =>
                          handleMemberDiscountChange(config.level, parseFloat(e.target.value))
                        }
                        className="flex-1 h-2 rounded-full bg-surface-200 appearance-none cursor-pointer accent-primary-500"
                      />
                      <input
                        type="number"
                        min="0.5"
                        max="1"
                        step="0.01"
                        value={discount}
                        onChange={(e) =>
                          handleMemberDiscountChange(config.level, parseFloat(e.target.value))
                        }
                        className="w-16 rounded-lg border border-surface-200 bg-white px-2 py-1 text-center font-mono text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-400">
                      <span>5折</span>
                      <span>原价</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Modal
        open={showCategoryModal}
        title="新增品类"
        onClose={() => setShowCategoryModal(false)}
        onConfirm={handleAddCategory}
        confirmText="添加"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">品类名称</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="如：普通洗衣"
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">品类编码</label>
            <select
              value={newCategory.category}
              onChange={(e) =>
                setNewCategory((prev) => ({
                  ...prev,
                  category: e.target.value as ClothingCategory,
                }))
              }
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">基础价格 (¥)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newCategory.basePrice}
              onChange={(e) => setNewCategory((prev) => ({ ...prev, basePrice: e.target.value }))}
              placeholder="如：25.00"
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showExtraFeeModal}
        title="新增附加费"
        onClose={() => setShowExtraFeeModal(false)}
        onConfirm={handleAddExtraFee}
        confirmText="添加"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">项目名称</label>
            <input
              type="text"
              value={newExtraFee.name}
              onChange={(e) => setNewExtraFee((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="如：深度去渍"
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">价格 (¥)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newExtraFee.price}
              onChange={(e) => setNewExtraFee((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="如：20.00"
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">适用品类</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleNewExtraFeeCategory(cat)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                    newExtraFee.applicableCategories.includes(cat)
                      ? 'border-accent-400 bg-accent-50 text-accent-700'
                      : 'border-surface-200 bg-white text-gray-600 hover:border-surface-300 hover:bg-surface-50'
                  )}
                >
                  {categoryNames[cat]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
