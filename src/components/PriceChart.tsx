import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useKlineData } from '../hooks/useKlineData'
import { useTickersStore } from '../stores/tickers'
import { useSelectedSymbolStore } from '../stores/selected-symbol'
import { formatAdaptivePrice, formatVolume } from '../lib/format'

interface TooltipPayload {
  payload: {
    time: number
    value: number
    open: number
    high: number
    low: number
    volume: number
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: number
}

function getTimeTicks(data: { time: number }[]): number[] {
  if (!data.length) return []
  const start = data[0].time
  const end = data[data.length - 1].time
  const rangeMs = end - start

  let intervalMs: number
  if (rangeMs <= 2 * 3_600_000)       intervalMs = 15 * 60_000
  else if (rangeMs <= 6 * 3_600_000)  intervalMs = 30 * 60_000
  else if (rangeMs <= 24 * 3_600_000) intervalMs = 3_600_000
  else                                intervalMs = 4 * 3_600_000

  const firstTick = Math.ceil(start / intervalMs) * intervalMs
  const ticks: number[] = []
  for (let t = firstTick; t <= end; t += intervalMs) ticks.push(t)
  return ticks
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length || payload[0] === undefined) return null
  const d = payload[0].payload
  
  const dt = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(d.time))

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl p-3 text-xs min-w-[140px] backdrop-blur-sm">
      <div className="text-slate-400 mb-2 border-b border-slate-800 pb-1 flex justify-between">
        <span>{dt}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Open</span>
          <span className="text-slate-200 font-mono">{formatAdaptivePrice(d.open)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">High</span>
          <span className="text-slate-200 font-mono">{formatAdaptivePrice(d.high)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Low</span>
          <span className="text-slate-200 font-mono">{formatAdaptivePrice(d.low)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-800/50 pt-1.5 mt-1.5">
          <span className="text-slate-500 font-medium">Close</span>
          <span className="text-blue-400 font-bold font-mono">{formatAdaptivePrice(d.value)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Vol</span>
          <span className="text-slate-400 font-mono">{formatVolume(d.volume)}</span>
        </div>
      </div>
    </div>
  )
}

export function PriceChart() {
  const { data, isLoading, error } = useKlineData()
  const selectedSymbol = useSelectedSymbolStore((s) => s.selectedSymbol)
  const ticker = useTickersStore((s) => (selectedSymbol ? s.tickers[selectedSymbol] : null))

  const change = ticker ? parseFloat(ticker.priceChangePercent) : 0
  const isNegative = change < 0
  const color = isNegative ? '#ef4444' : '#22c55e'

  const lastPriceFormatted = ticker
    ? formatAdaptivePrice(parseFloat(ticker.lastPrice))
    : null

  const changeLabel = ticker
    ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
    : null

  const formatTime = (timestamp: number): string => {
    const d = new Date(timestamp)
    if (d.getHours() === 0 && d.getMinutes() === 0) return String(d.getDate())
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const xTicks = getTimeTicks(data)

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-slate-400">Loading chart data...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-rose-400">Error loading chart</div>
  }

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
  }

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-slate-900">
      {selectedSymbol && (
        <div className="px-4 pt-4 pb-2 flex items-baseline gap-3">
          <span className="text-slate-100 font-bold text-lg">{selectedSymbol}</span>
          {lastPriceFormatted && <span className="text-slate-100 text-2xl font-semibold">${lastPriceFormatted}</span>}
          {changeLabel && (
            <span className="text-sm font-medium" style={{ color }}>
              {changeLabel}
            </span>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={xTicks}
              tickFormatter={formatTime}
              stroke="#334155"
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.12}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
