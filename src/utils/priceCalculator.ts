export type ClothingCategory =
  | 'laundry'
  | 'dry_clean'
  | 'water_wash'
  | 'ironing'
  | 'leather_care'
  | 'shoe_care';

export type SpecialTreatment =
  | 'stain_removal'
  | 'bleaching'
  | 'reshaping'
  | 'oil_removal'
  | 'color_fixing'
  | 'sterilization';

export type MemberLevel = 'normal' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface CategoryPrice {
  category: ClothingCategory;
  name: string;
  basePrice: number;
}

export interface SpecialTreatmentPrice {
  treatment: SpecialTreatment;
  name: string;
  price: number;
}

export interface MemberDiscount {
  level: MemberLevel;
  name: string;
  discount: number;
}

export interface PriceCalculationItem {
  category: ClothingCategory;
  specialTreatments?: SpecialTreatment[];
  quantity?: number;
}

export interface PriceCalculationOptions {
  items: PriceCalculationItem[];
  memberLevel?: MemberLevel;
}

export interface PriceBreakdown {
  itemTotal: number;
  specialTreatmentTotal: number;
  subtotal: number;
  discount: number;
  discountAmount: number;
  finalTotal: number;
  itemDetails: Array<{
    category: ClothingCategory;
    categoryName: string;
    basePrice: number;
    quantity: number;
    specialTreatments: SpecialTreatment[];
    specialTreatmentTotal: number;
    itemSubtotal: number;
  }>;
}

export const CATEGORY_PRICES: CategoryPrice[] = [
  { category: 'laundry', name: '普通洗衣', basePrice: 15 },
  { category: 'dry_clean', name: '干洗', basePrice: 35 },
  { category: 'water_wash', name: '水洗', basePrice: 20 },
  { category: 'ironing', name: '熨烫', basePrice: 10 },
  { category: 'leather_care', name: '皮具护理', basePrice: 80 },
  { category: 'shoe_care', name: '鞋子洗护', basePrice: 45 },
];

export const SPECIAL_TREATMENT_PRICES: SpecialTreatmentPrice[] = [
  { treatment: 'stain_removal', name: '去渍', price: 15 },
  { treatment: 'bleaching', name: '漂白', price: 20 },
  { treatment: 'reshaping', name: '整形', price: 25 },
  { treatment: 'oil_removal', name: '去油', price: 18 },
  { treatment: 'color_fixing', name: '固色', price: 12 },
  { treatment: 'sterilization', name: '杀菌消毒', price: 10 },
];

export const MEMBER_DISCOUNTS: MemberDiscount[] = [
  { level: 'normal', name: '普通会员', discount: 1.0 },
  { level: 'silver', name: '银卡会员', discount: 0.95 },
  { level: 'gold', name: '金卡会员', discount: 0.9 },
  { level: 'platinum', name: '铂金会员', discount: 0.85 },
  { level: 'diamond', name: '钻石会员', discount: 0.8 },
];

export function getCategoryPrice(category: ClothingCategory): number {
  const found = CATEGORY_PRICES.find((c) => c.category === category);
  return found?.basePrice ?? 0;
}

export function getCategoryName(category: ClothingCategory): string {
  const found = CATEGORY_PRICES.find((c) => c.category === category);
  return found?.name ?? category;
}

export function getSpecialTreatmentPrice(treatment: SpecialTreatment): number {
  const found = SPECIAL_TREATMENT_PRICES.find((t) => t.treatment === treatment);
  return found?.price ?? 0;
}

export function getSpecialTreatmentName(treatment: SpecialTreatment): string {
  const found = SPECIAL_TREATMENT_PRICES.find((t) => t.treatment === treatment);
  return found?.name ?? treatment;
}

export function getMemberDiscount(level?: MemberLevel): number {
  if (!level) return 1.0;
  const found = MEMBER_DISCOUNTS.find((m) => m.level === level);
  return found?.discount ?? 1.0;
}

export function getMemberLevelName(level: MemberLevel): string {
  const found = MEMBER_DISCOUNTS.find((m) => m.level === level);
  return found?.name ?? level;
}

export function calculateItemPrice(item: PriceCalculationItem): {
  baseTotal: number;
  specialTotal: number;
  subtotal: number;
} {
  const quantity = item.quantity ?? 1;
  const basePrice = getCategoryPrice(item.category);
  const baseTotal = basePrice * quantity;

  const specialTotal = (item.specialTreatments ?? []).reduce((sum, treatment) => {
    return sum + getSpecialTreatmentPrice(treatment) * quantity;
  }, 0);

  return {
    baseTotal,
    specialTotal,
    subtotal: baseTotal + specialTotal,
  };
}

export function calculatePrice(options: PriceCalculationOptions): PriceBreakdown {
  const { items, memberLevel } = options;
  const discount = getMemberDiscount(memberLevel);

  const itemDetails = items.map((item) => {
    const { baseTotal, specialTotal, subtotal } = calculateItemPrice(item);
    return {
      category: item.category,
      categoryName: getCategoryName(item.category),
      basePrice: getCategoryPrice(item.category),
      quantity: item.quantity ?? 1,
      specialTreatments: item.specialTreatments ?? [],
      specialTreatmentTotal: specialTotal,
      itemSubtotal: subtotal,
      _baseTotal: baseTotal,
    };
  });

  const itemTotal = itemDetails.reduce((sum, d) => sum + d._baseTotal, 0);
  const specialTreatmentTotal = itemDetails.reduce((sum, d) => sum + d.specialTreatmentTotal, 0);
  const subtotal = itemTotal + specialTreatmentTotal;
  const discountAmount = subtotal * (1 - discount);
  const finalTotal = subtotal - discountAmount;

  const cleanDetails = itemDetails.map(({ _baseTotal, ...rest }) => rest);

  return {
    itemTotal,
    specialTreatmentTotal,
    subtotal,
    discount,
    discountAmount,
    finalTotal,
    itemDetails: cleanDetails,
  };
}

export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}
