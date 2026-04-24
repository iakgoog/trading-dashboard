import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from './components/ui/Header';
import { Drawer } from './components/ui/Drawer';
import { TickerList } from './components/market/TickerList';
import { PriceChart } from './components/PriceChart';
import { getTickerSnapshots } from './lib/binance/api';
import { TOP_SYMBOLS } from './constants/symbols';
import { useTickersStore } from './stores/tickers';
import { useSelectedSymbolStore } from './stores/selected-symbol';

export function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const setTickers = useTickersStore((state) => state.setTickers);
  const { selectedSymbol } = useSelectedSymbolStore();

  const { data: snapshots } = useQuery({
    queryKey: ['ticker-snapshots'],
    queryFn: () => getTickerSnapshots(Array.from(TOP_SYMBOLS)),
    staleTime: 60000,
    retry: 1,
  });

  useEffect(() => {
    if (snapshots) {
      const tickers = snapshots.map((s) => ({
        symbol: s.symbol,
        price: parseFloat(s.lastPrice),
        change24h: parseFloat(s.priceChangePercent),
      }));
      setTickers(tickers);
    }
  }, [snapshots, setTickers]);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <Header onTickersOpen={() => setIsDrawerOpen(true)} />

      {/* Desktop: sidebar + main area layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: ticker list (desktop only) */}
        <aside className="hidden sm:flex flex-col w-80 lg:w-96 bg-slate-900 border-r border-slate-800 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Markets</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TickerList />
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
          {selectedSymbol ? (
            <div className="h-full bg-slate-900 rounded-xl border border-slate-800">
              <PriceChart />
            </div>
          ) : (
            <div className="h-full bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-slate-500">
              <p className="text-sm">Select a ticker to view the chart</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile: drawer with ticker list */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <div className="py-2">
          <div className="px-4 pb-2 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Markets</h2>
          </div>
          <TickerList />
        </div>
      </Drawer>
    </div>
  );
}
