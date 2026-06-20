import { create } from 'zustand';
import { createStorage } from '@/utils/storage';

interface AppStorePersistState {
  sidebarExpanded: boolean;
  notifiedClothingCodes: string[];
}

const storage = createStorage<AppStorePersistState>('app');

const STORAGE_KEY = 'state';

interface AppStoreState {
  sidebarExpanded: boolean;
  notifiedClothingCodes: Set<string>;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  addNotifiedCode: (code: string) => void;
  removeNotifiedCode: (code: string) => void;
  hasNotifiedCode: (code: string) => boolean;
  clearNotifiedCodes: () => void;
}

function getInitialState(): Pick<AppStoreState, 'sidebarExpanded' | 'notifiedClothingCodes'> {
  const saved = storage.get(STORAGE_KEY);
  if (saved) {
    return {
      sidebarExpanded: saved.sidebarExpanded,
      notifiedClothingCodes: new Set(saved.notifiedClothingCodes),
    };
  }
  return {
    sidebarExpanded: true,
    notifiedClothingCodes: new Set(),
  };
}

function persist(state: Pick<AppStoreState, 'sidebarExpanded' | 'notifiedClothingCodes'>) {
  storage.set(STORAGE_KEY, {
    sidebarExpanded: state.sidebarExpanded,
    notifiedClothingCodes: Array.from(state.notifiedClothingCodes),
  });
}

export const useAppStore = create<AppStoreState>((set, get) => {
  const initial = getInitialState();

  return {
    sidebarExpanded: initial.sidebarExpanded,
    notifiedClothingCodes: initial.notifiedClothingCodes,

    toggleSidebar: () => {
      set((state) => {
        const newExpanded = !state.sidebarExpanded;
        persist({ ...state, sidebarExpanded: newExpanded });
        return { sidebarExpanded: newExpanded };
      });
    },

    setSidebarExpanded: (expanded) => {
      set({ sidebarExpanded: expanded });
      persist(get());
    },

    addNotifiedCode: (code) => {
      set((state) => {
        const newSet = new Set(state.notifiedClothingCodes);
        newSet.add(code);
        persist({ ...state, notifiedClothingCodes: newSet });
        return { notifiedClothingCodes: newSet };
      });
    },

    removeNotifiedCode: (code) => {
      set((state) => {
        const newSet = new Set(state.notifiedClothingCodes);
        newSet.delete(code);
        persist({ ...state, notifiedClothingCodes: newSet });
        return { notifiedClothingCodes: newSet };
      });
    },

    hasNotifiedCode: (code) => {
      return get().notifiedClothingCodes.has(code);
    },

    clearNotifiedCodes: () => {
      set((state) => {
        const newSet = new Set<string>();
        persist({ ...state, notifiedClothingCodes: newSet });
        return { notifiedClothingCodes: newSet };
      });
    },
  };
});
