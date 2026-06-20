export type ClothingCategory = 'laundry' | 'dry_clean' | 'wash' | 'iron' | 'leather' | 'shoes';

export type WashMethod = 'standard' | 'gentle' | 'deep_clean' | 'hand_wash';

export type OrderStatus = 'received' | 'washing' | 'ready' | 'picked_up' | 'overdue';

export type MemberLevel = 'normal' | 'silver' | 'gold' | 'platinum';

export interface SpecialTreatment {
  id: string;
  name: string;
  price: number;
}

export interface ClothingItem {
  id: string;
  code: string;
  category: ClothingCategory;
  color: string;
  brand: string;
  description: string;
  flawPhotos: string[];
  pickupPhotos: string[];
  washMethod: WashMethod;
  specialTreatments: SpecialTreatment[];
  basePrice: number;
  extraPrice: number;
  totalPrice: number;
  status: OrderStatus;
  receivedAt: string;
  pickedUpAt?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  memberId?: string;
  customerName: string;
  customerPhone: string;
  clothes: ClothingItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  remark?: string;
  pickupPointId?: string;
  pickupPointName?: string;
  batchId?: string;
  batchNo?: string;
}

export interface RechargeRecord {
  id: string;
  memberId: string;
  amount: number;
  bonusAmount: number;
  paymentMethod: string;
  createdAt: string;
  operator: string;
}

export interface Member {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
  level: MemberLevel;
  balance: number;
  points: number;
  totalSpent: number;
  orderCount: number;
  createdAt: string;
  rechargeRecords: RechargeRecord[];
}

export interface PricingRule {
  category: ClothingCategory;
  basePrice: number;
  name: string;
}

export interface ExtraFee {
  id: string;
  name: string;
  price: number;
  applicableCategories: ClothingCategory[];
}

export type PickupPointType = 'community_gate' | 'convenience_store' | 'other';

export type CollectionWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PickupPoint {
  id: string;
  pointNo: string;
  name: string;
  type: PickupPointType;
  address: string;
  contactName: string;
  contactPhone: string;
  collectionWeekdays: CollectionWeekday[];
  collectionTime: string;
  isActive: boolean;
  createdAt: string;
  remark?: string;
}

export type BatchStatus = 'pending' | 'collecting' | 'collected' | 'washing' | 'returning' | 'returned' | 'cancelled';

export interface CollectionBatch {
  id: string;
  batchNo: string;
  pickupPointId: string;
  pickupPointName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: BatchStatus;
  orderIds: string[];
  totalOrders: number;
  totalClothes: number;
  totalAmount: number;
  collectedAt?: string;
  returnedAt?: string;
  createdAt: string;
  updatedAt: string;
  remark?: string;
}
