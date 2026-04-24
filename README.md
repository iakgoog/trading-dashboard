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

## Features

### Ticker List

- Displays 20 live cryptocurrency pairs (BTC, ETH, SOL, BNB, XRP, …)
- Each row shows **live price**, **24 h % change**, and **trading volume**
- Price colour flips green/red on direction change
- Adaptive price precision: 2 dp ≥ $1 000 → 8 dp for sub-cent assets
- Volume rendered with K / M / B suffixes

**How to use:** Click any row (desktop) or card (mobile) to load that symbol's chart.

---

### Real-Time Price Chart

- Area chart of the last 360 1-minute candles (6 hours of history)
- Updates tick-by-tick via WebSocket — no polling
- Y-axis domain and X-axis intervals adjust automatically to the visible range
- Chart colour tracks the 24 h change (green / red)
- Hover tooltip shows Open, High, Low, Close, and Volume for that candle

**How to use:** Select a ticker from the list. Hover over the chart to inspect individual candles.

---

### Sparklines

- Miniature 7-day trend lines rendered inside every ticker row (desktop table only)
- Green when the close is above the open for the period; red otherwise
- Data is fetched once per hour and cached — zero redundant requests

---

### Price Alerts

- Create threshold alerts for any of the 20 symbols
- Two directions: **Above** (fires when price crosses upward) or **Below** (fires when price crosses downward)
- Active alert count shown in the panel header — **"Alerts (3)"**
- Triggered alerts show with strikethrough text and the time they fired
- Keeps the last 20 triggered alerts in history
- Fires a **browser push notification** (requests permission on first use) and an in-app **toast** simultaneously

**How to use:**
1. Expand the **Alerts** panel in the left sidebar (desktop) or open the drawer (mobile).
2. Select a symbol from the dropdown.
3. Type a price threshold and choose **Above** or **Below**.
4. Press **Add Alert** or hit **Enter**.
5. When the price crosses the threshold a toast appears bottom-right and a browser notification fires (if permitted).
6. Click **×** on any alert to remove it.

---

### Toast Notifications

- Slides up from the bottom-right corner when an alert triggers
- Shows symbol, direction indicator (▲ / ▼), and the threshold price
- Auto-dismisses after 4 seconds; click **×** to dismiss immediately

---

### Connection Status Badge

- Located in the top-right of the header
- Animated pulse dot colour-codes the state: **green** (live), **amber** (reconnecting), **red** (disconnected)
- Labels: **Live Data** / **Reconnecting…** / **Disconnected**

**How to use:** Click the badge to expand a details panel showing status, reconnect attempt count, and seconds since the last message.

---

### Draggable Panel Divider

- The sidebar and chart area are separated by a drag handle
- Drag to resize — sidebar ranges from 14 % to 40 % of the viewport width
- Panel proportions are auto-saved and restored on next load

---

### Mobile Layout

- Below the `sm` breakpoint (640 px) the sidebar is hidden
- A **Tickers** button in the header opens a slide-in drawer containing the full ticker list
- Select a ticker in the drawer to load the chart — the drawer auto-closes

---

### Error Boundary

- Catches unhandled React render errors
- Displays a full-screen error UI with the message and a **Try again** button that resets the boundary

---

## Architecture

```
Binance Combined WS Stream ──► BinanceWSManager (singleton)
  20 symbols × @ticker               │
                                     ▼
                            Zustand tickers store ──► TickerList (live prices)
                                     │
                                     └──► alerts store ──► toast / browser notification

User selects symbol
        │
        ├──► TanStack Query ──► REST /api/v3/klines ──► initial 360 candles
        │                                                        │
        └──► kline WS @kline_1m ──► rolling window update ◄─────┘
                                            │
                                            ▼
                                    Recharts AreaChart (real-time)
```

### Two separate WebSocket concerns

**Ticker stream** (`BinanceWSManager`): a single combined-stream connection multiplexes all 20 symbols over one socket. Lives outside React — started at app init, survives symbol changes.

**Kline stream** (`useKlineData`): per-symbol WebSocket opened when a ticker is selected, closed on symbol change or unmount. Keeps the chart in sync tick-by-tick without polling.

### REST + WebSocket stitching

On symbol select, TanStack Query fetches the last 360 1-minute candles from REST. The kline WebSocket then patches the latest candle (same `openTime`) or appends new ones, maintaining a rolling window. The chart is immediately populated with history and then live — no blank-chart flash.

## Key Design Decisions

### Proactive Live Data Integration
While maintaining momentum during the initial phase, this project was developed using the **public Binance API** (REST & WebSockets). This was a deliberate choice to:
1. **Demonstrate Technical Depth**: Show handling of high-frequency, production-grade data streams.
2. **Ensure Resilience**: Validate the WebSocket manager against real-world network conditions and rate limits.
3. **Architecture Readiness**: The system is built with a clean separation of concerns, making it modular and ready to point to any compatible mock or proprietary backend with minimal configuration changes.

### Line chart over candlestick
A line chart on `close` price satisfies the "real-time chart" requirement with lower complexity. The kline data stream provides full OHLCV — upgrading to a candlestick `ComposedChart` is straightforward if needed.

### Unified Responsive Shell (Single Chart Instance)
Rather than rendering separate chart component trees for desktop and mobile layouts, the application uses a unified `PanelGroup` shell. Responsive Tailwind classes (`hidden sm:flex` vs `absolute inset-0`) dynamically shift the layout without unmounting the chart. This architectural choice:
- **Halves Resource Usage**: Guarantees only one active WebSocket connection and one set of DOM nodes for the chart regardless of viewport size.
- **Prevents Desync**: Ensures mobile and desktop views are fundamentally looking at the exact same React state.

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
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier (write)
npm run format:check # Prettier (check only)
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
- Persist selected symbol and alert list to `localStorage`
