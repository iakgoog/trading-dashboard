import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelectedSymbolStore } from '../stores/selected-symbol'
import { getKlines, ChartPoint } from '../lib/binance/api'

export function useKlineData() {
  const { selectedSymbol } = useSelectedSymbolStore()
  const queryClient = useQueryClient()
  const [ws, setWs] = useState<WebSocket | null>(null)

  const { data: klines = [], isLoading, error } = useQuery({
    queryKey: ['klines', selectedSymbol],
    queryFn: () => selectedSymbol ? getKlines(selectedSymbol, '1m', 100) : Promise.resolve([]),
    enabled: !!selectedSymbol,
    staleTime: 60000,
  })

  useEffect(() => {
    if (!selectedSymbol) return

    if (ws) {
      ws.close()
    }

    const symbolLower = selectedSymbol.toLowerCase()
    const newWs = new WebSocket(`wss://stream.binance.com:9443/ws/${symbolLower}@kline_1m`)

    newWs.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.e === 'kline') {
        const k = message.k
        const newPoint: ChartPoint = {
          time: k.t,
          value: parseFloat(k.c),
        }

        queryClient.setQueryData(['klines', selectedSymbol], (prev: ChartPoint[] = []) => {
          const lastPoint = prev[prev.length - 1]
          if (lastPoint && lastPoint.time === newPoint.time) {
            return [...prev.slice(0, -1), newPoint]
          } else {
            return [...prev.slice(1), newPoint]
          }
        })
      }
    }

    newWs.onerror = (error) => {
      console.error('Kline WebSocket error:', error)
    }

    setWs(newWs)

    return () => {
      newWs.close()
    }
  }, [selectedSymbol, queryClient, ws])

  return { data: klines, isLoading, error }
}
