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
              className="sm:hidden inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
              aria-label="Open tickers list"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3h18M3 9h18M3 15h12M3 21h8" />
              </svg>
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
