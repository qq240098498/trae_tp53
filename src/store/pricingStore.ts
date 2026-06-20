import { create } from 'zustand';
import { createStorage } from '@/utils/storage';
import type { PricingRule, ExtraFee, MemberLevel, ClothingCategory } from '@/types';
import { initialPricingRules, initialExtraFees, memberDiscounts } from '@/mock/initialPricing';

const storage = createStorage<PricingStoreState>('pricing');

const STORAGE_KEY = 'state';

interface MemberDiscounts {
  normal: number;
  silver: number;
  gold: number;
  platinum: number;
}

interface PricingStoreState {
  pricingRules: PricingRule[];
  extraFees: ExtraFee[];
  memberDiscounts: MemberDiscounts;
  getPricingRule: (category: ClothingCategory) => PricingRule | undefined;
  addPricingRule: (rule: PricingRule) => void;
  updatePricingRule: (category: ClothingCategory, updates: Partial<PricingRule>) => void;
  removePricingRule: (category: ClothingCategory) => void;
  getExtraFee: (id: string) => ExtraFee | undefined;
  addExtraFee: (fee: ExtraFee) => void;
  updateExtraFee: (id: string, updates: Partial<ExtraFee>) => void;
  removeExtraFee: (id: string) => void;
  getMemberDiscount: (level: MemberLevel) => number;
  updateMemberDiscount: (level: MemberLevel, discount: number) => void;
  resetToDefault: () => void;
}

function getInitialState(): Pick<PricingStoreState, 'pricingRules' | 'extraFees' | 'memberDiscounts'> {
  const saved = storage.get(STORAGE_KEY);
  if (saved) {
    return {
      pricingRules: saved.pricingRules,
      extraFees: saved.extraFees,
      memberDiscounts: saved.memberDiscounts,
    };
  }
  return {
    pricingRules: initialPricingRules,
    extraFees: initialExtraFees,
    memberDiscounts: memberDiscounts as MemberDiscounts,
  };
}

function persist(state: PricingStoreState) {
  storage.set(STORAGE_KEY, state);
}

export const usePricingStore = create<PricingStoreState>((set, get) => {
  const initial = getInitialState();

  return {
    pricingRules: initial.pricingRules,
    extraFees: initial.extraFees,
    memberDiscounts: initial.memberDiscounts,

    getPricingRule: (category) => {
      return get().pricingRules.find((r) => r.category === category);
    },

    addPricingRule: (rule) => {
      set((state) => {
        const newRules = [...state.pricingRules, rule];
        const newState = { ...state, pricingRules: newRules };
        persist(newState);
        return newState;
      });
    },

    updatePricingRule: (category, updates) => {
      set((state) => {
        const newRules = state.pricingRules.map((r) =>
          r.category === category ? { ...r, ...updates } : r
        );
        const newState = { ...state, pricingRules: newRules };
        persist(newState);
        return newState;
      });
    },

    removePricingRule: (category) => {
      set((state) => {
        const newRules = state.pricingRules.filter((r) => r.category !== category);
        const newState = { ...state, pricingRules: newRules };
        persist(newState);
        return newState;
      });
    },

    getExtraFee: (id) => {
      return get().extraFees.find((f) => f.id === id);
    },

    addExtraFee: (fee) => {
      set((state) => {
        const newFees = [...state.extraFees, fee];
        const newState = { ...state, extraFees: newFees };
        persist(newState);
        return newState;
      });
    },

    updateExtraFee: (id, updates) => {
      set((state) => {
        const newFees = state.extraFees.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        );
        const newState = { ...state, extraFees: newFees };
        persist(newState);
        return newState;
      });
    },

    removeExtraFee: (id) => {
      set((state) => {
        const newFees = state.extraFees.filter((f) => f.id !== id);
        const newState = { ...state, extraFees: newFees };
        persist(newState);
        return newState;
      });
    },

    getMemberDiscount: (level) => {
      return get().memberDiscounts[level];
    },

    updateMemberDiscount: (level, discount) => {
      set((state) => {
        const newDiscounts = { ...state.memberDiscounts, [level]: discount };
        const newState = { ...state, memberDiscounts: newDiscounts };
        persist(newState);
        return newState;
      });
    },

    resetToDefault: () => {
      const defaultState = {
        pricingRules: initialPricingRules,
        extraFees: initialExtraFees,
        memberDiscounts: memberDiscounts as MemberDiscounts,
      };
      set(defaultState);
      persist({ ...get(), ...defaultState });
    },
  };
});
