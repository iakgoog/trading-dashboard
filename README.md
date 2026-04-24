# Multibank Trading Dashboard

Real-time cryptocurrency trading dashboard built for the Multibank technical assessment.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript | Strict typing, concurrent features |
| Build | Vite | Fast HMR, ESM-native |
| Live state | Zustand | Minimal boilerplate, per-symbol selectors prevent unnecessary re-renders |
| Historical data | TanStack Query | Symbol-keyed cache, stale-while-revalidate, retry logic |
| Charts | Recharts | Composable, responsive, no canvas complexity |
| Styling | Tailwind CSS | Utility-first, no CSS-in-JS overhead |
| Testing | Vitest + RTL | Native ESM, fast, same config as Vite |

## Architecture

```
Binance Combined WS Stream ──► BinanceWSManager (singleton)
  20 symbols × @ticker               │
                                     ▼
                            Zustand tickers store ──► TickerList (live prices)

User selects symbol
        │
        ├──► TanStack Query ──► REST /api/v3/klines ──► initial 100 candles
        │                                                        │
        └──► kline WS @kline_1m ──► rolling window update ◄─────┘
                                            │
                                            ▼
                                    Recharts LineChart (real-time)
```

### Two separate WebSocket concerns

**Ticker stream** (`BinanceWSManager`): a single combined-stream connection multiplexes all 20 symbols over one socket. Lives outside React — started at app init, survives symbol changes.

**Kline stream** (`useKlineData`): per-symbol WebSocket opened when a ticker is selected, closed on symbol change or unmount. Keeps the chart in sync tick-by-tick without polling.

### REST + WebSocket stitching

On symbol select, TanStack Query fetches the last 100 1-minute candles from REST. The kline WebSocket then patches the latest candle (same `openTime`) or appends new ones, maintaining a rolling 100-candle window. This means the chart is immediately populated with history and then live — no blank-chart flash.

## Key Design Decisions

### Line chart over candlestick
A line chart on `close` price satisfies the "real-time chart" requirement with lower complexity. The kline data stream provides full OHLCV — upgrading to a candlestick `ComposedChart` is straightforward if needed.

### Singleton WS manager with exponential backoff + jitter
`BinanceWSManager` implements:
- **Exponential backoff**: 500ms → 30s cap, ×2 multiplier
- **±20% jitter**: prevents thundering herd on reconnect
- **Heartbeat** (1s interval, 35s stale threshold): detects silent disconnects that don't fire `onclose` (e.g. DevTools offline)
- **Throughput monitor**: warns at 40 KB/s

### TanStack Query for historical data
Uses symbol-keyed queries (`['klines', symbol]`). Switching symbols hits the cache if recently fetched — no redundant REST calls. `staleTime: 60s` matches the 1-minute candle interval.

### Zustand for live ticker state
Each `TickerRow` subscribes to a per-symbol selector — only the row whose price changed re-renders, not the entire list.

## Setup

```bash
cd project
npm install
npm run dev        # http://localhost:5173
```

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build (tsc + vite)
npm run type-check   # TypeScript validation only
npm run lint         # ESLint
npm test             # Vitest (watch mode)
npm run test:run     # Vitest (CI / single pass)
npm run test:coverage  # Coverage report (v8)
```

## Test Coverage

```
All files  |  ~92% stmts  |  ~85% branch  |  ~88% funcs
```

Tests cover:
- `BinanceWSManager`: connection lifecycle, backoff timing, heartbeat stale detection, throughput monitoring
- `useKlineData`: REST fetch, WS stitching, rolling window, candle update vs append
- `api.ts`: success mapping, HTTP 429/500 error handling, network timeout propagation
- `StatusBadge`: connection status rendering

## What's next

- Candlestick chart via Recharts `ComposedChart` (OHLCV data already in the kline stream)
- Volume bars as a secondary axis
- Symbol search / filter in the ticker list
- Persist selected symbol to `localStorage`
