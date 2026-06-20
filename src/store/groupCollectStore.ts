import { create } from 'zustand';
import { createStorage } from '@/utils/storage';
import type { PickupPoint, CollectionBatch, PickupPointType, CollectionWeekday, BatchStatus } from '@/types';
import { generateBatchNo, generatePickupPointNo } from '@/utils/idGenerator';

const storage = createStorage<GroupCollectStoreState>('groupCollect');

const STORAGE_KEY = 'state';

interface CreatePickupPointInput {
  name: string;
  type: PickupPointType;
  address: string;
  contactName: string;
  contactPhone: string;
  collectionWeekdays: CollectionWeekday[];
  collectionTime: string;
  remark?: string;
}

interface UpdatePickupPointInput {
  id: string;
  updates: Partial<Omit<PickupPoint, 'id' | 'pointNo' | 'createdAt'>>;
}

interface CreateBatchInput {
  pickupPointId: string;
  pickupPointName: string;
  scheduledDate: string;
  scheduledTime: string;
  orderIds: string[];
  remark?: string;
}

interface UpdateBatchStatusInput {
  batchId: string;
  status: BatchStatus;
}

interface GroupCollectStoreState {
  pickupPoints: PickupPoint[];
  batches: CollectionBatch[];
  getPickupPointById: (id: string) => PickupPoint | undefined;
  getPickupPointByPointNo: (pointNo: string) => PickupPoint | undefined;
  getActivePickupPoints: () => PickupPoint[];
  searchPickupPoints: (keyword: string) => PickupPoint[];
  addPickupPoint: (input: CreatePickupPointInput) => PickupPoint;
  updatePickupPoint: (input: UpdatePickupPointInput) => boolean;
  togglePickupPointActive: (id: string) => boolean;
  deletePickupPoint: (id: string) => boolean;
  getBatchById: (id: string) => CollectionBatch | undefined;
  getBatchByBatchNo: (batchNo: string) => CollectionBatch | undefined;
  getBatchesByPickupPoint: (pickupPointId: string) => CollectionBatch[];
  getBatchesByStatus: (status: BatchStatus) => CollectionBatch[];
  searchBatches: (keyword: string) => CollectionBatch[];
  addBatch: (input: CreateBatchInput) => CollectionBatch;
  updateBatchStatus: (input: UpdateBatchStatusInput) => boolean;
  addOrdersToBatch: (batchId: string, orderIds: string[]) => boolean;
  removeOrdersFromBatch: (batchId: string, orderIds: string[]) => boolean;
  deleteBatch: (id: string) => boolean;
}

const initialPickupPoints: PickupPoint[] = [
  {
    id: 'pp1',
    pointNo: 'PP001',
    name: '阳光花园小区门口',
    type: 'community_gate',
    address: '朝阳区阳光花园东门',
    contactName: '张门卫',
    contactPhone: '13800138001',
    collectionWeekdays: [1, 3, 5],
    collectionTime: '18:00',
    isActive: true,
    createdAt: '2024-01-15T08:00:00.000Z',
    remark: '周一、三、五下午6点集中收送',
  },
  {
    id: 'pp2',
    pointNo: 'PP002',
    name: '幸福里便利店代收点',
    type: 'convenience_store',
    address: '海淀区幸福里小区西门便利蜂',
    contactName: '李店长',
    contactPhone: '13900139002',
    collectionWeekdays: [2, 4, 6],
    collectionTime: '19:30',
    isActive: true,
    createdAt: '2024-01-20T09:30:00.000Z',
    remark: '周二、四、六晚7点半集中收送',
  },
];

const initialBatches: CollectionBatch[] = [];

function getInitialState(): Pick<GroupCollectStoreState, 'pickupPoints' | 'batches'> {
  const saved = storage.get(STORAGE_KEY);
  if (saved && saved.pickupPoints) {
    return { pickupPoints: saved.pickupPoints, batches: saved.batches || [] };
  }
  return { pickupPoints: initialPickupPoints, batches: initialBatches };
}

function persist(state: GroupCollectStoreState) {
  storage.set(STORAGE_KEY, state);
}

export const useGroupCollectStore = create<GroupCollectStoreState>((set, get) => {
  const initial = getInitialState();

  return {
    pickupPoints: initial.pickupPoints,
    batches: initial.batches,

    getPickupPointById: (id) => {
      return get().pickupPoints.find((p) => p.id === id);
    },

    getPickupPointByPointNo: (pointNo) => {
      return get().pickupPoints.find((p) => p.pointNo === pointNo);
    },

    getActivePickupPoints: () => {
      return get().pickupPoints.filter((p) => p.isActive);
    },

    searchPickupPoints: (keyword) => {
      const lowerKeyword = keyword.toLowerCase().trim();
      if (!lowerKeyword) return get().pickupPoints;
      return get().pickupPoints.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerKeyword) ||
          p.address.toLowerCase().includes(lowerKeyword) ||
          p.pointNo.toLowerCase().includes(lowerKeyword) ||
          p.contactName.toLowerCase().includes(lowerKeyword) ||
          p.contactPhone.includes(lowerKeyword)
      );
    },

    addPickupPoint: (input) => {
      const newPoint: PickupPoint = {
        id: `pp${Date.now()}`,
        pointNo: generatePickupPointNo(),
        name: input.name,
        type: input.type,
        address: input.address,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        collectionWeekdays: input.collectionWeekdays,
        collectionTime: input.collectionTime,
        isActive: true,
        createdAt: new Date().toISOString(),
        remark: input.remark,
      };

      set((state) => {
        const newPoints = [...state.pickupPoints, newPoint];
        const newState = { ...state, pickupPoints: newPoints };
        persist(newState);
        return newState;
      });

      return newPoint;
    },

    updatePickupPoint: ({ id, updates }) => {
      const point = get().getPickupPointById(id);
      if (!point) return false;

      set((state) => {
        const newPoints = state.pickupPoints.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        const newState = { ...state, pickupPoints: newPoints };
        persist(newState);
        return newState;
      });

      return true;
    },

    togglePickupPointActive: (id) => {
      const point = get().getPickupPointById(id);
      if (!point) return false;

      return get().updatePickupPoint({ id, updates: { isActive: !point.isActive } });
    },

    deletePickupPoint: (id) => {
      const point = get().getPickupPointById(id);
      if (!point) return false;

      const relatedBatches = get().getBatchesByPickupPoint(id);
      if (relatedBatches.length > 0) return false;

      set((state) => {
        const newPoints = state.pickupPoints.filter((p) => p.id !== id);
        const newState = { ...state, pickupPoints: newPoints };
        persist(newState);
        return newState;
      });

      return true;
    },

    getBatchById: (id) => {
      return get().batches.find((b) => b.id === id);
    },

    getBatchByBatchNo: (batchNo) => {
      return get().batches.find((b) => b.batchNo === batchNo);
    },

    getBatchesByPickupPoint: (pickupPointId) => {
      return get().batches.filter((b) => b.pickupPointId === pickupPointId);
    },

    getBatchesByStatus: (status) => {
      return get().batches.filter((b) => b.status === status);
    },

    searchBatches: (keyword) => {
      const lowerKeyword = keyword.toLowerCase().trim();
      if (!lowerKeyword) return get().batches;
      return get().batches.filter(
        (b) =>
          b.batchNo.toLowerCase().includes(lowerKeyword) ||
          b.pickupPointName.toLowerCase().includes(lowerKeyword)
      );
    },

    addBatch: (input) => {
      const now = new Date().toISOString();
      const newBatch: CollectionBatch = {
        id: `bt${Date.now()}`,
        batchNo: generateBatchNo(),
        pickupPointId: input.pickupPointId,
        pickupPointName: input.pickupPointName,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
        status: 'pending',
        orderIds: input.orderIds,
        totalOrders: input.orderIds.length,
        totalClothes: 0,
        totalAmount: 0,
        createdAt: now,
        updatedAt: now,
        remark: input.remark,
      };

      set((state) => {
        const newBatches = [...state.batches, newBatch];
        const newState = { ...state, batches: newBatches };
        persist(newState);
        return newState;
      });

      return newBatch;
    },

    updateBatchStatus: ({ batchId, status }) => {
      const batch = get().getBatchById(batchId);
      if (!batch) return false;

      const now = new Date().toISOString();
      const updates: Partial<CollectionBatch> = { status, updatedAt: now };
      if (status === 'collected') {
        updates.collectedAt = now;
      }
      if (status === 'returned') {
        updates.returnedAt = now;
      }

      set((state) => {
        const newBatches = state.batches.map((b) =>
          b.id === batchId ? { ...b, ...updates } : b
        );
        const newState = { ...state, batches: newBatches };
        persist(newState);
        return newState;
      });

      return true;
    },

    addOrdersToBatch: (batchId, orderIds) => {
      const batch = get().getBatchById(batchId);
      if (!batch) return false;
      if (batch.status !== 'pending' && batch.status !== 'collecting') return false;

      const now = new Date().toISOString();
      const existingIds = new Set(batch.orderIds);
      const newOrderIds = [...batch.orderIds, ...orderIds.filter((id) => !existingIds.has(id))];

      set((state) => {
        const newBatches = state.batches.map((b) =>
          b.id === batchId
            ? {
                ...b,
                orderIds: newOrderIds,
                totalOrders: newOrderIds.length,
                updatedAt: now,
              }
            : b
        );
        const newState = { ...state, batches: newBatches };
        persist(newState);
        return newState;
      });

      return true;
    },

    removeOrdersFromBatch: (batchId, orderIds) => {
      const batch = get().getBatchById(batchId);
      if (!batch) return false;
      if (batch.status !== 'pending' && batch.status !== 'collecting') return false;

      const now = new Date().toISOString();
      const removeSet = new Set(orderIds);
      const newOrderIds = batch.orderIds.filter((id) => !removeSet.has(id));

      set((state) => {
        const newBatches = state.batches.map((b) =>
          b.id === batchId
            ? {
                ...b,
                orderIds: newOrderIds,
                totalOrders: newOrderIds.length,
                updatedAt: now,
              }
            : b
        );
        const newState = { ...state, batches: newBatches };
        persist(newState);
        return newState;
      });

      return true;
    },

    deleteBatch: (id) => {
      const batch = get().getBatchById(id);
      if (!batch) return false;
      if (batch.status !== 'pending' && batch.status !== 'cancelled') return false;

      set((state) => {
        const newBatches = state.batches.filter((b) => b.id !== id);
        const newState = { ...state, batches: newBatches };
        persist(newState);
        return newState;
      });

      return true;
    },
  };
});
