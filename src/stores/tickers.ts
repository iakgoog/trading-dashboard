import { create } from 'zustand';
import type { TickerSnapshot } from '../types/binance';

interface TickersState {
  tickers: Record<string, TickerSnapshot>;
  updateTicker: (symbol: string, data: TickerSnapshot) => void;
  setTickers: (tickerData: Array<{ symbol: string; price: number; change24h: number }>) => void;
}

export const useTickersStore = create<TickersState>((set) => ({
  tickers: {},
  updateTicker: (symbol, data) =>
    set((state) => ({
      tickers: { ...state.tickers, [symbol]: data },
    })),
  setTickers: (tickerData) =>
    set((state) => {
      const newTickers: Record<string, TickerSnapshot> = { ...state.tickers };
      tickerData.forEach((t) => {
        newTickers[t.symbol] = {
          symbol: t.symbol,
          lastPrice: t.price.toString(),
          priceChangePercent: t.change24h.toString(),
          volume: '0',
          openTime: Date.now(),
        };
      });
      return { tickers: newTickers };
    }),
}));
