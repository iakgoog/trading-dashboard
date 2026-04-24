import { StatusBadge } from './StatusBadge'
import { binanceWSManager } from '../../lib/binance/ws-manager'

interface HeaderProps {
  onTickersOpen?: () => void
}

export function Header({ onTickersOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <span className="text-slate-900 font-semibold text-base tracking-tight">
            Multibank Markets
          </span>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Mobile: Tickers button (hidden on desktop) */}
            <button
              onClick={onTickersOpen}
              className="sm:hidden text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Open tickers list"
            >
              Tickers
            </button>

            <StatusBadge />

            {/* Dev-only disconnect button — tree-shaken in production (D-13) */}
            {import.meta.env.DEV && (
              <button
                onClick={() => {
                  binanceWSManager.stop()
                  setTimeout(() => binanceWSManager.start(), 100)
                }}
                className="text-xs font-mono text-slate-400 hover:text-rose-500 px-2 py-1 rounded border border-slate-200 hover:border-rose-200 transition-colors"
                title="Force disconnect (dev only)"
              >
                DEV: Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
