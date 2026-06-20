import type { PricingRule, ExtraFee } from '../types';

export const initialPricingRules: PricingRule[] = [
  { category: 'laundry', name: '普通洗衣', basePrice: 25 },
  { category: 'dry_clean', name: '干洗', basePrice: 45 },
  { category: 'wash', name: '水洗', basePrice: 20 },
  { category: 'iron', name: '熨烫', basePrice: 15 },
  { category: 'leather', name: '皮具护理', basePrice: 120 },
  { category: 'shoes', name: '鞋子洗护', basePrice: 35 },
];

export const initialExtraFees: ExtraFee[] = [
  { id: 'stain', name: '深度去渍', price: 20, applicableCategories: ['laundry', 'dry_clean', 'wash'] },
  { id: 'bleach', name: '漂白处理', price: 15, applicableCategories: ['laundry', 'wash'] },
  { id: 'reshape', name: '整形修复', price: 30, applicableCategories: ['iron', 'leather'] },
  { id: 'urgent', name: '加急服务', price: 25, applicableCategories: ['laundry', 'dry_clean', 'wash', 'iron', 'leather', 'shoes'] },
  { id: 'oversize', name: '超大件', price: 30, applicableCategories: ['laundry', 'dry_clean', 'wash'] },
];

export const memberDiscounts = {
  normal: 1.0,
  silver: 0.95,
  gold: 0.9,
  platinum: 0.85,
} as const;
