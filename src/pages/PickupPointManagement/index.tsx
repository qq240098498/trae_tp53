import { useState } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Phone,
  User,
  Clock,
  Building2,
  Store,
  MoreHorizontal,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Tag from '@/components/Tag';
import Modal from '@/components/Modal';
import Empty from '@/components/Empty';
import { useGroupCollectStore } from '@/store/groupCollectStore';
import { formatDate } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import type { PickupPointType, CollectionWeekday } from '@/types';

const WEEKDAY_LABELS: { value: CollectionWeekday; label: string }[] = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
];

const PICKUP_POINT_TYPE_OPTIONS: { value: PickupPointType; label: string; icon: typeof Building2 }[] = [
  { value: 'community_gate', label: '小区门口', icon: Building2 },
  { value: 'convenience_store', label: '便利店代收点', icon: Store },
  { value: 'other', label: '其他', icon: MoreHorizontal },
];

interface PickupPointFormData {
  name: string;
  type: PickupPointType;
  address: string;
  contactName: string;
  contactPhone: string;
  collectionWeekdays: CollectionWeekday[];
  collectionTime: string;
  remark: string;
}

const emptyForm: PickupPointFormData = {
  name: '',
  type: 'community_gate',
  address: '',
  contactName: '',
  contactPhone: '',
  collectionWeekdays: [],
  collectionTime: '18:00',
  remark: '',
};

export default function PickupPointManagement() {
  const { pickupPoints, searchPickupPoints, addPickupPoint, updatePickupPoint, togglePickupPointActive, deletePickupPoint } = useGroupCollectStore();

  const [keyword, setKeyword] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState<string | null>(null);
  const [formData, setFormData] = useState<PickupPointFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null);

  const filteredPoints = keyword ? searchPickupPoints(keyword) : pickupPoints;

  const handleOpenCreate = () => {
    setEditingPoint(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleOpenEdit = (pointId: string) => {
    const point = pickupPoints.find((p) => p.id === pointId);
    if (!point) return;
    setEditingPoint(pointId);
    setFormData({
      name: point.name,
      type: point.type,
      address: point.address,
      contactName: point.contactName,
      contactPhone: point.contactPhone,
      collectionWeekdays: point.collectionWeekdays,
      collectionTime: point.collectionTime,
      remark: point.remark || '',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = '请输入收件点名称';
    if (!formData.address.trim()) errors.address = '请输入详细地址';
    if (!formData.contactName.trim()) errors.contactName = '请输入联系人姓名';
    if (!formData.contactPhone.trim()) {
      errors.contactPhone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$/.test(formData.contactPhone.trim())) {
      errors.contactPhone = '请输入正确的手机号';
    }
    if (formData.collectionWeekdays.length === 0) errors.collectionWeekdays = '请至少选择一个收送日';
    if (!formData.collectionTime.trim()) errors.collectionTime = '请选择收送时间';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingPoint) {
      updatePickupPoint({
        id: editingPoint,
        updates: {
          name: formData.name.trim(),
          type: formData.type,
          address: formData.address.trim(),
          contactName: formData.contactName.trim(),
          contactPhone: formData.contactPhone.trim(),
          collectionWeekdays: formData.collectionWeekdays,
          collectionTime: formData.collectionTime,
          remark: formData.remark.trim() || undefined,
        },
      });
    } else {
      addPickupPoint({
        name: formData.name.trim(),
        type: formData.type,
        address: formData.address.trim(),
        contactName: formData.contactName.trim(),
        contactPhone: formData.contactPhone.trim(),
        collectionWeekdays: formData.collectionWeekdays,
        collectionTime: formData.collectionTime,
        remark: formData.remark.trim() || undefined,
      });
    }

    setShowFormModal(false);
  };

  const toggleWeekday = (day: CollectionWeekday) => {
    setFormData((prev) => {
      const hasDay = prev.collectionWeekdays.includes(day);
      return {
        ...prev,
        collectionWeekdays: hasDay
          ? prev.collectionWeekdays.filter((d) => d !== day)
          : [...prev.collectionWeekdays, day].sort((a, b) => a - b),
      };
    });
  };

  const handleDelete = (pointId: string) => {
    deletePickupPoint(pointId);
    setDeleteConfirmOpen(null);
  };

  const getWeekdayLabels = (weekdays: CollectionWeekday[]) => {
    return weekdays.map((d) => WEEKDAY_LABELS.find((w) => w.value === d)?.label || '').join('、');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">收件点管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理小区团收的固定收件点</p>
        </div>
        <Button onClick={handleOpenCreate} leftIcon={<Plus className="h-4 w-4" />}>
          新增收件点
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Search className="h-5 w-5 text-primary-500" />
          <h3 className="font-semibold text-gray-800">收件点列表</h3>
        </div>
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索收件点名称、地址、联系人..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
        </div>

        {filteredPoints.length === 0 ? (
          <div className="py-16">
            <Empty />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPoints.map((point) => {
              const typeConfig = PICKUP_POINT_TYPE_OPTIONS.find((t) => t.value === point.type);
              return (
                <div
                  key={point.id}
                  className={cn(
                    'rounded-lg border-2 p-4 transition-all',
                    point.isActive
                      ? 'border-surface-200 bg-white hover:border-primary-200 hover:shadow-md'
                      : 'border-surface-100 bg-surface-50 opacity-70'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                        <MapPin className="h-5 w-5 text-primary-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{point.name}</h4>
                        <p className="text-xs text-gray-400 font-mono">{point.pointNo}</p>
                      </div>
                    </div>
                    <Tag variant={point.isActive ? 'success' : 'default'} size="sm">
                      {point.isActive ? '启用中' : '已停用'}
                    </Tag>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      {typeConfig?.icon && <typeConfig.icon className="h-4 w-4 text-gray-400" />}
                      <span>{typeConfig?.label}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{point.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{point.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{point.contactPhone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>收送日：{getWeekdayLabels(point.collectionWeekdays)}</p>
                        <p>收送时间：{point.collectionTime}</p>
                      </div>
                    </div>
                  </div>

                  {point.remark && (
                    <p className="mt-3 pt-3 border-t border-surface-100 text-xs text-gray-500 line-clamp-2">
                      备注：{point.remark}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-surface-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      创建于 {formatDate(point.createdAt, 'YYYY-MM-DD')}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePickupPointActive(point.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-surface-100 transition-colors"
                        title={point.isActive ? '停用' : '启用'}
                      >
                        {point.isActive ? (
                          <ToggleRight className="h-5 w-5 text-accent-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(point.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-primary-50 hover:text-primary-500 transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmOpen(point.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        open={showFormModal}
        title={editingPoint ? '编辑收件点' : '新增收件点'}
        onClose={() => setShowFormModal(false)}
        width="max-w-2xl"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowFormModal(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingPoint ? '保存修改' : '创建收件点'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1.5">
                收件点名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="如：阳光花园小区门口"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={cn(
                  'w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                  formErrors.name ? 'border-red-300' : 'border-surface-200'
                )}
              />
              {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                收件点类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PickupPointType })}
                className="w-full h-10 px-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
              >
                {PICKUP_POINT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                收送时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.collectionTime}
                onChange={(e) => setFormData({ ...formData, collectionTime: e.target.value })}
                className={cn(
                  'w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                  formErrors.collectionTime ? 'border-red-300' : 'border-surface-200'
                )}
              />
              {formErrors.collectionTime && (
                <p className="mt-1 text-xs text-red-500">{formErrors.collectionTime}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1.5">
                详细地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="请输入详细地址"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={cn(
                  'w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                  formErrors.address ? 'border-red-300' : 'border-surface-200'
                )}
              />
              {formErrors.address && <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                联系人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="联系人姓名"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className={cn(
                  'w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                  formErrors.contactName ? 'border-red-300' : 'border-surface-200'
                )}
              />
              {formErrors.contactName && (
                <p className="mt-1 text-xs text-red-500">{formErrors.contactName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">
                联系电话 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="手机号"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className={cn(
                  'w-full h-10 px-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                  formErrors.contactPhone ? 'border-red-300' : 'border-surface-200'
                )}
              />
              {formErrors.contactPhone && (
                <p className="mt-1 text-xs text-red-500">{formErrors.contactPhone}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1.5">
                每周收送日 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((day) => {
                  const isSelected = formData.collectionWeekdays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(day.value)}
                      className={cn(
                        'h-9 px-4 rounded-lg border text-sm font-medium transition-colors',
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-600'
                          : 'border-surface-200 bg-white text-gray-600 hover:border-primary-300'
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              {formErrors.collectionWeekdays && (
                <p className="mt-1 text-xs text-red-500">{formErrors.collectionWeekdays}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1.5">备注</label>
              <textarea
                placeholder="可选备注信息"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmOpen !== null}
        title="删除收件点"
        onClose={() => setDeleteConfirmOpen(null)}
        onConfirm={() => deleteConfirmOpen && handleDelete(deleteConfirmOpen)}
        confirmText="确认删除"
        confirmLoading={false}
      >
        <p className="text-gray-600">确定要删除该收件点吗？如果该收件点有关联批次单，将无法删除。此操作不可恢复。</p>
      </Modal>
    </div>
  );
}
