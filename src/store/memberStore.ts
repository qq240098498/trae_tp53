import { create } from 'zustand';
import { createStorage } from '@/utils/storage';
import type { Member, RechargeRecord, MemberLevel } from '@/types';
import { initialMembers } from '@/mock/initialMembers';
import { generateMemberNo } from '@/utils/idGenerator';

const storage = createStorage<MemberStoreState>('member');

const STORAGE_KEY = 'state';

interface CreateMemberInput {
  name: string;
  phone: string;
  level?: MemberLevel;
  initialBalance?: number;
}

interface RechargeInput {
  memberId: string;
  amount: number;
  bonusAmount?: number;
  paymentMethod: string;
  operator: string;
}

interface DeductInput {
  memberId: string;
  amount: number;
}

interface MemberStoreState {
  members: Member[];
  getMemberById: (id: string) => Member | undefined;
  getMemberByPhone: (phone: string) => Member | undefined;
  getMemberByMemberNo: (memberNo: string) => Member | undefined;
  searchMembers: (keyword: string) => Member[];
  addMember: (input: CreateMemberInput) => Member;
  updateMember: (id: string, updates: Partial<Omit<Member, 'id' | 'memberNo' | 'createdAt' | 'rechargeRecords'>>) => void;
  recharge: (input: RechargeInput) => RechargeRecord | null;
  deduct: (input: DeductInput) => boolean;
  addPoints: (memberId: string, points: number) => void;
  updateLevel: (memberId: string, level: MemberLevel) => void;
}

function getInitialState(): Pick<MemberStoreState, 'members'> {
  const saved = storage.get(STORAGE_KEY);
  if (saved && saved.members.length > 0) {
    return { members: saved.members };
  }
  return { members: initialMembers };
}

function persist(state: MemberStoreState) {
  storage.set(STORAGE_KEY, state);
}

export const useMemberStore = create<MemberStoreState>((set, get) => {
  const initial = getInitialState();

  return {
    members: initial.members,

    getMemberById: (id) => {
      return get().members.find((m) => m.id === id);
    },

    getMemberByPhone: (phone) => {
      return get().members.find((m) => m.phone === phone);
    },

    getMemberByMemberNo: (memberNo) => {
      return get().members.find((m) => m.memberNo === memberNo);
    },

    searchMembers: (keyword) => {
      const lowerKeyword = keyword.toLowerCase().trim();
      if (!lowerKeyword) return get().members;
      return get().members.filter(
        (m) =>
          m.name.toLowerCase().includes(lowerKeyword) ||
          m.phone.includes(lowerKeyword) ||
          m.memberNo.toLowerCase().includes(lowerKeyword)
      );
    },

    addMember: (input) => {
      const newMember: Member = {
        id: `m${Date.now()}`,
        memberNo: generateMemberNo(),
        name: input.name,
        phone: input.phone,
        level: input.level ?? 'normal',
        balance: input.initialBalance ?? 0,
        points: 0,
        totalSpent: 0,
        orderCount: 0,
        createdAt: new Date().toISOString(),
        rechargeRecords: [],
      };

      set((state) => {
        const newMembers = [...state.members, newMember];
        const newState = { ...state, members: newMembers };
        persist(newState);
        return newState;
      });

      return newMember;
    },

    updateMember: (id, updates) => {
      set((state) => {
        const newMembers = state.members.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        );
        const newState = { ...state, members: newMembers };
        persist(newState);
        return newState;
      });
    },

    recharge: (input) => {
      const member = get().getMemberById(input.memberId);
      if (!member) return null;

      const record: RechargeRecord = {
        id: `r${Date.now()}`,
        memberId: input.memberId,
        amount: input.amount,
        bonusAmount: input.bonusAmount ?? 0,
        paymentMethod: input.paymentMethod,
        createdAt: new Date().toISOString(),
        operator: input.operator,
      };

      set((state) => {
        const newMembers = state.members.map((m) => {
          if (m.id !== input.memberId) return m;
          return {
            ...m,
            balance: m.balance + input.amount + (input.bonusAmount ?? 0),
            rechargeRecords: [...m.rechargeRecords, record],
          };
        });
        const newState = { ...state, members: newMembers };
        persist(newState);
        return newState;
      });

      return record;
    },

    deduct: (input) => {
      const member = get().getMemberById(input.memberId);
      if (!member || member.balance < input.amount) return false;

      set((state) => {
        const newMembers = state.members.map((m) => {
          if (m.id !== input.memberId) return m;
          return {
            ...m,
            balance: m.balance - input.amount,
            totalSpent: m.totalSpent + input.amount,
            orderCount: m.orderCount + 1,
          };
        });
        const newState = { ...state, members: newMembers };
        persist(newState);
        return newState;
      });

      return true;
    },

    addPoints: (memberId, points) => {
      set((state) => {
        const newMembers = state.members.map((m) => {
          if (m.id !== memberId) return m;
          return {
            ...m,
            points: m.points + points,
          };
        });
        const newState = { ...state, members: newMembers };
        persist(newState);
        return newState;
      });
    },

    updateLevel: (memberId, level) => {
      set((state) => {
        const newMembers = state.members.map((m) => {
          if (m.id !== memberId) return m;
          return { ...m, level };
        });
        const newState = { ...state, members: newMembers };
        persist(newState);
        return newState;
      });
    },
  };
});
