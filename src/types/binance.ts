export interface TickerSnapshot {
  symbol: string
  lastPrice: string
  priceChangePercent: string
  volume: string
  openTime: number
}

export interface BinanceWSMessage {
  stream: string
  data: {
    e: string // Event type: "24hrTicker"
    E: number // Event time
    s: string // Symbol
    c: string // Close price (last price)
    P: string // Price change percent
    v: string // Total traded base asset volume
    O: number // Statistics open time
  }
}

export interface KlineWSMessage {
  e: string // "kline"
  E: number // Event time
  s: string // Symbol
  k: {
    t: number // Kline start time
    T: number // Kline close time
    s: string // Symbol
    i: string // Interval
    f: number // First trade ID
    L: number // Last trade ID
    o: string // Open price
    c: string // Close price
    h: string // High price
    l: string // Low price
    v: string // Base asset volume
    n: number // Number of trades
    x: boolean // Is this kline closed?
    q: string // Quote asset volume
    V: string // Taker buy base asset volume
    Q: string // Taker buy quote asset volume
    B: string // Ignore
  }
}
