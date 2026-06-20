import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Eye,
  Plus,
  Check,
  ChevronRight,
  Package,
  Shirt,
  User,
  Phone,
  Trash2,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import Modal from '@/components/Modal';
import Empty from '@/components/Empty';
import { useGroupCollectStore } from '@/store/groupCollectStore';
import { useOrderStore } from '@/store/orderStore';
import { formatDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import type { BatchStatus } from '@/types';

const statusConfig: Record<BatchStatus, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  pending: { label: '待收', variant: 'primary' },
  collecting: { label: '收集中', variant: 'info' },
  collected: { label: '已收', variant: 'warning' },
  washing: { label: '洗涤中', variant: 'purple' },
  returning: { label: '派送中', variant: 'info' },
  returned: { label: '已送回', variant: 'success' },
  cancelled: { label: '已取消', variant: 'default' },
};

const statusFlow: Record<BatchStatus, { nextStatus: BatchStatus | null; buttonText: string }> = {
  pending: { nextStatus: 'collecting', buttonText: '开始收件' },
  collecting: { nextStatus: 'collected', buttonText: '完成收件' },
  collected: { nextStatus: 'washing', buttonText: '开始洗涤' },
  washing: { nextStatus: 'returning', buttonText: '开始派送' },
  returning: { nextStatus: 'returned', buttonText: '完成派送' },
  returned: { nextStatus: null, buttonText: '' },
  cancelled: { nextStatus: null, buttonText: '' },
};

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { getBatchById, getPickupPointById, updateBatchStatus, addOrdersToBatch, removeOrdersFromBatch } = useGroupCollectStore();
  const { getOrderById, getUnassignedOrders, assignOrderToBatch, unassignOrderFromBatch } = useOrderStore();

  const [showAddOrdersModal, setShowAddOrdersModal] = useState(false);
  const [selectedOrderIdsToAdd, setSelectedOrderIdsToAdd] = useState<string[]>([]);
  const [removeOrderConfirm, setRemoveOrderConfirm] = useState<string | null>(null);

  const batch = id ? getBatchById(id) : undefined;
  const pickupPoint = batch ? getPickupPointById(batch.pickupPointId) : undefined;

  const batchOrders = useMemo(() => {
    if (!batch) return [];
    return batch.orderIds.map((oid) => getOrderById(oid)).filter(Boolean);
  }, [batch, getOrderById]);

  const stats = useMemo(() => {
    const totalClothes = batchOrders.reduce((sum, o) => sum + (o?.clothes.length || 0), 0);
    const totalAmount = batchOrders.reduce((sum, o) => sum + (o?.totalAmount || 0), 0);
    return { totalClothes, totalAmount };
  }, [batchOrders]);

  const unassignedOrders = useMemo(() => {
    return getUnassignedOrders().filter((o) => o.status === 'received');
  }, [getUnassignedOrders]);

  const canModifyOrders = batch && (batch.status === 'pending' || batch.status === 'collecting');

  const handleBack = () => {
    navigate('/batches');
  };

  const handleStatusFlow = () => {
    if (!batch) return;
    const flow = statusFlow[batch.status];
    if (flow.nextStatus) {
      updateBatchStatus({ batchId: batch.id, status: flow.nextStatus });
    }
  };

  const handleAddOrders = () => {
    if (!batch || selectedOrderIdsToAdd.length === 0) return;

    const result = addOrdersToBatch(batch.id, selectedOrderIdsToAdd);
    if (result.success) {
      const addedOrderIds = selectedOrderIdsToAdd.filter(
        (id) => !result.skippedOrderIds.includes(id)
      );
      addedOrderIds.forEach((orderId) => {
        assignOrderToBatch({
          orderId,
          batchId: batch.id,
          batchNo: batch.batchNo,
          pickupPointId: batch.pickupPointId,
          pickupPointName: batch.pickupPointName,
        });
      });
    }

    setSelectedOrderIdsToAdd([]);
    setShowAddOrdersModal(false);
  };

  const handleToggleOrderSelect = (orderId: string) => {
    setSelectedOrderIdsToAdd((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleRemoveOrder = (orderId: string) => {
    if (!batch) return;
    removeOrdersFromBatch(batch.id, [orderId]);
    unassignOrderFromBatch({ orderId });
    setRemoveOrderConfirm(null);
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  if (!batch) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="secondary" onClick={handleBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          返回批次列表
        </Button>
        <div className="py-24"><Empty /></div>
      </div>
    );
  }

  const timelineSteps = [
    { status: 'pending', label: '待收' },
    { status: 'collecting', label: '收集中' },
    { status: 'collected', label: '已收' },
    { status: 'washing', label: '洗涤中' },
    { status: 'returning', label: '派送中' },
    { status: 'returned', label: '已送回' },
  ] as const;

  const currentStepIndex = timelineSteps.findIndex((s) => s.status === batch.status);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">批次单详情</h1>
            <p className="mt-1 text-sm text-gray-500">
              批次号 <span className="font-mono text-primary-600">{batch.batchNo}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Tag variant={statusConfig[batch.status].variant} size="md">
            {statusConfig[batch.status].label}
          </Tag>
          {statusFlow[batch.status].nextStatus && (
            <Button onClick={handleStatusFlow}>
              {statusFlow[batch.status].buttonText}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">批次流程</h3>
          <div className="flex items-center justify-between">
            {timelineSteps.map((step, index) => {
              const isDone = index < currentStepIndex || (index === currentStepIndex && batch.status !== 'pending');
              const isCurrent = index === currentStepIndex && batch.status !== 'cancelled';
              const isCancelled = batch.status === 'cancelled';
              return (
                <div key={step.status} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all text-sm font-medium',
                        isCancelled
                          ? 'border-surface-200 bg-surface-100 text-gray-400'
                          : isDone
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : isCurrent
                          ? 'border-primary-500 text-primary-500 bg-primary-50'
                          : 'border-surface-200 bg-white text-gray-400'
                      )}
                    >
                      {isDone ? <Check className="h-5 w-5" /> : index + 1}
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium',
                        isCancelled
                          ? 'text-gray-400'
                          : isDone || isCurrent
                          ? 'text-primary-600'
                          : 'text-gray-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < timelineSteps.length - 1 && (
                    <div
                      className={cn(
                        'mx-2 h-0.5 flex-1 rounded transition-colors',
                        index < currentStepIndex && !isCancelled ? 'bg-primary-500' : 'bg-surface-200'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-5 w-5 text-primary-500" />
            <h3 className="font-semibold text-gray-800">批次信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">收件点</p>
                <p className="text-sm font-medium text-gray-800">{batch.pickupPointName}</p>
                {pickupPoint && (
                  <p className="text-xs text-gray-500 mt-0.5">{pickupPoint.address}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">收送日期</p>
                <p className="text-sm font-medium text-gray-800">{batch.scheduledDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">收送时间</p>
                <p className="text-sm font-medium text-gray-800">{batch.scheduledTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">创建时间</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(batch.createdAt, 'YYYY-MM-DD HH:mm')}</p>
              </div>
            </div>
            {batch.collectedAt && (
              <div className="flex items-start gap-3">
                <Check className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">完成收件时间</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(batch.collectedAt, 'YYYY-MM-DD HH:mm')}</p>
                </div>
              </div>
            )}
            {batch.returnedAt && (
              <div className="flex items-start gap-3">
                <Check className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">完成派送时间</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(batch.returnedAt, 'YYYY-MM-DD HH:mm')}</p>
                </div>
              </div>
            )}
          </div>
          {batch.remark && (
            <div className="mt-4 pt-4 border-t border-surface-100">
              <p className="text-xs text-gray-500 mb-1">备注</p>
              <p className="text-sm text-gray-700">{batch.remark}</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Shirt className="h-5 w-5 text-primary-500" />
            <h3 className="font-semibold text-gray-800">批次汇总</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary-50 border border-primary-100">
              <p className="text-xs text-primary-600 mb-1">订单总数</p>
              <p className="text-3xl font-bold text-primary-700">{batch.totalOrders}</p>
            </div>
            <div className="p-4 rounded-lg bg-warning-50 border border-warning-100">
              <p className="text-xs text-warning-600 mb-1">衣物总数</p>
              <p className="text-3xl font-bold text-warning-700">{stats.totalClothes}</p>
            </div>
            <div className="p-4 rounded-lg bg-accent-50 border border-accent-100">
              <p className="text-xs text-accent-600 mb-1">总金额</p>
              <p className="text-3xl font-bold text-accent-700">¥{stats.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shirt className="h-5 w-5 text-primary-500" />
            <h3 className="font-semibold text-gray-800">订单列表</h3>
            <Tag variant="info" size="sm">共 {batchOrders.length} 单</Tag>
          </div>
          {canModifyOrders && (
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelectedOrderIdsToAdd([]);
                setShowAddOrdersModal(true);
              }}
            >
              添加订单
            </Button>
          )}
        </div>

        {batchOrders.length === 0 ? (
          <div className="py-16"><Empty /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 font-medium text-gray-600">订单号</th>
                  <th className="px-4 py-3 font-medium text-gray-600">客户</th>
                  <th className="px-4 py-3 font-medium text-gray-600">联系电话</th>
                  <th className="px-4 py-3 font-medium text-gray-600">件数</th>
                  <th className="px-4 py-3 font-medium text-gray-600">金额</th>
                  <th className="px-4 py-3 font-medium text-gray-600">下单时间</th>
                  <th className="px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {batchOrders.map((order) => {
                  if (!order) return null;
                  return (
                    <tr key={order.id} className="border-b border-surface-100 transition-colors hover:bg-surface-50">
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-primary-700">{order.orderNo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-800">{order.customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-600">{order.customerPhone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono">{order.clothes.length}</span> 件
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-primary-600">¥{order.totalAmount.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(order.createdAt, 'YYYY-MM-DD HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                            onClick={() => handleViewOrder(order.id)}
                          >
                            查看
                          </Button>
                          {canModifyOrders && (
                            <button
                              onClick={() => setRemoveOrderConfirm(order.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="移除此订单"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={showAddOrdersModal}
        title="添加订单到批次"
        onClose={() => setShowAddOrdersModal(false)}
        width="max-w-2xl"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowAddOrdersModal(false)}>取消</Button>
            <Button
              onClick={handleAddOrders}
              disabled={selectedOrderIdsToAdd.length === 0}
            >
              添加 {selectedOrderIdsToAdd.length > 0 ? `(${selectedOrderIdsToAdd.length})` : ''}
            </Button>
          </div>
        }
      >
        {unassignedOrders.length === 0 ? (
          <div className="py-12"><Empty /></div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {unassignedOrders.map((order) => {
              const isSelected = selectedOrderIdsToAdd.includes(order.id);
              return (
                <div
                  key={order.id}
                  onClick={() => handleToggleOrderSelect(order.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    isSelected
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-surface-200 hover:border-primary-200 hover:bg-surface-50'
                  )}
                >
                  <div className={cn(
                    'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors flex-shrink-0',
                    isSelected ? 'bg-primary-500 border-primary-500' : 'border-surface-300'
                  )}>
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-primary-700">{order.orderNo}</span>
                      <span className="text-sm text-gray-800">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span>{order.customerPhone}</span>
                      <span>{order.clothes.length} 件</span>
                      <span>¥{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      <Modal
        open={removeOrderConfirm !== null}
        title="移除订单"
        onClose={() => setRemoveOrderConfirm(null)}
        onConfirm={() => removeOrderConfirm && handleRemoveOrder(removeOrderConfirm)}
        confirmText="确认移除"
      >
        <p className="text-gray-600">确定要将此订单从批次中移除吗？</p>
      </Modal>
    </div>
  );
}
