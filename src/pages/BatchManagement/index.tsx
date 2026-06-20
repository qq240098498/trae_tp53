import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  MapPin,
  Calendar,
  Clock,
  Check,
  ChevronRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Filter,
  Shirt,
  Info,
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
import type { BatchStatus, CollectionBatch } from '@/types';

const PAGE_SIZE = 10;

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

type StatusFilter = 'all' | BatchStatus;

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待收' },
  { value: 'collecting', label: '收集中' },
  { value: 'collected', label: '已收' },
  { value: 'washing', label: '洗涤中' },
  { value: 'returning', label: '派送中' },
  { value: 'returned', label: '已送回' },
  { value: 'cancelled', label: '已取消' },
];

export default function BatchManagement() {
  const navigate = useNavigate();
  const { batches, searchBatches, getActivePickupPoints, addBatch, updateBatchStatus, deleteBatch } = useGroupCollectStore();
  const { getUnassignedOrders, assignOrderToBatch, unassignOrderFromBatch } = useOrderStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null);

  const [selectedPickupPoint, setSelectedPickupPoint] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const activePoints = getActivePickupPoints();

  const filteredBatches = useMemo(() => {
    let result = keyword ? searchBatches(keyword) : batches;

    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [batches, keyword, statusFilter, searchBatches]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE));
  const pageBatches = filteredBatches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const unassignedOrders = useMemo(() => {
    return getUnassignedOrders().filter((o) => o.status === 'received');
  }, [getUnassignedOrders]);

  const handleOpenCreate = () => {
    setSelectedPickupPoint('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().slice(0, 10));
    setSelectedOrderIds([]);
    setFormErrors({});
    setShowCreateModal(true);
  };

  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!selectedPickupPoint) errors.pickupPoint = '请选择收件点';
    if (!scheduledDate) errors.scheduledDate = '请选择收送日期';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateBatch = () => {
    if (!validateCreateForm()) return;

    const point = activePoints.find((p) => p.id === selectedPickupPoint);
    if (!point) return;

    const availableOrderIds = selectedOrderIds.filter((id) => {
      const order = unassignedOrders.find((o) => o.id === id);
      return order !== undefined;
    });

    const batch = addBatch({
      pickupPointId: point.id,
      pickupPointName: point.name,
      scheduledDate,
      scheduledTime: point.collectionTime,
      orderIds: availableOrderIds,
    });

    if (!batch) return;

    availableOrderIds.forEach((orderId) => {
      assignOrderToBatch({
        orderId,
        batchId: batch.id,
        batchNo: batch.batchNo,
        pickupPointId: point.id,
        pickupPointName: point.name,
      });
    });

    setShowCreateModal(false);
    navigate(`/batches/${batch.id}`);
  };

  const handleToggleOrderSelect = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = () => {
    if (selectedOrderIds.length === unassignedOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(unassignedOrders.map((o) => o.id));
    }
  };

  const handleViewDetail = (batchId: string) => {
    navigate(`/batches/${batchId}`);
  };

  const handleStatusFlow = (batch: CollectionBatch) => {
    const flow = statusFlow[batch.status];
    if (flow.nextStatus) {
      updateBatchStatus({ batchId: batch.id, status: flow.nextStatus });
    }
  };

  const handleDelete = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (batch) {
      batch.orderIds.forEach((orderId) => {
        unassignOrderFromBatch({ orderId });
      });
    }
    deleteBatch(batchId);
    setDeleteConfirmOpen(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const renderPagination = () => {
    if (filteredBatches.length === 0) return null;

    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, filteredBatches.length);

    return (
      <div className="flex items-center justify-between border-t border-surface-100 px-5 py-3">
        <div className="text-sm text-gray-500">
          显示 {start}-{end} 条，共 {filteredBatches.length} 条
        </div>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => handlePageChange(1)} leftIcon={<ChevronsLeft className="h-3.5 w-3.5" />} />
          <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} leftIcon={<ChevronLeft className="h-3.5 w-3.5" />} />
          <span className="px-3 text-sm text-gray-600">{currentPage} / {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} leftIcon={<ChevronRightIcon className="h-3.5 w-3.5" />} />
          <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => handlePageChange(totalPages)} leftIcon={<ChevronsRight className="h-3.5 w-3.5" />} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">批次单管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理小区团收的收件批次单</p>
        </div>
        <Button onClick={handleOpenCreate} leftIcon={<Plus className="h-4 w-4" />}>
          生成批次单
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-gray-800">筛选条件</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">批次状态</label>
            <div className="flex flex-wrap gap-2">
              {statusFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); }}
                  className={cn(
                    'h-8 px-3 rounded-lg text-sm font-medium transition-colors border',
                    statusFilter === opt.value
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-surface-200 hover:border-primary-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm text-gray-600 mb-1.5">搜索批次</label>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="批次号 / 收件点名称"
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {pageBatches.length === 0 ? (
          <div className="py-16"><Empty /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="px-5 py-3 font-medium text-gray-600">批次号</th>
                    <th className="px-5 py-3 font-medium text-gray-600">收件点</th>
                    <th className="px-5 py-3 font-medium text-gray-600">收送日期</th>
                    <th className="px-5 py-3 font-medium text-gray-600">订单数</th>
                    <th className="px-5 py-3 font-medium text-gray-600">状态</th>
                    <th className="px-5 py-3 font-medium text-gray-600">创建时间</th>
                    <th className="px-5 py-3 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pageBatches.map((batch) => (
                    <tr key={batch.id} className="border-b border-surface-100 transition-colors hover:bg-surface-50">
                      <td className="px-5 py-4">
                        <span className="font-mono font-medium text-primary-700">{batch.batchNo}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-800">{batch.pickupPointName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>{batch.scheduledDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Clock className="h-3 w-3" />
                            <span>{batch.scheduledTime}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono">{batch.totalOrders}</span> 单
                      </td>
                      <td className="px-5 py-4">
                        <Tag variant={statusConfig[batch.status].variant} size="sm">
                          {statusConfig[batch.status].label}
                        </Tag>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(batch.createdAt, 'YYYY-MM-DD HH:mm')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => handleViewDetail(batch.id)}>
                            详情
                          </Button>
                          {statusFlow[batch.status].nextStatus && (
                            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />} onClick={() => handleStatusFlow(batch)}>
                              {statusFlow[batch.status].buttonText}
                            </Button>
                          )}
                          {(batch.status === 'pending' || batch.status === 'cancelled') && (
                            <button
                              onClick={() => setDeleteConfirmOpen(batch.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        )}
      </Card>

      <Modal
        open={showCreateModal}
        title="生成收件批次单"
        onClose={() => setShowCreateModal(false)}
        width="max-w-3xl"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
            <Button onClick={handleCreateBatch}>生成批次单</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                选择收件点 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPickupPoint}
                onChange={(e) => setSelectedPickupPoint(e.target.value)}
                className={cn(
                  'w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white',
                  formErrors.pickupPoint ? 'border-red-300' : 'border-surface-200'
                )}
              >
                <option value="">请选择收件点</option>
                {activePoints.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {formErrors.pickupPoint && <p className="mt-1 text-xs text-red-500">{formErrors.pickupPoint}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                收送日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={cn(
                  'w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                  formErrors.scheduledDate ? 'border-red-300' : 'border-surface-200'
                )}
              />
              {formErrors.scheduledDate && <p className="mt-1 text-xs text-red-500">{formErrors.scheduledDate}</p>}
            </div>
          </div>

          {selectedPickupPoint && (
            <div className="p-3 rounded-lg bg-primary-50 border border-primary-100">
              <div className="flex items-center gap-2 text-sm text-primary-700">
                <Info className="h-4 w-4" />
                {(() => {
                  const point = activePoints.find((p) => p.id === selectedPickupPoint);
                  if (!point) return null;
                  const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                  const weekdays = point.collectionWeekdays.map((d) => weekdayMap[d]).join('、');
                  return (
                    <span>
                      收件点 <strong>{point.name}</strong> 每周收送日：{weekdays}，收送时间：{point.collectionTime}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shirt className="h-5 w-5 text-primary-500" />
                <h4 className="font-semibold text-gray-800">选择待收订单</h4>
                <Tag variant="primary" size="sm">已选 {selectedOrderIds.length} / {unassignedOrders.length}</Tag>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSelectAllOrders}>
                {selectedOrderIds.length === unassignedOrders.length && unassignedOrders.length > 0 ? '取消全选' : '全选'}
              </Button>
            </div>

            {unassignedOrders.length === 0 ? (
              <div className="py-12 rounded-lg border border-dashed border-surface-200">
                <Empty />
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {unassignedOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
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
                          <span>{order.clothes.length} 件衣物</span>
                          <span>¥{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen !== null}
        title="删除批次单"
        onClose={() => setDeleteConfirmOpen(null)}
        onConfirm={() => deleteConfirmOpen && handleDelete(deleteConfirmOpen)}
        confirmText="确认删除"
      >
        <p className="text-gray-600">确定要删除该批次单吗？批次中的订单将被移出批次。此操作不可恢复。</p>
      </Modal>
    </div>
  );
}
