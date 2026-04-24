import { useState } from 'react'
import { useAlertsStore } from '../../stores/alerts'
import { TOP_SYMBOLS } from '../../constants/symbols'
import type { AlertDirection } from '../../types/alerts'

export function AlertPanel() {
  const { alerts, triggered, addAlert, removeAlert } = useAlertsStore()
  const [open, setOpen] = useState(false)
  const [symbol, setSymbol] = useState<string>(TOP_SYMBOLS[0])
  const [price, setPrice] = useState('')
  const [direction, setDirection] = useState<AlertDirection>('above')

  function handleAdd() {
    const p = parseFloat(price)
    if (!symbol || isNaN(p) || p <= 0) return
    addAlert(symbol, p, direction)
    setPrice('')
  }

  const activeCount = alerts.filter((a) => a.triggeredAt === undefined).length

  return (
    <div className="border-t border-slate-800 flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
      >
        <span>Alerts{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        <span className="text-slate-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          {/* Add form */}
          <div className="space-y-1.5">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-slate-500"
            >
              {TOP_SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="flex gap-1">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500"
              />
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as AlertDirection)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-slate-500"
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded px-2 py-1 text-xs font-medium text-white transition-colors"
            >
              Add Alert
            </button>
          </div>

          {/* Active alerts */}
          {alerts.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-600 uppercase tracking-wider">Active</p>
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center justify-between text-xs rounded px-2 py-1 ${
                    a.triggeredAt !== undefined
                      ? 'bg-slate-800/30 text-slate-600 line-through'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <span>
                    {a.symbol}{' '}
                    <span className={a.direction === 'above' ? 'text-green-400' : 'text-red-400'}>
                      {a.direction === 'above' ? '▲' : '▼'}
                    </span>{' '}
                    {a.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeAlert(a.id)}
                    className="text-slate-600 hover:text-red-400 ml-2 leading-none transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Triggered history */}
          {triggered.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-600 uppercase tracking-wider">History</p>
              {triggered.slice(0, 5).map((t) => (
                <div
                  key={`${t.id}-${t.triggeredAt}`}
                  className="flex items-center justify-between text-xs text-slate-500 px-1"
                >
                  <span>
                    {t.symbol}{' '}
                    <span className={t.direction === 'above' ? 'text-green-600' : 'text-red-600'}>
                      {t.direction === 'above' ? '▲' : '▼'}
                    </span>{' '}
                    {t.price.toLocaleString()}
                  </span>
                  <span className="tabular-nums">
                    {new Date(t.triggeredAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
