import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getKlines, getTickerSnapshots } from './api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 429 ? 'Too Many Requests' : status === 500 ? 'Internal Server Error' : 'OK',
    json: async () => body,
  } as Response)
}

function mockFetchReject(error: Error) {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(error)
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── getKlines ────────────────────────────────────────────────────────────────

describe('getKlines', () => {
  it('maps Binance kline array to ChartPoint[]', async () => {
    // Binance returns arrays: [openTime, open, high, low, close, volume, ...]
    const rawKlines = [
      [1700000000000, '65000', '65500', '64800', '65200', '100'],
      [1700000060000, '65200', '65800', '65100', '65600', '120'],
    ]
    mockFetch(200, rawKlines)

    const result = await getKlines('BTCUSDT', '1m', 2)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ time: 1700000000000, value: 65200 })
    expect(result[1]).toEqual({ time: 1700000060000, value: 65600 })
  })

  it('calls the correct Binance REST endpoint', async () => {
    mockFetch(200, [])
    await getKlines('ETHUSDT', '1m', 100)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/binance/api/v3/klines'),
      expect.any(Object),
    )
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('symbol=ETHUSDT'),
      expect.any(Object),
    )
  })

  it('throws on HTTP 429 rate limit', async () => {
    mockFetch(429, { code: -1003, msg: 'Too many requests' })

    await expect(getKlines('BTCUSDT')).rejects.toThrow('429')
  })

  it('throws on HTTP 500 server error', async () => {
    mockFetch(500, { code: -1000, msg: 'Internal error' })

    await expect(getKlines('BTCUSDT')).rejects.toThrow('500')
  })

  it('propagates network / timeout errors', async () => {
    mockFetchReject(new DOMException('signal timed out', 'TimeoutError'))

    await expect(getKlines('BTCUSDT')).rejects.toThrow('signal timed out')
  })
})

// ─── getTickerSnapshots ───────────────────────────────────────────────────────

describe('getTickerSnapshots', () => {
  it('returns TickerSnapshot array on success', async () => {
    const rawSnapshots = [
      { symbol: 'BTCUSDT', lastPrice: '65000', priceChangePercent: '2.5', volume: '12345' },
      { symbol: 'ETHUSDT', lastPrice: '3400', priceChangePercent: '-0.5', volume: '67890' },
    ]
    mockFetch(200, rawSnapshots)

    const result = await getTickerSnapshots(['BTCUSDT', 'ETHUSDT'])

    expect(result).toHaveLength(2)
    expect(result[0]!.symbol).toBe('BTCUSDT')
    expect(result[1]!.symbol).toBe('ETHUSDT')
  })

  it('encodes symbols param correctly', async () => {
    mockFetch(200, [])
    await getTickerSnapshots(['BTCUSDT', 'ETHUSDT'])

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/binance/api/v3/ticker/24hr'),
      expect.any(Object),
    )
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('symbols='),
      expect.any(Object),
    )
  })

  it('throws on HTTP 429 rate limit', async () => {
    mockFetch(429, { code: -1003, msg: 'Too many requests' })

    await expect(getTickerSnapshots(['BTCUSDT'])).rejects.toThrow('429')
  })

  it('throws on HTTP 500 server error', async () => {
    mockFetch(500, { code: -1000, msg: 'Internal error' })

    await expect(getTickerSnapshots(['BTCUSDT'])).rejects.toThrow('500')
  })

  it('propagates network / timeout errors', async () => {
    mockFetchReject(new DOMException('signal timed out', 'TimeoutError'))

    await expect(getTickerSnapshots(['BTCUSDT'])).rejects.toThrow('signal timed out')
  })
})
