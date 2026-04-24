import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelectedSymbolStore } from '../stores/selected-symbol'
import { getKlines, ChartPoint } from '../lib/binance/api'
import type { KlineWSMessage } from '../types/binance'
import { BINANCE_WS_BASE_WS, KLINE_INTERVAL, KLINE_LIMIT, KLINE_STREAM_SUFFIX } from '../constants/api'

export function useKlineData() {
  const { selectedSymbol } = useSelectedSymbolStore()
  const queryClient = useQueryClient()

  const { data: klines = [], isLoading, error } = useQuery({
    queryKey: ['klines', selectedSymbol],
    queryFn: () => selectedSymbol ? getKlines(selectedSymbol, KLINE_INTERVAL, KLINE_LIMIT) : Promise.resolve([]),
    enabled: !!selectedSymbol,
    staleTime: 60000,
  })

  useEffect(() => {
    if (!selectedSymbol) return

    const symbolLower = selectedSymbol.toLowerCase()
    const newWs = new WebSocket(`${BINANCE_WS_BASE_WS}/${symbolLower}${KLINE_STREAM_SUFFIX}`)

    newWs.onmessage = (event: MessageEvent<string>) => {
      try {
        const message = JSON.parse(event.data) as KlineWSMessage
        if (message.e === 'kline') {
          const k = message.k
          const newPoint: ChartPoint = {
            time: k.t,
            value: parseFloat(k.c),
          }

          queryClient.setQueryData(['klines', selectedSymbol], (prev: ChartPoint[] = []) => {
            if (!prev || prev.length === 0) return [newPoint]
            
            const lastPoint = prev[prev.length - 1]
            if (lastPoint && lastPoint.time === newPoint.time) {
              return [...prev.slice(0, -1), newPoint]
            } else {
              const next = [...prev, newPoint]
              return next.length > KLINE_LIMIT ? next.slice(1) : next
            }
          })
        }
      } catch (err) {
        console.error('Error parsing kline message:', err)
      }
    }

    newWs.onerror = (err) => {
      console.error('Kline WebSocket error:', err)
    }

    return () => {
      newWs.close()
    }
  }, [selectedSymbol, queryClient])

  return { data: klines, isLoading, error }
}
