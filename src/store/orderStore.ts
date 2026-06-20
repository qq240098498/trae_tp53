import { create } from 'zustand';
import { createStorage } from '@/utils/storage';
import type { Order, OrderStatus, ClothingItem } from '@/types';
import { initialOrders } from '@/mock/initialOrders';
import { generateOrderNo, generateClothingCode } from '@/utils/idGenerator';
import { checkOverdue, OVERDUE_THRESHOLD_DAYS, diffInDays } from '@/utils/dateUtils';

const storage = createStorage<OrderStoreState>('order');

const STORAGE_KEY = 'state';

interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  memberId?: string;
  clothes: Omit<ClothingItem, 'id' | 'code' | 'status' | 'receivedAt'>[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  remark?: string;
}

interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
}

interface PickUpOrderInput {
  orderId: string;
  clothingCodes?: string[];
}

interface AssignOrderToBatchInput {
  orderId: string;
  batchId: string;
  batchNo: string;
  pickupPointId: string;
  pickupPointName: string;
}

interface UnassignOrderFromBatchInput {
  orderId: string;
}

interface OrderStoreState {
  orders: Order[];
  getOrderById: (id: string) => Order | undefined;
  getOrderByOrderNo: (orderNo: string) => Order | undefined;
  searchOrders: (keyword: string) => Order[];
  searchByClothingCode: (code: string) => Order | undefined;
  searchByPhone: (phone: string) => Order[];
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersByPickupPoint: (pickupPointId: string) => Order[];
  getOrdersByBatch: (batchId: string) => Order[];
  getUnassignedOrders: () => Order[];
  addOrder: (input: CreateOrderInput) => Order;
  updateOrderStatus: (input: UpdateOrderStatusInput) => boolean;
  updateClothingItemStatus: (orderId: string, clothingId: string, status: OrderStatus) => boolean;
  updateClothingItemPhotos: (orderId: string, clothingId: string, photos: { flawPhotos?: string[]; pickupPhotos?: string[] }) => boolean;
  pickUpOrder: (input: PickUpOrderInput) => boolean;
  checkOverdueOrders: () => { updated: number; overdueOrders: Order[] };
  getOverdueOrders: () => Order[];
  getClothingItemByCode: (code: string) => { order: Order; item: ClothingItem } | undefined;
  assignOrderToBatch: (input: AssignOrderToBatchInput) => boolean;
  unassignOrderFromBatch: (input: UnassignOrderFromBatchInput) => boolean;
}

function getInitialState(): Pick<OrderStoreState, 'orders'> {
  const saved = storage.get(STORAGE_KEY);
  if (saved && saved.orders.length > 0) {
    return { orders: saved.orders };
  }
  return { orders: initialOrders };
}

function persist(state: OrderStoreState) {
  storage.set(STORAGE_KEY, state);
}

export const useOrderStore = create<OrderStoreState>((set, get) => {
  const initial = getInitialState();

  return {
    orders: initial.orders,

    getOrderById: (id) => {
      return get().orders.find((o) => o.id === id);
    },

    getOrderByOrderNo: (orderNo) => {
      return get().orders.find((o) => o.orderNo === orderNo);
    },

    searchOrders: (keyword) => {
      const lowerKeyword = keyword.toLowerCase().trim();
      if (!lowerKeyword) return get().orders;
      return get().orders.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(lowerKeyword) ||
          o.customerName.toLowerCase().includes(lowerKeyword) ||
          o.customerPhone.includes(lowerKeyword) ||
          o.clothes.some((c) => c.code.toLowerCase().includes(lowerKeyword))
      );
    },

    searchByClothingCode: (code) => {
      const upperCode = code.toUpperCase().trim();
      return get().orders.find((o) =>
        o.clothes.some((c) => c.code.toUpperCase() === upperCode)
      );
    },

    searchByPhone: (phone) => {
      const trimmedPhone = phone.trim();
      return get().orders.filter((o) => o.customerPhone.includes(trimmedPhone));
    },

    getOrdersByStatus: (status) => {
      return get().orders.filter((o) => o.status === status);
    },

    addOrder: (input) => {
      const now = new Date().toISOString();
      const clothes: ClothingItem[] = input.clothes.map((c, index) => ({
        ...c,
        id: `c${Date.now()}_${index}`,
        code: generateClothingCode(),
        status: 'received' as OrderStatus,
        receivedAt: now,
      }));

      const newOrder: Order = {
        id: `o${Date.now()}`,
        orderNo: generateOrderNo(),
        memberId: input.memberId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        clothes,
        subtotal: input.subtotal,
        discount: input.discount,
        totalAmount: input.totalAmount,
        paidAmount: input.paidAmount,
        paymentMethod: input.paymentMethod,
        status: 'received',
        createdAt: now,
        updatedAt: now,
        remark: input.remark,
      };

      set((state) => {
        const newOrders = [...state.orders, newOrder];
        const newState = { ...state, orders: newOrders };
        persist(newState);
        return newState;
      });

      return newOrder;
    },

    updateOrderStatus: (input) => {
      const order = get().getOrderById(input.orderId);
      if (!order) return false;

      const now = new Date().toISOString();

      set((state) => {
        const newOrders = state.orders.map((o) => {
          if (o.id !== input.orderId) return o;
          return {
            ...o,
            status: input.status,
            updatedAt: now,
            clothes: o.clothes.map((c) => {
              if (input.status === 'picked_up' && !c.pickedUpAt) {
                return { ...c, status: input.status, pickedUpAt: now };
              }
              return { ...c, status: input.status };
            }),
          };
        });
        const newState = { ...state, orders: newOrders };
        persist(newState);
        return newState;
      });

      return true;
    },

    updateClothingItemStatus: (orderId, clothingId, status) => {
      const order = get().getOrderById(orderId);
      if (!order) return false;

      const item = order.clothes.find((c) => c.id === clothingId);
      if (!item) return false;

      const now = new Date().toISOString();

      set((state) => {
        const newOrders = state.orders.map((o) => {
          if (o.id !== orderId) return o;

          const updatedClothes = o.clothes.map((c) => {
            if (c.id !== clothingId) return c;
            if (status === 'picked_up' && !c.pickedUpAt) {
              return { ...c, status, pickedUpAt: now };
            }
            return { ...c, status };
          });

          const allPickedUp = updatedClothes.every((c) => c.status === 'picked_up');
          const allOverdue = updatedClothes.every((c) => c.status === 'overdue');
          const allReady = updatedClothes.every((c) => c.status === 'ready');
          const allWashing = updatedClothes.every((c) => c.status === 'washing');

          let newOrderStatus: OrderStatus = o.status;
          if (allPickedUp) {
            newOrderStatus = 'picked_up';
          } else if (allOverdue) {
            newOrderStatus = 'overdue';
          } else if (allReady) {
            newOrderStatus = 'ready';
          } else if (allWashing) {
            newOrderStatus = 'washing';
          }

          return {
            ...o,
            clothes: updatedClothes,
            status: newOrderStatus,
            updatedAt: now,
          };
        });
        const newState = { ...state, orders: newOrders };
        persist(newState);
        return newState;
      });

      return true;
    },

    updateClothingItemPhotos: (orderId, clothingId, photos) => {
      const order = get().getOrderById(orderId);
      if (!order) return false;

      const item = order.clothes.find((c) => c.id === clothingId);
      if (!item) return false;

      const now = new Date().toISOString();

      set((state) => {
        const newOrders = state.orders.map((o) => {
          if (o.id !== orderId) return o;

          const updatedClothes = o.clothes.map((c) => {
            if (c.id !== clothingId) return c;
            return {
              ...c,
              flawPhotos: photos.flawPhotos !== undefined ? photos.flawPhotos : c.flawPhotos,
              pickupPhotos: photos.pickupPhotos !== undefined ? photos.pickupPhotos : c.pickupPhotos,
            };
          });

          return {
            ...o,
            clothes: updatedClothes,
            updatedAt: now,
          };
        });
        const newState = { ...state, orders: newOrders };
        persist(newState);
        return newState;
      });

      return true;
    },

    pickUpOrder: (input) => {
      const order = get().getOrderById(input.orderId);
      if (!order) return false;
      if (order.status === 'picked_up') return false;

      const now = new Date().toISOString();

      set((state) => {
        const newOrders = state.orders.map((o) => {
          if (o.id !== input.orderId) return o;

          let updatedClothes = o.clothes;
          if (input.clothingCodes && input.clothingCodes.length > 0) {
            const codesSet = new Set(input.clothingCodes.map((c) => c.toUpperCase()));
            updatedClothes = o.clothes.map((c) => {
              if (codesSet.has(c.code.toUpperCase()) && c.status !== 'picked_up') {
                return { ...c, status: 'picked_up' as OrderStatus, pickedUpAt: now };
              }
              return c;
            });
          } else {
            updatedClothes = o.clothes.map((c) => {
              if (c.status !== 'picked_up') {
                return { ...c, status: 'picked_up' as OrderStatus, pickedUpAt: now };
              }
              return c;
            });
          }

          const allPickedUp = updatedClothes.every((c) => c.status === 'picked_up');

          return {
            ...o,
            clothes: updatedClothes,
            status: allPickedUp ? 'picked_up' : o.status,
            updatedAt: now,
          };
        });
        const newState = { ...state, orders: newOrders };
        persist(newState);
        return newState;
      });

      return true;
    },

    checkOverdueOrders: () => {
      const now = new Date().toISOString();
      const overdueOrders: Order[] = [];

      set((state) => {
        let updated = 0;
        const newOrders = state.orders.map((o) => {
          if (o.status === 'picked_up') return o;

          let hasOverdueItem = false;
          const updatedClothes = o.clothes.map((c) => {
            if (c.status === 'picked_up') return c;
            const overdueCheck = checkOverdue(c.receivedAt, OVERDUE_THRESHOLD_DAYS);
            if (overdueCheck.isOverdue && c.status !== 'overdue') {
              hasOverdueItem = true;
              return { ...c, status: 'overdue' as OrderStatus };
            }
            if (c.status === 'overdue') {
              hasOverdueItem = true;
            }
            return c;
          });

          if (hasOverdueItem && o.status !== 'overdue') {
            updated++;
            const newOrder = {
              ...o,
              clothes: updatedClothes,
              status: 'overdue' as OrderStatus,
              updatedAt: now,
            };
            overdueOrders.push(newOrder);
            return newOrder;
          }

          if (hasOverdueItem) {
            overdueOrders.push(o);
          }

          return { ...o, clothes: updatedClothes };
        });

        const newState = { ...state, orders: newOrders };
        if (updated > 0) {
          persist(newState);
        }
        return newState;
      });

      return { updated: overdueOrders.length, overdueOrders };
    },

    getOverdueOrders: () => {
      return get().orders.filter((o) => {
        if (o.status === 'picked_up') return false;
        return o.clothes.some((c) => {
          if (c.status === 'picked_up') return false;
          return diffInDays(c.receivedAt, new Date()) > OVERDUE_THRESHOLD_DAYS;
        });
      });
    },

    getClothingItemByCode: (code) => {
      const upperCode = code.toUpperCase().trim();
      for (const order of get().orders) {
        const item = order.clothes.find((c) => c.code.toUpperCase() === upperCode);
        if (item) {
          return { order, item };
        }
      }
      return undefined;
    },

    getOrdersByPickupPoint: (pickupPointId) => {
      return get().orders.filter((o) => o.pickupPointId === pickupPointId);
    },

    getOrdersByBatch: (batchId) => {
      return get().orders.filter((o) => o.batchId === batchId);
    },

    getUnassignedOrders: () => {
      return get().orders.filter((o) => !o.batchId);
    },

    assignOrderToBatch: (input) => {
      const order = get().getOrderById(input.orderId);
      if (!order) return false;

      const now = new Date().toISOString();

      set((state) => {
        const newOrders = state.orders.map((o) =>
          o.id === input.orderId
            ? {
                ...o,
                batchId: input.batchId,
                batchNo: input.batchNo,
                pickupPointId: input.pickupPointId,
                pickupPointName: input.pickupPointName,
                updatedAt: now,
              }
            : o
        );
        const newState = { ...state, orders: newOrders };
        persist(newState);
        return newState;
      });

      return true;
    },

    unassignOrderFromBatch: (input) => {
      const order = get().getOrderById(input.orderId);
      if (!order) return false;

      const now = new Date().toISOString();

      set((state) => {
        const newOrders = state.orders.map((o) =>
          o.id === input.orderId
            ? {
                ...o,
                batchId: undefined,
                batchNo: undefined,
                pickupPointId: undefined,
                pickupPointName: undefined,
                updatedAt: now,
              }
            : o
        );
        const newState = { ...state, orders: newOrders };
        persist(newState);
        return newState;
      });

      return true;
    },
  };
});
