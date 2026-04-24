import { useEffect, useRef, useState } from 'react'
import { useAlertsStore } from '../../stores/alerts'
import type { TriggeredAlert } from '../../types/alerts'

export function Toast() {
  const triggered = useAlertsStore((state) => state.triggered)
  const [visible, setVisible] = useState<TriggeredAlert | null>(null)
  const seenRef = useRef<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const newest = triggered[0]
    if (!newest || seenRef.current.has(newest.id + newest.triggeredAt)) return
    seenRef.current.add(newest.id + newest.triggeredAt)
    setVisible(newest)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(null), 4000)
  }, [triggered])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 shadow-xl text-sm text-slate-100 flex items-center gap-3 animate-in slide-in-from-bottom-2">
      <span className="text-yellow-400 text-base">⚡</span>
      <div>
        <span className="font-semibold">{visible.symbol}</span> crossed{' '}
        <span className={visible.direction === 'above' ? 'text-green-400' : 'text-red-400'}>
          {visible.direction === 'above' ? '▲' : '▼'} {visible.price.toLocaleString()}
        </span>
      </div>
      <button
        onClick={() => setVisible(null)}
        className="ml-2 text-slate-500 hover:text-slate-300 leading-none"
      >
        ×
      </button>
    </div>
  )
}
