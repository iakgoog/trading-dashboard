import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { useSparklineData } from '../../hooks/useSparklineData'

interface SparklineProps {
  symbol: string
}

export function Sparkline({ symbol }: SparklineProps) {
  const { data, isLoading } = useSparklineData(symbol)

  if (isLoading || !data || data.length < 2) {
    return (
      <div className="w-[100px] h-[32px] flex items-center justify-center">
        <div className="w-8 h-px bg-slate-700 animate-pulse" />
      </div>
    )
  }

  const isPositive = data[data.length - 1]!.value >= data[0]!.value
  const strokeColor = isPositive ? '#10b981' : '#f43f5e' // emerald-500 : rose-500

  return (
    <div className="w-[100px] h-[32px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
