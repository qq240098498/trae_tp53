import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  Plus,
  X,
  Camera,
  Shirt,
  CreditCard,
  Search,
  Check,
  ChevronRight,
  Trash2,
  Sparkles,
  Crown,
  Coins,
  Wallet,
} from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Tag from '@/components/Tag';
import Modal from '@/components/Modal';
import { useMemberStore } from '@/store/memberStore';
import { usePricingStore } from '@/store/pricingStore';
import { useOrderStore } from '@/store/orderStore';
import { generateClothingCode } from '@/utils/idGenerator';
import type {
  ClothingCategory,
  WashMethod,
  SpecialTreatment,
  Member,
  MemberLevel,
} from '@/types';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

interface ClothingFormItem {
  tempId: string;
  code: string;
  category: ClothingCategory;
  color: string;
  brand: string;
  description: string;
  flawPhotos: string[];
  washMethod: WashMethod;
  specialTreatments: string[];
}

const CATEGORY_OPTIONS: { value: ClothingCategory; label: string }[] = [
  { value: 'laundry', label: '普通洗衣' },
  { value: 'dry_clean', label: '干洗' },
  { value: 'wash', label: '水洗' },
  { value: 'iron', label: '熨烫' },
  { value: 'leather', label: '皮具护理' },
  { value: 'shoes', label: '鞋子洗护' },
];

const WASH_METHOD_OPTIONS: { value: WashMethod; label: string }[] = [
  { value: 'standard', label: '标准洗涤' },
  { value: 'gentle', label: '轻柔洗涤' },
  { value: 'deep_clean', label: '深度清洁' },
  { value: 'hand_wash', label: '手洗' },
];

const MEMBER_LEVEL_LABELS: Record<MemberLevel, { label: string; color: string }> = {
  normal: { label: '普通会员', color: 'default' },
  silver: { label: '银卡会员', color: 'info' },
  gold: { label: '金卡会员', color: 'warning' },
  platinum: { label: '铂金会员', color: 'purple' },
};

const PAYMENT_METHODS = [
  { value: 'cash', label: '现金', icon: Wallet },
  { value: 'wechat', label: '微信', icon: CreditCard },
  { value: 'alipay', label: '支付宝', icon: CreditCard },
  { value: 'balance', label: '会员余额', icon: Coins },
];

function createEmptyClothingItem(): ClothingFormItem {
  return {
    tempId: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    code: generateClothingCode(),
    category: 'laundry',
    color: '',
    brand: '',
    description: '',
    flawPhotos: [],
    washMethod: 'standard',
    specialTreatments: [],
  };
}

export default function ClothesReceive() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [phoneInput, setPhoneInput] = useState('');
  const [searched, setSearched] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [clothes, setClothes] = useState<ClothingFormItem[]>([createEmptyClothingItem()]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrderNo, setCreatedOrderNo] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getMemberByPhone = useMemberStore((s) => s.getMemberByPhone);
  const addMember = useMemberStore((s) => s.addMember);
  const deduct = useMemberStore((s) => s.deduct);
  const addPoints = useMemberStore((s) => s.addPoints);
  const pricingRules = usePricingStore((s) => s.pricingRules);
  const extraFees = usePricingStore((s) => s.extraFees);
  const getMemberDiscount = usePricingStore((s) => s.getMemberDiscount);
  const addOrder = useOrderStore((s) => s.addOrder);

  const steps = [
    { id: 1, label: '客户信息', icon: User },
    { id: 2, label: '衣物信息', icon: Shirt },
    { id: 3, label: '洗涤配置', icon: Sparkles },
    { id: 4, label: '费用结算', icon: CreditCard },
  ];

  const handleSearchMember = () => {
    if (!phoneInput.trim()) return;
    const found = getMemberByPhone(phoneInput.trim());
    setMember(found || null);
    setSearched(true);
    if (found) {
      setRegisterName(found.name);
      setRegisterPhone(found.phone);
    } else {
      setRegisterPhone(phoneInput.trim());
      setRegisterName('');
    }
  };

  const handleQuickRegister = () => {
    if (!registerName.trim() || !registerPhone.trim()) return;
    const newMember = addMember({ name: registerName.trim(), phone: registerPhone.trim() });
    setMember(newMember);
  };

  const handleAddClothing = () => {
    setClothes((prev) => [...prev, createEmptyClothingItem()]);
  };

  const handleRemoveClothing = (tempId: string) => {
    setClothes((prev) => (prev.length > 1 ? prev.filter((c) => c.tempId !== tempId) : prev));
  };

  const handleUpdateClothing = (tempId: string, updates: Partial<ClothingFormItem>) => {
    setClothes((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, ...updates } : c))
    );
  };

  const handleFileUpload = (tempId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleUpdateClothing(tempId, {
        flawPhotos: [...clothes.find((c) => c.tempId === tempId)?.flawPhotos || [], result],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (tempId: string, photoIndex: number) => {
    const item = clothes.find((c) => c.tempId === tempId);
    if (!item) return;
    handleUpdateClothing(tempId, {
      flawPhotos: item.flawPhotos.filter((_, i) => i !== photoIndex),
    });
  };

  const toggleSpecialTreatment = (tempId: string, feeId: string) => {
    const item = clothes.find((c) => c.tempId === tempId);
    if (!item) return;
    const hasTreatment = item.specialTreatments.includes(feeId);
    handleUpdateClothing(tempId, {
      specialTreatments: hasTreatment
        ? item.specialTreatments.filter((id) => id !== feeId)
        : [...item.specialTreatments, feeId],
    });
  };

  const getApplicableExtraFees = (category: ClothingCategory) => {
    return extraFees.filter((f) => f.applicableCategories.includes(category));
  };

  const getBasePrice = (category: ClothingCategory) => {
    return pricingRules.find((r) => r.category === category)?.basePrice || 0;
  };

  const calculateItemPrices = () => {
    return clothes.map((item) => {
      const basePrice = getBasePrice(item.category);
      const extraPrice = item.specialTreatments.reduce((sum, feeId) => {
        const fee = extraFees.find((f) => f.id === feeId);
        return sum + (fee?.price || 0);
      }, 0);
      return {
        ...item,
        basePrice,
        extraPrice,
        totalPrice: basePrice + extraPrice,
      };
    });
  };

  const itemPrices = calculateItemPrices();
  const subtotal = itemPrices.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountRate = member ? getMemberDiscount(member.level) : 1;
  const discountAmount = subtotal * (1 - discountRate);
  const totalAmount = subtotal - discountAmount;

  const canProceedToStep2 = () => {
    if (member) return true;
    return registerName.trim() !== '' && registerPhone.trim() !== '';
  };

  const canProceedToStep3 = () => {
    return clothes.every(
      (c) => c.category && c.color.trim() !== ''
    );
  };

  const handleSubmit = () => {
    if (submitting) return;

    const customerName = member?.name || registerName;
    const customerPhone = member?.phone || registerPhone;

    if (!customerName?.trim() || !customerPhone?.trim()) {
      return;
    }

    if (paymentMethod === 'balance' && member) {
      if (member.balance < totalAmount) {
        return;
      }
    }

    setSubmitting(true);

    try {
      if (paymentMethod === 'balance' && member) {
        deduct({ memberId: member.id, amount: totalAmount });
      }

      const orderClothes = itemPrices.map((item) => ({
        category: item.category,
        color: item.color,
        brand: item.brand,
        description: item.description,
        flawPhotos: item.flawPhotos,
        washMethod: item.washMethod,
        specialTreatments: item.specialTreatments.map((feeId) => {
          const fee = extraFees.find((f) => f.id === feeId);
          return {
            id: feeId,
            name: fee?.name || '',
            price: fee?.price || 0,
          } as SpecialTreatment;
        }),
        basePrice: item.basePrice,
        extraPrice: item.extraPrice,
        totalPrice: item.totalPrice,
      }));

      const order = addOrder({
        customerName,
        customerPhone,
        memberId: member?.id,
        clothes: orderClothes,
        subtotal,
        discount: discountAmount,
        totalAmount,
        paidAmount: totalAmount,
        paymentMethod,
      });

      if (member) {
        addPoints(member.id, Math.floor(totalAmount));
      }

      setCreatedOrderNo(order.orderNo);
      setCreatedOrderId(order.id);
      setShowSuccessModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !canProceedToStep2()) return;
    if (currentStep === 2 && !canProceedToStep3()) return;
    if (currentStep < 4) {
      setCurrentStep((s) => (s + 1) as Step);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => (s - 1) as Step);
    }
  };

  const renderStepBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'bg-primary-500 border-primary-500 text-white',
                    isActive && 'border-primary-500 text-primary-500 bg-primary-50',
                    !isCompleted && !isActive && 'border-surface-200 text-gray-400 bg-white'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isActive ? 'text-primary-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1 rounded transition-colors',
                    currentStep > step.id ? 'bg-primary-500' : 'bg-surface-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCustomerInfo = () => (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold">客户信息</h3>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="请输入手机号"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchMember()}
              className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <Button onClick={handleSearchMember} leftIcon={<Search className="h-4 w-4" />}>
            查询
          </Button>
        </div>
      </Card>

      {searched && member && (
        <Card className="border-primary-200 bg-primary-50/30">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
              <Crown className="h-7 w-7 text-primary-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-semibold text-gray-800">{member.name}</span>
                <Tag variant={MEMBER_LEVEL_LABELS[member.level].color as any}>
                  {MEMBER_LEVEL_LABELS[member.level].label}
                </Tag>
              </div>
              <p className="text-sm text-gray-500 mb-3">手机号：{member.phone}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-surface-100">
                  <p className="text-xs text-gray-500 mb-1">账户余额</p>
                  <p className="text-lg font-bold text-primary-600">¥{member.balance.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-surface-100">
                  <p className="text-xs text-gray-500 mb-1">会员积分</p>
                  <p className="text-lg font-bold text-warning-600">{member.points}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {searched && !member && (
        <Card className="border-warning-200 bg-warning-50/30">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-warning-500" />
            <h3 className="text-lg font-semibold">非会员 - 快速注册</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">姓名</label>
              <input
                type="text"
                placeholder="请输入姓名"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">手机号</label>
              <input
                type="text"
                placeholder="请输入手机号"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={handleQuickRegister} leftIcon={<User className="h-4 w-4" />}>
              注册为会员
            </Button>
          </div>
        </Card>
      )}
    </div>
  );

  const renderClothingInfo = () => (
    <div className="space-y-4">
      {clothes.map((item, index) => (
        <Card key={item.tempId}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shirt className="h-5 w-5 text-primary-500" />
              <span className="font-semibold">衣物 {index + 1}</span>
              <Tag variant="info">{item.code}</Tag>
            </div>
            {clothes.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveClothing(item.tempId)}
                leftIcon={<Trash2 className="h-4 w-4 text-red-500" />}
              >
                删除
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">品类</label>
              <select
                value={item.category}
                onChange={(e) =>
                  handleUpdateClothing(item.tempId, {
                    category: e.target.value as ClothingCategory,
                    specialTreatments: [],
                  })
                }
                className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">颜色</label>
              <input
                type="text"
                placeholder="请输入颜色"
                value={item.color}
                onChange={(e) => handleUpdateClothing(item.tempId, { color: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">品牌</label>
              <input
                type="text"
                placeholder="请输入品牌"
                value={item.brand}
                onChange={(e) => handleUpdateClothing(item.tempId, { brand: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">描述</label>
              <input
                type="text"
                placeholder="请输入描述"
                value={item.description}
                onChange={(e) => handleUpdateClothing(item.tempId, { description: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5">瑕疵拍照</label>
            <div className="flex flex-wrap gap-2">
              {item.flawPhotos.map((photo, photoIndex) => (
                <div key={photoIndex} className="relative h-20 w-20 rounded-lg overflow-hidden border border-surface-200">
                  <img src={photo} alt="瑕疵" className="h-full w-full object-cover" />
                  <button
                    onClick={() => handleRemovePhoto(item.tempId, photoIndex)}
                    className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-black/50 text-white hover:bg-black/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {item.flawPhotos.length < 9 && (
                <>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[item.tempId] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(item.tempId, e.target.files)}
                  />
                  <button
                    onClick={() => fileInputRefs.current[item.tempId]?.click()}
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-surface-300 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
                  >
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-xs">添加</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}

      <Button
        variant="secondary"
        className="w-full"
        onClick={handleAddClothing}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        添加衣物
      </Button>
    </div>
  );

  const renderWashConfig = () => (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        {clothes.map((item, index) => {
          const applicableFees = getApplicableExtraFees(item.category);
          return (
            <Card key={item.tempId}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shirt className="h-5 w-5 text-primary-500" />
                  <span className="font-semibold">衣物 {index + 1}</span>
                </div>
                <Tag variant="info">{item.code}</Tag>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">洗涤方式</label>
                <div className="grid grid-cols-4 gap-2">
                  {WASH_METHOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleUpdateClothing(item.tempId, { washMethod: opt.value })}
                      className={cn(
                        'h-10 px-2 rounded-lg border text-sm font-medium transition-colors',
                        item.washMethod === opt.value
                          ? 'border-primary-500 bg-primary-50 text-primary-600'
                          : 'border-surface-200 bg-white text-gray-600 hover:border-primary-300'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {applicableFees.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">特殊处理</label>
                  <div className="flex flex-wrap gap-2">
                    {applicableFees.map((fee) => {
                      const isSelected = item.specialTreatments.includes(fee.id);
                      return (
                        <button
                          key={fee.id}
                          onClick={() => toggleSpecialTreatment(item.tempId, fee.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-sm transition-colors',
                            isSelected
                              ? 'border-primary-500 bg-primary-50 text-primary-600'
                              : 'border-surface-200 bg-white text-gray-600 hover:border-primary-300'
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                          <span>{fee.name}</span>
                          <span className="text-xs text-gray-400">+¥{fee.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="col-span-1">
        <Card className="sticky top-4">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-gray-700">标签预览</h3>
          </div>
          <div className="space-y-4">
            {clothes.map((item) => (
              <div
                key={item.tempId}
                className="flex flex-col items-center p-4 rounded-lg border border-surface-200 bg-white"
              >
                <QRCodeSVG value={item.code} size={80} level="M" />
                <p className="mt-2 text-sm font-mono font-semibold text-gray-700">{item.code}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold">费用明细</h3>
          </div>
          <div className="space-y-3">
            {itemPrices.map((item, index) => (
              <div key={item.tempId} className="p-3 rounded-lg bg-surface-50 border border-surface-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">衣物 {index + 1}</span>
                    <Tag variant="default">{item.code}</Tag>
                  </div>
                  <span className="font-semibold text-primary-600">¥{item.totalPrice.toFixed(2)}</span>
                </div>
                <div className="pl-4 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>
                      {CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label} - 基础价
                    </span>
                    <span>¥{item.basePrice.toFixed(2)}</span>
                  </div>
                  {item.specialTreatments.map((feeId) => {
                    const fee = extraFees.find((f) => f.id === feeId);
                    return (
                      <div key={feeId} className="flex justify-between text-gray-600">
                        <span>{fee?.name}</span>
                        <span>¥{fee?.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold">支付方式</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isDisabled = method.value === 'balance' && (!member || member.balance < totalAmount);
              return (
                <button
                  key={method.value}
                  disabled={isDisabled}
                  onClick={() => setPaymentMethod(method.value)}
                  className={cn(
                    'flex flex-col items-center justify-center h-20 rounded-lg border-2 transition-colors',
                    isDisabled && 'opacity-50 cursor-not-allowed',
                    paymentMethod === method.value
                      ? 'border-primary-500 bg-primary-50'
                      : !isDisabled && 'border-surface-200 bg-white hover:border-primary-300'
                  )}
                >
                  <Icon className={cn('h-6 w-6 mb-1', paymentMethod === method.value ? 'text-primary-600' : 'text-gray-500')} />
                  <span className={cn('text-sm font-medium', paymentMethod === method.value ? 'text-primary-600' : 'text-gray-600')}>
                    {method.label}
                  </span>
                  {method.value === 'balance' && member && (
                    <span className="text-xs text-gray-400 mt-0.5">余额 ¥{member.balance.toFixed(2)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="col-span-1">
        <Card className="sticky top-4">
          <h3 className="text-lg font-semibold mb-4">结算汇总</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">商品小计</span>
              <span>¥{subtotal.toFixed(2)}</span>
            </div>
            {member && discountRate < 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  会员折扣（{MEMBER_LEVEL_LABELS[member.level].label} ×{(discountRate * 10).toFixed(1)}折）
                </span>
                <span className="text-red-500">-¥{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-surface-100 pt-3">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-700 font-medium">应付金额</span>
                <span className="text-2xl font-bold text-primary-600">¥{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">衣物收件登记</h1>
        <p className="text-sm text-gray-500 mt-1">按步骤完成客户衣物收件登记</p>
      </div>

      {renderStepBar()}

      <Card className="mb-6">
        {currentStep === 1 && renderCustomerInfo()}
        {currentStep === 2 && renderClothingInfo()}
        {currentStep === 3 && renderWashConfig()}
        {currentStep === 4 && renderPayment()}
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          上一步
        </Button>
        {currentStep < 4 ? (
          <Button
            onClick={handleNext}
            rightIcon={<ChevronRight className="h-4 w-4" />}
            disabled={(currentStep === 1 && !canProceedToStep2()) || (currentStep === 2 && !canProceedToStep3())}
          >
            下一步
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={
              submitting ||
              (paymentMethod === 'balance' && (!member || member.balance < totalAmount))
            }
          >
            {submitting ? '提交中...' : '提交订单'}
          </Button>
        )}
      </div>

      <Modal
        open={showSuccessModal}
        title="订单创建成功"
        onClose={() => setShowSuccessModal(false)}
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowSuccessModal(false);
                setCurrentStep(1);
                setPhoneInput('');
                setSearched(false);
                setMember(null);
                setRegisterName('');
                setRegisterPhone('');
                setClothes([createEmptyClothingItem()]);
                setPaymentMethod('cash');
              }}
            >
              继续登记
            </Button>
            <Button
              onClick={() => {
                if (createdOrderId) {
                  navigate(`/orders/${createdOrderId}`);
                }
              }}
            >
              查看订单
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-2">订单创建成功</p>
          <p className="text-sm text-gray-500">订单号：{createdOrderNo}</p>
          <p className="text-sm text-gray-500 mt-1">应收金额：¥{totalAmount.toFixed(2)}</p>
        </div>
      </Modal>
    </div>
  );
}
