export interface TickerSnapshot {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
  openTime: number;
}

export interface BinanceWSMessage {
  stream: string;
  data: {
    e: string; // Event type: "24hrTicker"
    E: number; // Event time
    s: string; // Symbol
    c: string; // Close price (last price)
    P: string; // Price change percent
    v: string; // Total traded base asset volume
    O: number; // Statistics open time
  };
}
