import { useQuery } from '@tanstack/react-query'
import { getKlines, ChartPoint } from '../lib/binance/api'

export function useSparklineData(symbol: string) {
  return useQuery<ChartPoint[]>({
    queryKey: ['sparkline', symbol],
    queryFn: () => getKlines(symbol, '1h', 168),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
  })
}
