import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Header } from './components/ui/Header'
import { TickerList } from './components/market/TickerList'
import { PriceChart } from './components/PriceChart'
import { AlertPanel } from './components/alerts/AlertPanel'
import { Toast } from './components/ui/Toast'
import { getTickerSnapshots } from './lib/binance/api'
import { TOP_SYMBOLS } from './constants/symbols'
import { useTickersStore } from './stores/tickers'
import { useSelectedSymbolStore } from './stores/selected-symbol'

export function App() {
  const setTickers = useTickersStore((state) => state.setTickers)
  const { selectedSymbol, setSelectedSymbol } = useSelectedSymbolStore()

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

  const ChartView = selectedSymbol ? (
    <PriceChart />
  ) : (
    <div className="h-full flex flex-col items-center justify-center text-slate-500">
      <p className="text-sm">Select a ticker to view the chart</p>
    </div>
  )

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 relative overflow-hidden">
        {/* Desktop: resizable sidebar + chart panel */}
        <div className="hidden sm:flex h-full overflow-hidden">
          <PanelGroup
            direction="horizontal"
            className="flex-1"
            autoSaveId="dashboard-layout"
          >
            {/* Sidebar / Markets Panel */}
            <Panel
              defaultSize={22}
              minSize={14}
              maxSize={40}
              className="flex flex-col bg-slate-900 overflow-hidden"
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

            {/* Drag handle */}
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

            <Panel className="flex flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
              <div className="h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                {ChartView}
              </div>
            </Panel>
          </PanelGroup>
        </div>

        {/* Mobile: Ticker list with sliding chart overlay */}
        <div className="sm:hidden h-full flex flex-col bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Markets
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TickerList />
          </div>

          {/* Sliding Chart Overlay */}
          <div
            className={[
              'absolute inset-0 bg-slate-950 z-10 flex flex-col',
              'transition-transform duration-300 ease-in-out',
              selectedSymbol ? 'translate-x-0' : 'translate-x-full',
            ].join(' ')}
          >
            {/* Back bar */}
            <div className="flex items-center h-12 px-4 border-b border-slate-800 bg-slate-900 shrink-0">
              <button
                onClick={() => setSelectedSymbol(null)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white active:text-slate-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Markets
              </button>
            </div>

            {/* Chart fills remaining height */}
            <div className="flex-1 overflow-hidden">
              {ChartView}
            </div>
          </div>
        </div>
      </div>

      <Toast />
    </div>
  )
}
