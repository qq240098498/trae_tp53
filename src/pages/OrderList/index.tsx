import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatDate } from '@/utils/dateUtils';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

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

const PAGE_SIZE = 10;

type StatusFilter = 'all' | OrderStatus;

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'received', label: '已收件' },
  { value: 'washing', label: '洗涤中' },
  { value: 'ready', label: '待取件' },
  { value: 'picked_up', label: '已取件' },
  { value: 'overdue', label: '超期' },
];

export default function OrderList() {
  const navigate = useNavigate();
  const { orders, searchOrders, updateOrderStatus, checkOverdueOrders } = useOrderStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOrders = useMemo(() => {
    checkOverdueOrders();

    let result = keyword ? searchOrders(keyword) : orders;

    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((o) => new Date(o.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.createdAt) <= to);
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, dateFrom, dateTo, keyword, searchOrders, checkOverdueOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pageOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleViewDetail = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleStatusFlow = (order: Order) => {
    const flow = statusFlow[order.status];
    if (flow.nextStatus) {
      updateOrderStatus({ orderId: order.id, status: flow.nextStatus });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const renderPagination = () => {
    if (filteredOrders.length === 0) return null;

    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, filteredOrders.length);

    return (
      <div className="flex items-center justify-between border-t border-surface-100 px-5 py-3">
        <div className="text-sm text-gray-500">
          显示 {start}-{end} 条，共 {filteredOrders.length} 条
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">订单管理</h1>
          <p className="mt-1 text-sm text-gray-500">查看和管理所有订单</p>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-gray-800">筛选条件</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">订单状态</label>
            <div className="flex flex-wrap gap-2">
              {statusFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setCurrentPage(1);
                  }}
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
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">开始日期</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">结束日期</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">搜索订单</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="订单号 / 手机号 / 客户名"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {pageOrders.length === 0 ? (
          <div className="py-16">
            <Empty />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="px-5 py-3 font-medium text-gray-600">订单号</th>
                    <th className="px-5 py-3 font-medium text-gray-600">客户姓名</th>
                    <th className="px-5 py-3 font-medium text-gray-600">手机号</th>
                    <th className="px-5 py-3 font-medium text-gray-600">件数</th>
                    <th className="px-5 py-3 font-medium text-gray-600">金额</th>
                    <th className="px-5 py-3 font-medium text-gray-600">状态</th>
                    <th className="px-5 py-3 font-medium text-gray-600">下单时间</th>
                    <th className="px-5 py-3 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pageOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-surface-100 transition-colors hover:bg-surface-50"
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono font-medium text-primary-700">{order.orderNo}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-800">{order.customerName}</td>
                      <td className="px-5 py-4 text-gray-600">{order.customerPhone}</td>
                      <td className="px-5 py-4 text-gray-800">
                        <span className="font-mono">{order.clothes.length}</span> 件
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-semibold text-primary-600">
                          ¥{order.totalAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Tag variant={statusConfig[order.status].variant} size="sm">
                          {statusConfig[order.status].label}
                        </Tag>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(order.createdAt, 'YYYY-MM-DD HH:mm')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                            onClick={() => handleViewDetail(order.id)}
                          >
                            详情
                          </Button>
                          {statusFlow[order.status].nextStatus && (
                            <Button
                              variant="primary"
                              size="sm"
                              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                              onClick={() => handleStatusFlow(order)}
                            >
                              {statusFlow[order.status].buttonText}
                            </Button>
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
    </div>
  );
}
