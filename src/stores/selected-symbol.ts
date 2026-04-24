import { create } from 'zustand';

export interface SelectedSymbolState {
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string | null) => void;
}

export const useSelectedSymbolStore = create<SelectedSymbolState>((set) => ({
  selectedSymbol: null,
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
}));
