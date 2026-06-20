import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Phone,
  CreditCard,
  Clock,
  Calendar,
  Shirt,
  Sparkles,
  Check,
  ArrowRight,
  ImageIcon,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatDate } from '@/utils/dateUtils';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import type {
  Order,
  OrderStatus,
  ClothingCategory,
  WashMethod,
} from '@/types';

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  received: { label: '已收件', variant: 'primary' },
  washing: { label: '洗涤中', variant: 'info' },
  ready: { label: '待取件', variant: 'success' },
  picked_up: { label: '已取件', variant: 'default' },
  overdue: { label: '超期', variant: 'danger' },
};

const statusFlow: Record<OrderStatus, { nextStatus: OrderStatus | null; buttonText: string }> = {
  received: { nextStatus: 'washing', buttonText: '开始洗涤' },
  washing: { nextStatus: 'ready', buttonText: '完成洗涤' },
  ready: { nextStatus: 'picked_up', buttonText: '确认取件' },
  picked_up: { nextStatus: null, buttonText: '' },
  overdue: { nextStatus: 'picked_up', buttonText: '确认取件' },
};

const timelineSteps: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'received', label: '已收件', icon: <Calendar className="h-4 w-4" /> },
  { status: 'washing', label: '洗涤中', icon: <Sparkles className="h-4 w-4" /> },
  { status: 'ready', label: '待取件', icon: <Check className="h-4 w-4" /> },
  { status: 'picked_up', label: '已取件', icon: <Check className="h-4 w-4" /> },
];

const categoryNames: Record<ClothingCategory, string> = {
  laundry: '普通洗衣',
  dry_clean: '干洗',
  wash: '水洗',
  iron: '熨烫',
  leather: '皮具护理',
  shoes: '鞋子洗护',
};

const washMethodNames: Record<WashMethod, string> = {
  standard: '标准洗涤',
  gentle: '轻柔洗涤',
  deep_clean: '深度清洁',
  hand_wash: '手洗',
};

const categoryTagVariants: Record<ClothingCategory, 'primary' | 'success' | 'warning' | 'info' | 'purple' | 'default'> = {
  laundry: 'primary',
  dry_clean: 'info',
  wash: 'primary',
  iron: 'warning',
  leather: 'purple',
  shoes: 'success',
};

function getCategoryName(category: ClothingCategory): string {
  return categoryNames[category] || category;
}

function getWashMethodName(method: WashMethod): string {
  return washMethodNames[method] || method;
}

function getEffectiveStatus(order: Order): OrderStatus {
  if (order.status === 'overdue') return 'ready';
  return order.status;
}

function getStepStatus(stepStatus: OrderStatus, currentStatus: OrderStatus): 'completed' | 'active' | 'pending' {
  const stepIndex = timelineSteps.findIndex((s) => s.status === stepStatus);
  const currentIndex = timelineSteps.findIndex((s) => s.status === currentStatus);

  if (currentStatus === 'picked_up' && stepStatus === 'picked_up') return 'completed';
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

export default function OrderDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getOrderById = useOrderStore((s) => s.getOrderById);
  const updateOrderStatus = useOrderStore((s) => s.updateOrderStatus);

  const order = useMemo(() => getOrderById(id), [id, getOrderById]);
  const effectiveStatus = order ? getEffectiveStatus(order) : 'received';

  const handleBack = () => {
    navigate('/orders');
  };

  const handleStatusFlow = () => {
    if (!order) return;
    const flow = statusFlow[order.status];
    if (flow.nextStatus) {
      updateOrderStatus({ orderId: order.id, status: flow.nextStatus });
    }
  };

  if (!order) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={handleBack}>
            返回
          </Button>
        </div>
        <div className="py-16">
          <Empty description="订单不存在" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={handleBack}>
          返回
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary-900">订单详情</h1>
            <span className="font-mono text-lg font-semibold text-primary-700">{order.orderNo}</span>
            <Tag variant={statusConfig[order.status].variant}>
              {statusConfig[order.status].label}
            </Tag>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            下单时间：{formatDate(order.createdAt, 'YYYY年MM月DD日 HH:mm')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-800">客户信息</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">姓名：</span>
                <span className="text-sm font-medium text-gray-800">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">手机：</span>
                <span className="text-sm font-medium text-gray-800">{order.customerPhone}</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-800">支付信息</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">商品小计</span>
                <span className="text-sm font-medium text-gray-800 font-mono">¥{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">优惠金额</span>
                  <span className="text-sm font-medium text-red-500 font-mono">-¥{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-surface-100 pt-3">
                <span className="text-sm font-medium text-gray-800">应付金额</span>
                <span className="text-lg font-bold text-primary-600 font-mono">¥{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">实付金额</span>
                <span className="text-sm font-medium text-accent-600 font-mono">¥{order.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">支付方式</span>
                <span className="text-sm font-medium text-gray-800">{order.paymentMethod}</span>
              </div>
            </div>
          </Card>

          {order.remark && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary-500" />
                <h3 className="font-semibold text-gray-800">备注</h3>
              </div>
              <p className="text-sm text-gray-600">{order.remark}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-800">订单状态</h3>
            </div>
            <div className="relative flex items-start justify-between px-4">
              <div className="absolute left-8 right-8 top-5 h-0.5 bg-surface-200" />
              {timelineSteps.map((step, index) => {
                const stepState = getStepStatus(step.status, effectiveStatus);
                const isLast = index === timelineSteps.length - 1;
                return (
                  <div
                    key={step.status}
                    className={cn(
                      'relative z-10 flex flex-col items-center',
                      !isLast && 'flex-1'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                        stepState === 'completed' && 'bg-accent-500 border-accent-500 text-white',
                        stepState === 'active' && 'border-primary-500 bg-primary-50 text-primary-600',
                        stepState === 'pending' && 'border-surface-200 bg-white text-gray-400'
                      )}
                    >
                      {stepState === 'completed' ? <Check className="h-5 w-5" /> : step.icon}
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium text-center',
                        stepState === 'completed' && 'text-accent-600',
                        stepState === 'active' && 'text-primary-600',
                        stepState === 'pending' && 'text-gray-400'
                      )}
                    >
                      {step.label}
                    </span>
                    {order.status === 'overdue' && step.status === 'ready' && (
                      <Tag variant="danger" size="sm" className="mt-1">
                        已超期
                      </Tag>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Shirt className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-800">衣物明细</h3>
              <span className="text-sm text-gray-500">（共 {order.clothes.length} 件）</span>
            </div>
            <div className="space-y-4">
              {order.clothes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-surface-200 bg-surface-50/50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-primary-700">
                          {item.code}
                        </span>
                        <Tag variant={categoryTagVariants[item.category]} size="sm">
                          {getCategoryName(item.category)}
                        </Tag>
                        <Tag variant={statusConfig[item.status].variant} size="sm">
                          {statusConfig[item.status].label}
                        </Tag>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                        <div>
                          <span className="text-gray-500">颜色：</span>
                          <span className="text-gray-800">{item.color || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">品牌：</span>
                          <span className="text-gray-800">{item.brand || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">洗涤方式：</span>
                          <span className="text-gray-800">{getWashMethodName(item.washMethod)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">入库时间：</span>
                          <span className="text-gray-800">{formatDate(item.receivedAt, 'YYYY-MM-DD HH:mm')}</span>
                        </div>
                        {item.description && (
                          <div className="col-span-2">
                            <span className="text-gray-500">描述：</span>
                            <span className="text-gray-800">{item.description}</span>
                          </div>
                        )}
                      </div>
                      {item.specialTreatments.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">特殊处理：</span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {item.specialTreatments.map((st) => (
                              <Tag key={st.id} variant="warning" size="sm">
                                {st.name} +¥{st.price}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.flawPhotos.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">瑕疵照片：</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {item.flawPhotos.map((photo, idx) => (
                              <div
                                key={idx}
                                className="relative h-16 w-16 rounded-md overflow-hidden border border-surface-200 bg-surface-100"
                              >
                                <img
                                  src={photo}
                                  alt={`瑕疵照片${idx + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.flawPhotos.length === 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">瑕疵照片：</span>
                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                            <ImageIcon className="h-3 w-3" />
                            <span>无</span>
                          </div>
                        </div>
                      )}
                      {item.pickupPhotos.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">取件照片：</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {item.pickupPhotos.map((photo, idx) => (
                              <div
                                key={idx}
                                className="relative h-16 w-16 rounded-md overflow-hidden border border-blue-200 bg-blue-50"
                              >
                                <img
                                  src={photo}
                                  alt={`取件照片${idx + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.pickupPhotos.length === 0 && item.status === 'picked_up' && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">取件照片：</span>
                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                            <ImageIcon className="h-3 w-3" />
                            <span>无</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">价格</p>
                      <p className="text-xl font-bold text-primary-600 font-mono">
                        ¥{item.totalPrice.toFixed(2)}
                      </p>
                      {item.extraPrice > 0 && (
                        <p className="text-xs text-gray-400">
                          含附加 ¥{item.extraPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {statusFlow[order.status].nextStatus && (
            <div className="flex justify-end">
              <Button
                size="lg"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={handleStatusFlow}
              >
                {statusFlow[order.status].buttonText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
