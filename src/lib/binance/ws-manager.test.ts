import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useConnectionStore } from '../../stores/connection'
import { useTickersStore } from '../../stores/tickers'

// ─── WebSocket Mock ───────────────────────────────────────────────────────────

class MockWebSocket {
  static instances: MockWebSocket[] = []

  url: string
  readyState: number = 0 // CONNECTING
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: ((event: { code: number; reason: string }) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  sent: string[] = []
  closeCalled = false
  closeCode?: number

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sent.push(data)
  }

  close(code?: number) {
    this.closeCalled = true
    if (code !== undefined) this.closeCode = code
    this.readyState = 3 // CLOSED
    this.onclose?.({ code: code ?? 1000, reason: '' })
  }

  simulateOpen() {
    this.readyState = 1 // OPEN
    this.onopen?.()
  }

  simulateMessage(data: object) {
    const payload = JSON.stringify(data)
    this.onmessage?.({ data: payload })
  }

  simulateError() {
    this.onerror?.(new Event('error'))
  }
}

// ─── Test Setup ───────────────────────────────────────────────────────────────

vi.stubGlobal('WebSocket', MockWebSocket)

beforeEach(() => {
  MockWebSocket.instances = []
  useConnectionStore.getState().reset()
  useTickersStore.setState({ tickers: {} })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ─── Task 1: Connection, Store Updates, Payload Monitoring ───────────────────

describe('BinanceWSManager — Task 1: Connection & Store Updates', () => {
  it('creates WebSocket with correct combined-stream URL', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt', 'ethusdt'])
    manager.start()

    expect(MockWebSocket.instances).toHaveLength(1)
    const ws = MockWebSocket.instances[0]
    expect(ws).toBeDefined()
    expect(ws!.url).toContain('stream.binance.com')
    expect(ws!.url).toContain('btcusdt@ticker')
    expect(ws!.url).toContain('ethusdt@ticker')

    manager.stop()
  })

  it('sets status to connected on onopen', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    const ws = MockWebSocket.instances[0]!
    ws.simulateOpen()

    expect(useConnectionStore.getState().status).toBe('connected')

    manager.stop()
  })

  it('updates ticker store on valid onmessage', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    const ws = MockWebSocket.instances[0]!
    ws.simulateOpen()
    ws.simulateMessage({
      stream: 'btcusdt@ticker',
      data: {
        e: '24hrTicker',
        E: Date.now(),
        s: 'BTCUSDT',
        c: '65000.00',
        P: '2.5',
        v: '12345.6',
        O: Date.now() - 86400000,
      },
    })

    const { tickers } = useTickersStore.getState()
    expect(tickers['BTCUSDT']).toBeDefined()
    expect(tickers['BTCUSDT']!.lastPrice).toBe('65000.00')
    expect(tickers['BTCUSDT']!.priceChangePercent).toBe('2.5')

    manager.stop()
  })

  it('updates lastMessageAt in connection store on message', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    const before = Date.now()
    const ws = MockWebSocket.instances[0]!
    ws.simulateOpen()
    ws.simulateMessage({
      stream: 'btcusdt@ticker',
      data: {
        e: '24hrTicker',
        E: Date.now(),
        s: 'BTCUSDT',
        c: '65000.00',
        P: '2.5',
        v: '12345.6',
        O: Date.now() - 86400000,
      },
    })

    const { lastMessageAt } = useConnectionStore.getState()
    expect(lastMessageAt).not.toBeNull()
    expect(lastMessageAt!).toBeGreaterThanOrEqual(before)

    manager.stop()
  })

  it('warns when aggregate throughput exceeds 40KB/s (D-03)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    const ws = MockWebSocket.instances[0]!
    ws.simulateOpen()

    // Send large payloads to exceed 40KB/s threshold
    const largePayload = {
      stream: 'btcusdt@ticker',
      data: {
        e: '24hrTicker',
        E: Date.now(),
        s: 'BTCUSDT',
        c: '65000.00',
        P: '2.5',
        v: '12345.6',
        O: Date.now() - 86400000,
        extra: 'x'.repeat(50000), // ~50KB to trigger warning
      },
    }
    ws.simulateMessage(largePayload)

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('throughput'))

    manager.stop()
  })
})

// ─── Task 2: Exponential Backoff & Jitter (D-04) ─────────────────────────────

describe('BinanceWSManager — Task 2: Exponential Backoff (D-04)', () => {
  it('sets status to reconnecting on onclose', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    const ws = MockWebSocket.instances[0]!
    ws.simulateOpen()
    ws.close(1006)

    expect(useConnectionStore.getState().status).toBe('reconnecting')

    manager.stop()
  })

  it('first retry occurs at ~500ms (±20% jitter)', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    const ws = MockWebSocket.instances[0]!
    ws.simulateOpen()
    ws.close(1006)

    expect(MockWebSocket.instances).toHaveLength(1)

    // Advance to just before min possible delay (500 * 0.8 = 400ms)
    vi.advanceTimersByTime(399)
    expect(MockWebSocket.instances).toHaveLength(1)

    // Advance to max possible delay (500 * 1.2 = 600ms)
    vi.advanceTimersByTime(201) // total 600ms
    expect(MockWebSocket.instances).toHaveLength(2)

    manager.stop()
  })

  it('second retry delay is ~1000ms (±20% jitter)', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    let ws = MockWebSocket.instances[0]!
    ws.simulateOpen()
    ws.close(1006)

    // First retry fires within 600ms
    vi.advanceTimersByTime(600)
    expect(MockWebSocket.instances).toHaveLength(2)

    // WS2 closes immediately (no simulateOpen) — retryCount stays at 1
    // so second retry delay = backoffDelay(1) = ~1000ms (±20% = 800-1200ms)
    ws = MockWebSocket.instances[1]!
    ws.close(1006)

    // Second retry min: 1000 * 0.8 = 800ms — should NOT have fired yet
    vi.advanceTimersByTime(799)
    expect(MockWebSocket.instances).toHaveLength(2)

    // Second retry max: 1000 * 1.2 = 1200ms — must have fired by now
    vi.advanceTimersByTime(401) // total 1200ms after second close
    expect(MockWebSocket.instances).toHaveLength(3)

    manager.stop()
  })

  it('retry delay caps at 30s', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    // Simulate many consecutive disconnections to exhaust backoff
    for (let i = 0; i < 8; i++) {
      const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1]!
      ws.simulateOpen()
      ws.close(1006)
      vi.advanceTimersByTime(36000) // advance 36s to allow any retry
    }

    // By now the backoff should be capped. Check that a new WS was created within 36s cap
    const retryCount = useConnectionStore.getState().retryCount
    expect(retryCount).toBeGreaterThan(0)

    // After cap: next retry must come within 30s * 1.2 = 36s
    const countBefore = MockWebSocket.instances.length
    const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1]!
    ws.simulateOpen()
    ws.close(1006)
    vi.advanceTimersByTime(36000)
    expect(MockWebSocket.instances.length).toBeGreaterThan(countBefore)

    manager.stop()
  })

  it('increments retryCount on each reconnect attempt', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    const ws = MockWebSocket.instances[0]!
    ws.simulateOpen()
    expect(useConnectionStore.getState().retryCount).toBe(0)

    ws.close(1006)
    vi.advanceTimersByTime(600)

    expect(useConnectionStore.getState().retryCount).toBe(1)

    manager.stop()
  })

  it('resets retryCount to 0 on successful reconnect', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    let ws = MockWebSocket.instances[0]!
    ws.simulateOpen()
    ws.close(1006)
    vi.advanceTimersByTime(600)

    expect(useConnectionStore.getState().retryCount).toBe(1)

    ws = MockWebSocket.instances[1]!
    ws.simulateOpen()

    expect(useConnectionStore.getState().retryCount).toBe(0)
    expect(useConnectionStore.getState().status).toBe('connected')

    manager.stop()
  })
})

// ─── Task 3: Heartbeat & Stale Detection (D-05) ──────────────────────────────

describe('BinanceWSManager — Task 3: Heartbeat (D-05)', () => {
  it('closes socket if no message received for >35s', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    const ws = MockWebSocket.instances[0]!
    ws.simulateOpen()

    // Simulate a message to set lastMessageAt
    ws.simulateMessage({
      stream: 'btcusdt@ticker',
      data: {
        e: '24hrTicker',
        E: Date.now(),
        s: 'BTCUSDT',
        c: '65000.00',
        P: '2.5',
        v: '12345.6',
        O: Date.now() - 86400000,
      },
    })

    expect(ws.closeCalled).toBe(false)

    // Advance 36s without any new message
    vi.advanceTimersByTime(36000)

    expect(ws.closeCalled).toBe(true)

    manager.stop()
  })

  it('closing stale socket triggers reconnection flow', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    const ws = MockWebSocket.instances[0]!
    ws.simulateOpen()
    ws.simulateMessage({
      stream: 'btcusdt@ticker',
      data: {
        e: '24hrTicker',
        E: Date.now(),
        s: 'BTCUSDT',
        c: '65000.00',
        P: '2.5',
        v: '12345.6',
        O: Date.now() - 86400000,
      },
    })

    // Advance past 35s stale threshold
    vi.advanceTimersByTime(36000)
    expect(ws.closeCalled).toBe(true)
    expect(useConnectionStore.getState().status).toBe('reconnecting')

    // Advance enough for first retry
    vi.advanceTimersByTime(600)
    expect(MockWebSocket.instances).toHaveLength(2)

    manager.stop()
  })

  it('does not close if messages arrive regularly', async () => {
    const { BinanceWSManager } = await import('./ws-manager')
    const manager = new BinanceWSManager(['btcusdt'])
    manager.start()

    const ws = MockWebSocket.instances[0]!
    ws.simulateOpen()

    const msg = {
      stream: 'btcusdt@ticker',
      data: {
        e: '24hrTicker',
        E: Date.now(),
        s: 'BTCUSDT',
        c: '65000.00',
        P: '2.5',
        v: '12345.6',
        O: Date.now() - 86400000,
      },
    }

    // Send message every 5s for 40s — heartbeat should never trigger
    for (let i = 0; i < 8; i++) {
      ws.simulateMessage(msg)
      vi.advanceTimersByTime(5000)
    }

    expect(ws.closeCalled).toBe(false)

    manager.stop()
  })
})
