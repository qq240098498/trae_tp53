import { useState, useMemo, useRef } from 'react';
import {
  Scan,
  Search,
  Phone,
  CheckSquare,
  Package,
  Check,
  User,
  Clock,
  Shirt,
  Tag as TagIcon,
  AlertTriangle,
  Sparkles,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Eye,
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
} from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Tag from '@/components/Tag';
import Modal from '@/components/Modal';
import { useOrderStore } from '@/store/orderStore';
import { useMemberStore } from '@/store/memberStore';
import type { Order, ClothingItem, MemberLevel, ClothingCategory } from '@/types';
import { formatDate, checkOverdue, OVERDUE_THRESHOLD_DAYS } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

type QueryMethod = 'scan' | 'phone';
type InputMode = 'scan' | 'manual';

interface ClothingItemWithOrder extends ClothingItem {
  orderId: string;
  orderNo: string;
}

type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const MEMBER_LEVEL_LABELS: Record<MemberLevel, { label: string; color: TagVariant }> = {
  normal: { label: '普通会员', color: 'default' },
  silver: { label: '银卡会员', color: 'info' },
  gold: { label: '金卡会员', color: 'warning' },
  platinum: { label: '铂金会员', color: 'purple' },
};

const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  laundry: '普通洗衣',
  dry_clean: '干洗',
  wash: '水洗',
  iron: '熨烫',
  leather: '皮具护理',
  shoes: '鞋子洗护',
};

const OVERDUE_STORAGE_FEE_PER_DAY = 2;

export default function PickupVerify() {
  const [queryMethod, setQueryMethod] = useState<QueryMethod>('scan');
  const [inputMode, setInputMode] = useState<InputMode>('scan');
  const [scanInput, setScanInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pickedUpSummary, setPickedUpSummary] = useState<{
    customerName: string;
    customerPhone: string;
    items: ClothingItemWithOrder[];
    totalAmount: number;
    overdueFee: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<{
    open: boolean;
    photos: string[];
    currentIndex: number;
    clothingCode: string;
  }>({ open: false, photos: [], currentIndex: 0, clothingCode: '' });
  const [pickupPhotos, setPickupPhotos] = useState<Record<string, string[]>>({});
  const pickupFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getClothingItemByCode = useOrderStore((s) => s.getClothingItemByCode);
  const searchByPhone = useOrderStore((s) => s.searchByPhone);
  const pickUpOrder = useOrderStore((s) => s.pickUpOrder);
  const updateClothingItemPhotos = useOrderStore((s) => s.updateClothingItemPhotos);
  const getMemberByPhone = useMemberStore((s) => s.getMemberByPhone);

  const [foundOrders, setFoundOrders] = useState<Order[]>([]);

  const memberInfo = useMemo(() => {
    if (foundOrders.length === 0) return null;
    const firstOrder = foundOrders[0];
    return getMemberByPhone(firstOrder.customerPhone);
  }, [foundOrders, getMemberByPhone]);

  const pendingItems = useMemo<ClothingItemWithOrder[]>(() => {
    const items: ClothingItemWithOrder[] = [];
    for (const order of foundOrders) {
      for (const item of order.clothes) {
        if (item.status !== 'picked_up') {
          items.push({
            ...item,
            orderId: order.id,
            orderNo: order.orderNo,
          });
        }
      }
    }
    return items;
  }, [foundOrders]);

  const selectedItemList = useMemo(() => {
    return pendingItems.filter((item) => selectedItems.has(item.id));
  }, [pendingItems, selectedItems]);

  const totalAmount = useMemo(() => {
    return selectedItemList.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [selectedItemList]);

  const overdueFee = useMemo(() => {
    let fee = 0;
    for (const item of selectedItemList) {
      const check = checkOverdue(item.receivedAt, OVERDUE_THRESHOLD_DAYS);
      if (check.isOverdue) {
        fee += check.overdueDays * OVERDUE_STORAGE_FEE_PER_DAY;
      }
    }
    return fee;
  }, [selectedItemList]);

  const handleScanQuery = () => {
    if (!scanInput.trim()) return;
    setErrorMsg('');
    const result = getClothingItemByCode(scanInput.trim());
    if (!result) {
      setErrorMsg('未找到该衣物编码对应的订单');
      setFoundOrders([]);
      return;
    }
    setFoundOrders([result.order]);
    setScanInput('');
    setSelectedItems(new Set());
  };

  const handlePhoneQuery = () => {
    if (!phoneInput.trim()) return;
    setErrorMsg('');
    const orders = searchByPhone(phoneInput.trim());
    if (orders.length === 0) {
      setErrorMsg('未找到该手机号对应的订单');
      setFoundOrders([]);
      return;
    }
    setFoundOrders(orders);
    setSelectedItems(new Set());
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === pendingItems.length && pendingItems.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(pendingItems.map((item) => item.id)));
    }
  };

  const handleConfirmPickup = () => {
    if (selectedItemList.length === 0) return;
    if (!allSelectedHavePickupPhotos()) {
      setErrorMsg('请为所有选中的衣物拍摄取件现状照片');
      return;
    }

    for (const item of selectedItemList) {
      const photos = getItemPickupPhotos(item.id);
      if (photos.length > 0) {
        updateClothingItemPhotos(item.orderId, item.id, { pickupPhotos: photos });
      }
    }

    const ordersMap = new Map<string, string[]>();
    for (const item of selectedItemList) {
      if (!ordersMap.has(item.orderId)) {
        ordersMap.set(item.orderId, []);
      }
      ordersMap.get(item.orderId)!.push(item.code);
    }

    for (const [orderId, codes] of ordersMap) {
      pickUpOrder({ orderId, clothingCodes: codes });
    }

    const firstOrder = foundOrders[0];
    setPickedUpSummary({
      customerName: firstOrder.customerName,
      customerPhone: firstOrder.customerPhone,
      items: selectedItemList,
      totalAmount,
      overdueFee,
    });
    setShowSuccessModal(true);
    setFoundOrders([]);
    setSelectedItems(new Set());
    setPickupPhotos({});
    setErrorMsg('');
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setPickedUpSummary(null);
  };

  const toggleExpandItem = (itemId: string) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  };

  const openPhotoPreview = (photos: string[], currentIndex: number, clothingCode: string) => {
    setPhotoPreview({ open: true, photos, currentIndex, clothingCode });
  };

  const closePhotoPreview = () => {
    setPhotoPreview({ open: false, photos: [], currentIndex: 0, clothingCode: '' });
  };

  const prevPhoto = () => {
    setPhotoPreview((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.photos.length - 1,
    }));
  };

  const nextPhoto = () => {
    setPhotoPreview((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex < prev.photos.length - 1 ? prev.currentIndex + 1 : 0,
    }));
  };

  const isItemOverdue = (item: ClothingItem) => {
    return checkOverdue(item.receivedAt, OVERDUE_THRESHOLD_DAYS).isOverdue;
  };

  const getOverdueDays = (item: ClothingItem) => {
    return checkOverdue(item.receivedAt, OVERDUE_THRESHOLD_DAYS).overdueDays;
  };

  const handlePickupFileUpload = (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPickupPhotos((prev) => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), result],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePickupPhoto = (itemId: string, photoIndex: number) => {
    setPickupPhotos((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || []).filter((_, i) => i !== photoIndex),
    }));
  };

  const getItemPickupPhotos = (itemId: string) => {
    return pickupPhotos[itemId] || [];
  };

  const allSelectedHavePickupPhotos = () => {
    return selectedItemList.every((item) => getItemPickupPhotos(item.id).length > 0);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">取件核销</h1>
        <p className="text-sm text-gray-500 mt-1">通过扫码或手机号查询待取件衣物，确认后完成核销</p>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setQueryMethod('scan')}
            className={cn(
              'flex items-center gap-2 h-10 px-4 rounded-lg font-medium transition-all',
              queryMethod === 'scan'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-surface-100 text-gray-600 hover:bg-surface-200'
            )}
          >
            <Scan className="h-4 w-4" />
            扫码查询
          </button>
          <button
            onClick={() => setQueryMethod('phone')}
            className={cn(
              'flex items-center gap-2 h-10 px-4 rounded-lg font-medium transition-all',
              queryMethod === 'phone'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-surface-100 text-gray-600 hover:bg-surface-200'
            )}
          >
            <Phone className="h-4 w-4" />
            手机号查询
          </button>
        </div>

        {queryMethod === 'scan' && (
          <div className="space-y-4">
            {inputMode === 'scan' ? (
              <div className="relative mx-auto w-full max-w-md">
                <div className="relative aspect-square max-w-sm mx-auto rounded-xl border-2 border-primary-400 bg-primary-50/30 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Scan className="h-16 w-16 text-primary-400 mx-auto mb-3" />
                      <p className="text-primary-600 font-medium mb-1">请扫描衣物编码</p>
                      <p className="text-xs text-gray-500">将条码/二维码对准扫描框</p>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-scan-line" />
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />
                </div>
                <button
                  onClick={() => setInputMode('manual')}
                  className="mt-4 w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  无法扫描？手动输入衣物编码
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="请输入衣物编码"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleScanQuery()}
                      className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <Button onClick={handleScanQuery} leftIcon={<Search className="h-4 w-4" />}>
                    查询
                  </Button>
                </div>
                <button
                  onClick={() => setInputMode('scan')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  返回扫码模式
                </button>
              </div>
            )}
          </div>
        )}

        {queryMethod === 'phone' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="请输入客户手机号"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePhoneQuery()}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
            <Button onClick={handlePhoneQuery} leftIcon={<Search className="h-4 w-4" />}>
              查询
            </Button>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            {errorMsg}
          </div>
        )}
      </Card>

      {foundOrders.length > 0 && (
        <>
          <Card className="mb-6 border-primary-200 bg-primary-50/30">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                <User className="h-7 w-7 text-primary-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-semibold text-gray-800">{foundOrders[0].customerName}</span>
                  {memberInfo && (
                    <Tag variant={MEMBER_LEVEL_LABELS[memberInfo.level].color}>
                      {MEMBER_LEVEL_LABELS[memberInfo.level].label}
                    </Tag>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">手机号：{foundOrders[0].customerPhone}</p>
                {memberInfo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-surface-100">
                      <p className="text-xs text-gray-500 mb-1">账户余额</p>
                      <p className="text-lg font-bold text-primary-600">¥{memberInfo.balance.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-surface-100">
                      <p className="text-xs text-gray-500 mb-1">会员积分</p>
                      <p className="text-lg font-bold text-warning-600">{memberInfo.points}</p>
                    </div>
                  </div>
                )}
              </div>
              {!memberInfo && (
                <Tag variant="default">散客</Tag>
              )}
            </div>
          </Card>

          {pendingItems.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary-500" />
                  <h3 className="text-lg font-semibold">待取件衣物</h3>
                  <span className="text-sm text-gray-500">（共 {pendingItems.length} 件）</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  leftIcon={<CheckSquare className="h-4 w-4" />}
                >
                  {selectedItems.size === pendingItems.length && pendingItems.length > 0 ? '取消全选' : '全选'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {pendingItems.map((item) => {
                  const isSelected = selectedItems.has(item.id);
                  const overdue = isItemOverdue(item);
                  const overdueDays = getOverdueDays(item);
                  const isExpanded = expandedItemId === item.id;
                  const hasFlawPhotos = item.flawPhotos.length > 0;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'relative rounded-xl border-2 bg-white transition-all duration-200 overflow-hidden',
                        isSelected
                          ? 'border-primary-500 bg-primary-50/30 shadow-md'
                          : 'border-surface-200 hover:border-primary-300 hover:shadow-sm',
                        overdue && !isSelected && 'border-warning-400 bg-warning-50/30'
                      )}
                    >
                      <div
                        onClick={() => toggleSelectItem(item.id)}
                        className="p-4 cursor-pointer"
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white z-10">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        {overdue && (
                          <div className="absolute top-2 left-2 z-10">
                            <Tag variant="warning" size="sm">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                超期{overdueDays}天
                              </span>
                            </Tag>
                          </div>
                        )}
                        <div className={cn('pt-2', overdue && 'pt-8')}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <TagIcon className="h-4 w-4 text-gray-500" />
                              <span className="font-mono text-sm font-semibold text-gray-700">{item.code}</span>
                            </div>
                            <Tag variant="info">{CATEGORY_LABELS[item.category]}</Tag>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Shirt className="h-3.5 w-3.5 text-gray-400" />
                              <span>颜色：{item.color}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Sparkles className="h-3.5 w-3.5 text-gray-400" />
                              <span>品牌：{item.brand || '无'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span>送洗时间：{formatDate(item.receivedAt, 'YYYY-MM-DD')}</span>
                            </div>
                          </div>

                          {hasFlawPhotos && (
                            <div className="mt-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <ImageIcon className="h-3.5 w-3.5 text-warning-500" />
                                <span className="text-xs font-medium text-warning-600">
                                  瑕疵照片（{item.flawPhotos.length}张）
                                </span>
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                {item.flawPhotos.slice(0, 4).map((photo, idx) => (
                                  <div
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPhotoPreview(item.flawPhotos, idx, item.code);
                                    }}
                                    className="relative h-12 w-12 rounded-md overflow-hidden border border-surface-200 cursor-pointer hover:border-primary-400 hover:shadow-sm transition-all"
                                  >
                                    <img
                                      src={photo}
                                      alt={`瑕疵${idx + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ))}
                                {item.flawPhotos.length > 4 && (
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPhotoPreview(item.flawPhotos, 0, item.code);
                                    }}
                                    className="relative h-12 w-12 rounded-md overflow-hidden border border-surface-200 bg-surface-100 cursor-pointer hover:border-primary-400 hover:shadow-sm transition-all flex items-center justify-center"
                                  >
                                    <span className="text-xs font-semibold text-gray-600">
                                      +{item.flawPhotos.length - 4}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {!hasFlawPhotos && (
                            <div className="mt-3">
                              <div className="flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5 text-gray-300" />
                                <span className="text-xs text-gray-400">无瑕疵照片</span>
                              </div>
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-surface-100 flex items-center justify-between">
                            <span className="text-xs text-gray-500">{item.orderNo}</span>
                            <span className="text-lg font-bold text-primary-600">¥{item.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandItem(item.id);
                        }}
                        className={cn(
                          'w-full flex items-center justify-center gap-1 py-2 text-xs font-medium border-t transition-colors',
                          isExpanded
                            ? 'bg-primary-50 text-primary-600 border-primary-100'
                            : 'bg-surface-50 text-gray-500 border-surface-100 hover:bg-surface-100'
                        )}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>瑕疵对照审核</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-surface-100 bg-surface-50/50 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-warning-100">
                                <ImageIcon className="h-4 w-4 text-warning-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">收件瑕疵记录</p>
                                <p className="text-xs text-gray-500">
                                  送洗时间：{formatDate(item.receivedAt, 'YYYY-MM-DD HH:mm')}
                                </p>
                              </div>
                            </div>

                            {item.description && (
                              <div className="rounded-lg bg-white border border-surface-100 p-3">
                                <p className="text-xs text-gray-500 mb-1">瑕疵描述</p>
                                <p className="text-sm text-gray-700">{item.description}</p>
                              </div>
                            )}

                            {hasFlawPhotos && (
                              <div>
                                <p className="text-xs text-gray-500 mb-2">瑕疵照片（点击放大查看）</p>
                                <div className="grid grid-cols-4 gap-2">
                                  {item.flawPhotos.map((photo, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => openPhotoPreview(item.flawPhotos, idx, item.code)}
                                      className="relative aspect-square rounded-lg overflow-hidden border border-surface-200 cursor-pointer hover:border-primary-400 hover:shadow-md transition-all group"
                                    >
                                      <img
                                        src={photo}
                                        alt={`瑕疵照片${idx + 1}`}
                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!hasFlawPhotos && !item.description && (
                              <div className="rounded-lg bg-white border border-surface-100 p-4 text-center">
                                <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">该衣物未记录瑕疵信息</p>
                              </div>
                            )}

                            <div className="border-t border-dashed border-surface-200 pt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                                  <Camera className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    取件现状拍照
                                    <span className="text-red-500 ml-1">*</span>
                                  </p>
                                  <p className="text-xs text-gray-500">（取件时拍摄衣物现状，必填）</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {getItemPickupPhotos(item.id).map((photo, photoIndex) => (
                                  <div key={photoIndex} className="relative h-20 w-20 rounded-lg overflow-hidden border border-surface-200">
                                    <img src={photo} alt="取件现状" className="h-full w-full object-cover" />
                                    <button
                                      onClick={() => handleRemovePickupPhoto(item.id, photoIndex)}
                                      className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-black/50 text-white hover:bg-black/70"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                {getItemPickupPhotos(item.id).length < 9 && (
                                  <>
                                    <input
                                      ref={(el) => {
                                        pickupFileInputRefs.current[item.id] = el;
                                      }}
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={(e) => handlePickupFileUpload(item.id, e.target.files)}
                                    />
                                    <button
                                      onClick={() => pickupFileInputRefs.current[item.id]?.click()}
                                      className={cn(
                                        'flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                                        getItemPickupPhotos(item.id).length === 0
                                          ? 'border-red-300 text-red-400 hover:border-red-400 hover:text-red-500 bg-red-50/30'
                                          : 'border-surface-300 text-gray-400 hover:border-primary-400 hover:text-primary-500'
                                      )}
                                    >
                                      <Camera className="h-6 w-6 mb-1" />
                                      <span className="text-xs">添加</span>
                                    </button>
                                  </>
                                )}
                              </div>
                              {getItemPickupPhotos(item.id).length === 0 && (
                                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  请至少拍摄1张取件现状照片
                                </p>
                              )}
                            </div>

                            <div className="rounded-lg bg-primary-50 border border-primary-100 p-3">
                              <p className="text-xs font-medium text-primary-700 mb-1">取件核对提示</p>
                              <p className="text-xs text-primary-600">
                                请对照上方照片确认衣物现状，与客户确认无误后再完成取件核销。
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Card className="sticky bottom-4 shadow-lg border-primary-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-sm text-gray-500">已选件数：</span>
                      <span className="text-xl font-bold text-primary-600 ml-1">{selectedItems.size}</span>
                      <span className="text-sm text-gray-500 ml-1">件</span>
                    </div>
                    <div className="h-6 w-px bg-surface-200" />
                    <div>
                      <span className="text-sm text-gray-500">衣物总价：</span>
                      <span className="text-xl font-bold text-gray-700 ml-1">¥{totalAmount.toFixed(2)}</span>
                    </div>
                    {overdueFee > 0 && (
                      <>
                        <div className="h-6 w-px bg-surface-200" />
                        <div>
                          <span className="text-sm text-gray-500">超时保管费：</span>
                          <span className="text-xl font-bold text-warning-600 ml-1">¥{overdueFee.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="h-6 w-px bg-surface-200" />
                    <div>
                      <span className="text-sm text-gray-500">应付总计：</span>
                      <span className="text-2xl font-bold text-primary-600 ml-1">
                        ¥{(totalAmount + overdueFee).toFixed(2)}
                      </span>
                    </div>
                    {selectedItems.size > 0 && (
                      <>
                        <div className="h-6 w-px bg-surface-200" />
                        <div>
                          <span className="text-sm text-gray-500">取件照片：</span>
                          <span className={cn(
                            'text-xl font-bold ml-1',
                            allSelectedHavePickupPhotos() ? 'text-green-600' : 'text-red-500'
                          )}>
                            {selectedItemList.filter((item) => getItemPickupPhotos(item.id).length > 0).length}/{selectedItems.size}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">已上传</span>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    size="lg"
                    onClick={handleConfirmPickup}
                    disabled={selectedItems.size === 0 || !allSelectedHavePickupPhotos()}
                    leftIcon={<CheckSquare className="h-5 w-5" />}
                  >
                    确认取件核销
                  </Button>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">该客户暂无待取件衣物</p>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal
        open={showSuccessModal}
        title="取件核销成功"
        onClose={handleCloseSuccessModal}
        showClose={false}
        footer={
          <Button onClick={handleCloseSuccessModal}>
            完成
          </Button>
        }
      >
        <div className="text-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-4">取件核销成功</p>

          {pickedUpSummary && (
            <div className="text-left bg-surface-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">客户姓名</span>
                <span className="font-medium text-gray-700">{pickedUpSummary.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">联系电话</span>
                <span className="font-medium text-gray-700">{pickedUpSummary.customerPhone}</span>
              </div>
              <div className="border-t border-surface-200 pt-3">
                <p className="text-sm text-gray-500 mb-2">取件衣物（{pickedUpSummary.items.length}件）</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {pickedUpSummary.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="font-mono text-gray-600">{item.code}</span>
                      <span className="font-medium text-primary-600">¥{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {pickedUpSummary.overdueFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">超时保管费</span>
                  <span className="font-medium text-warning-600">¥{pickedUpSummary.overdueFee.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-surface-200 pt-3 flex justify-between items-baseline">
                <span className="text-gray-600 font-medium">应付总计</span>
                <span className="text-2xl font-bold text-primary-600">
                  ¥{(pickedUpSummary.totalAmount + pickedUpSummary.overdueFee).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">取件时间</span>
                <span className="font-medium text-gray-700">{formatDate(new Date(), 'YYYY年MM月DD日 HH:mm')}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={photoPreview.open}
        title={`瑕疵照片 - ${photoPreview.clothingCode}`}
        onClose={closePhotoPreview}
        width="max-w-3xl"
        footer={
          photoPreview.photos.length > 1 ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-gray-500">
                {photoPreview.currentIndex + 1} / {photoPreview.photos.length}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={prevPhoto} leftIcon={<ChevronLeft className="h-4 w-4" />}>
                  上一张
                </Button>
                <Button onClick={nextPhoto} rightIcon={<ChevronRight className="h-4 w-4" />}>
                  下一张
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {photoPreview.photos.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="relative w-full rounded-lg overflow-hidden bg-surface-50 border border-surface-200">
              <img
                src={photoPreview.photos[photoPreview.currentIndex]}
                alt={`瑕疵照片${photoPreview.currentIndex + 1}`}
                className="w-full max-h-[60vh] object-contain"
              />
            </div>
            {photoPreview.photos.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 w-full">
                {photoPreview.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPhotoPreview((prev) => ({ ...prev, currentIndex: idx }))}
                    className={cn(
                      'flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-all',
                      idx === photoPreview.currentIndex
                        ? 'border-primary-500 shadow-md'
                        : 'border-surface-200 hover:border-primary-300'
                    )}
                  >
                    <img
                      src={photo}
                      alt={`缩略图${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
