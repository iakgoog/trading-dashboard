import { BINANCE_REST_BASE } from '../../constants/api'

export interface TickerSnapshot {
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvgPrice: string
  prevClosePrice: string
  lastPrice: string
  lastQty: string
  bidPrice: string
  bidQty: string
  askPrice: string
  askQty: string
  openPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openTime: number
  closeTime: number
  firstId: number
  lastId: number
  count: number
}

export interface Kline {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteVolume: string
  trades: number
  takerBuyBaseVolume: string
  takerBuyQuoteVolume: string
}

export interface ChartPoint {
  time: number
  value: number
}

export async function getTickerSnapshots(symbols: string[]): Promise<TickerSnapshot[]> {
  const symbolsParam = JSON.stringify(symbols)
  const response = await fetch(
    `${BINANCE_REST_BASE}/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    }
  )

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data as TickerSnapshot[]
}

export async function getKlines(
  symbol: string,
  interval: string = '1m',
  limit: number = 100
): Promise<ChartPoint[]> {
  const response = await fetch(
    `${BINANCE_REST_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    }
  )

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status} ${response.statusText}`)
  }

  const data: (number | string)[][] = await response.json()

  return data.map((kline) => ({
    time: kline[0] as number,
    value: parseFloat(kline[4] as string),
  }))
}
