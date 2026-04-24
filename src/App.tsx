import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Header } from './components/ui/Header'
import { Drawer } from './components/ui/Drawer'
import { TickerList } from './components/market/TickerList'
import { PriceChart } from './components/PriceChart'
import { AlertPanel } from './components/alerts/AlertPanel'
import { Toast } from './components/ui/Toast'
import { getTickerSnapshots } from './lib/binance/api'
import { TOP_SYMBOLS } from './constants/symbols'
import { useTickersStore } from './stores/tickers'
import { useSelectedSymbolStore } from './stores/selected-symbol'

export function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const setTickers = useTickersStore((state) => state.setTickers)
  const { selectedSymbol } = useSelectedSymbolStore()

  const { data: snapshots } = useQuery({
    queryKey: ['ticker-snapshots'],
    queryFn: () => getTickerSnapshots(Array.from(TOP_SYMBOLS)),
    staleTime: 60000,
    retry: 1,
  })

  useEffect(() => {
    if (snapshots) {
      const tickers = snapshots.map((s) => ({
        symbol: s.symbol,
        price: parseFloat(s.lastPrice),
        change24h: parseFloat(s.priceChangePercent),
      }))
      setTickers(tickers)
    }
  }, [snapshots, setTickers])


  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <Header onTickersOpen={() => setIsDrawerOpen(true)} />

      {/* Desktop: sidebar + main area layout */}
      <PanelGroup
        direction="horizontal"
        className="flex flex-1 overflow-hidden"
        autoSaveId="dashboard-layout"
      >
        {/* Left panel */}
        <Panel
          defaultSize={22}
          minSize={14}
          maxSize={40}
          className="hidden sm:flex flex-col bg-slate-900 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Markets
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <TickerList />
          </div>
          <AlertPanel />
        </Panel>

        {/* Drag handle with bump */}
        <PanelResizeHandle className="group relative flex items-center justify-center w-[5px] bg-slate-800 hover:bg-blue-500/30 data-[resize-handle-active]:bg-blue-500/40 cursor-col-resize transition-colors duration-150">
          <div
            className="
            absolute z-10 w-4 h-8 rounded-full
            flex items-center justify-center gap-[3px] flex-col
            bg-slate-700 border border-slate-600
            group-hover:bg-blue-500 group-hover:border-blue-400
            group-data-[resize-handle-active]:bg-blue-500
            group-data-[resize-handle-active]:border-blue-400
            transition-colors duration-150
          "
          >
            <span className="w-[2px] h-[2px] rounded-full bg-slate-400" />
            <span className="w-[2px] h-[2px] rounded-full bg-slate-400" />
            <span className="w-[2px] h-[2px] rounded-full bg-slate-400" />
          </div>
        </PanelResizeHandle>

        {/* Right panel */}
        <Panel className="flex flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
          {selectedSymbol ? (
            <div className="h-full bg-slate-900 rounded-xl border border-slate-800">
              <PriceChart />
            </div>
          ) : (
            <div className="h-full bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-slate-500">
              <p className="text-sm">Select a ticker to view the chart</p>
            </div>
          )}
        </Panel>
      </PanelGroup>

      <Toast />

      {/* Mobile: drawer with ticker list */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <div className="py-2">
          <div className="px-4 pb-2 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Markets
            </h2>
          </div>
          <TickerList onSelect={() => setIsDrawerOpen(false)} />
        </div>
      </Drawer>
    </div>
  )
}
