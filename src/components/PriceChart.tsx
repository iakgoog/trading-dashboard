import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useKlineData } from '../hooks/useKlineData'
import { useTickersStore } from '../stores/tickers'
import { useSelectedSymbolStore } from '../stores/selected-symbol'

interface TooltipPayload {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length || payload[0] === undefined) return null
  const price = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(payload[0].value)
  const dt = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(label ?? 0))
  return (
    <div className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm">
      <p className="text-slate-100 font-medium">{price}</p>
      <p className="text-slate-400">{dt}</p>
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

  const lastPrice = ticker
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(parseFloat(ticker.lastPrice))
    : null

  const changeLabel = ticker
    ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
    : null

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

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
    <div className="flex flex-col w-full h-full bg-slate-900">
      {selectedSymbol && (
        <div className="px-4 pt-4 pb-2 flex items-baseline gap-3">
          <span className="text-slate-100 font-bold text-lg">{selectedSymbol}</span>
          {lastPrice && <span className="text-slate-100 text-2xl font-semibold">${lastPrice}</span>}
          {changeLabel && (
            <span className="text-sm font-medium" style={{ color }}>
              {changeLabel}
            </span>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              stroke="#334155"
              tick={{ fill: '#64748b', fontSize: 11 }}
              minTickGap={60}
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
