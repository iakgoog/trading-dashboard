import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelectedSymbolStore } from '../stores/selected-symbol'
import { getKlines, ChartPoint } from '../lib/binance/api'
import type { KlineWSMessage } from '../types/binance'

export function useKlineData() {
  const { selectedSymbol } = useSelectedSymbolStore()
  const queryClient = useQueryClient()

  const { data: klines = [], isLoading, error } = useQuery({
    queryKey: ['klines', selectedSymbol],
    queryFn: () => selectedSymbol ? getKlines(selectedSymbol, '1m', 100) : Promise.resolve([]),
    enabled: !!selectedSymbol,
    staleTime: 60000,
  })

  useEffect(() => {
    if (!selectedSymbol) return

    const symbolLower = selectedSymbol.toLowerCase()
    const newWs = new WebSocket(`wss://stream.binance.com:9443/ws/${symbolLower}@kline_1m`)

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
              return next.length > 100 ? next.slice(1) : next
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
