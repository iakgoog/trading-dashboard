import { create } from 'zustand';
import type { TickerSnapshot } from '../types/binance';

interface TickersState {
  tickers: Record<string, TickerSnapshot>;
  updateTicker: (symbol: string, data: TickerSnapshot) => void;
}

export const useTickersStore = create<TickersState>((set) => ({
  tickers: {},
  updateTicker: (symbol, data) =>
    set((state) => ({
      tickers: { ...state.tickers, [symbol]: data },
    })),
}));
