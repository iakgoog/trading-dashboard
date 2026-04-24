import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useKlineData } from '../hooks/useKlineData'

export function PriceChart() {
  const { data, isLoading, error } = useKlineData()

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-slate-400">Loading chart data...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-rose-400">Error loading chart</div>
  }

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const formatPrice = (value: number) => value.toFixed(2)

  return (
    <div className="w-full h-full bg-slate-900">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={formatPrice}
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
            itemStyle={{ color: '#f1f5f9' }}
            labelFormatter={(value) => `Time: ${formatTime(Number(value))}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
