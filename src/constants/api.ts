/** Binance REST API base URL */
export const BINANCE_REST_BASE = '/api/binance'

/** Binance WebSocket combined stream base (ticker manager) */
export const BINANCE_WS_BASE_STREAM = 'wss://stream.binance.com:9443/stream?streams='

/** Binance WebSocket single stream base (kline hook) */
export const BINANCE_WS_BASE_WS = 'wss://stream.binance.com:9443/ws'

/** Kline/candlestick interval */
export const KLINE_INTERVAL = '1m'

/** Rolling window size — max candles kept in memory */
export const KLINE_LIMIT = 360

/** Stream suffix for 24hr ticker updates */
export const TICKER_STREAM_SUFFIX = '@ticker'

/** Stream suffix for 1-minute kline updates */
export const KLINE_STREAM_SUFFIX = `@kline_${KLINE_INTERVAL}`
