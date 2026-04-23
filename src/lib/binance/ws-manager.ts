import { useConnectionStore } from '../../stores/connection';
import { useTickersStore } from '../../stores/tickers';
import type { BinanceWSMessage } from '../../types/binance';

const WS_BASE_URL = 'wss://stream.binance.com:9443/stream?streams=';
const HEARTBEAT_INTERVAL_MS = 1_000; // Check every 1s for precision (D-05)
const STALE_THRESHOLD_MS = 35_000;
const BACKOFF_BASE_MS = 500;
const BACKOFF_MAX_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;
const JITTER_FACTOR = 0.2; // ±20%
const THROUGHPUT_WARN_BYTES_PER_S = 40_000; // 40 KB/s

/** Computes jittered exponential backoff delay (D-04). */
function backoffDelay(retryCount: number): number {
  const base = Math.min(
    BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, retryCount),
    BACKOFF_MAX_MS,
  );
  const jitter = base * JITTER_FACTOR * (Math.random() * 2 - 1);
  return Math.max(0, base + jitter);
}

export class BinanceWSManager {
  private symbols: string[];
  private ws: WebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  // Throughput monitoring (D-03)
  private bytesThisSecond = 0;
  private throughputTimer: ReturnType<typeof setInterval> | null = null;

  constructor(symbols: string[]) {
    this.symbols = symbols;
  }

  start(): void {
    this.stopped = false;
    this.connect();
    this.startThroughputMonitor();
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    this.ws?.close(1000);
    this.ws = null;
  }

  private buildUrl(): string {
    const streams = this.symbols.map((s) => `${s}@ticker`).join('/');
    return `${WS_BASE_URL}${streams}`;
  }

  private connect(): void {
    const store = useConnectionStore.getState();
    this.ws = new WebSocket(this.buildUrl());

    this.ws.onopen = () => {
      store.setStatus('connected');
      store.setRetryCount(0);
      store.setLastError(null);
      this.startHeartbeat();
    };

    this.ws.onmessage = (event: MessageEvent<string>) => {
      store.setLastMessageAt(Date.now());

      // Throughput accounting (D-03) — check synchronously per message
      this.bytesThisSecond += event.data.length;
      if (this.bytesThisSecond > THROUGHPUT_WARN_BYTES_PER_S) {
        console.warn(
          `[BinanceWSManager] High throughput detected: ${(this.bytesThisSecond / 1024).toFixed(1)} KB/s — budget is ${THROUGHPUT_WARN_BYTES_PER_S / 1024} KB/s (D-03)`,
        );
      }

      try {
        const msg = JSON.parse(event.data) as BinanceWSMessage;
        const d = msg.data;
        useTickersStore.getState().updateTicker(d.s, {
          symbol: d.s,
          lastPrice: d.c,
          priceChangePercent: d.P,
          volume: d.v,
          openTime: d.O,
        });
      } catch {
        // malformed payload — ignore
      }
    };

    this.ws.onclose = (_event: CloseEvent) => {
      this.stopHeartbeat();
      if (this.stopped) return;
      store.setStatus('reconnecting');
      const currentRetry = useConnectionStore.getState().retryCount;
      const delay = backoffDelay(currentRetry);
      store.setRetryCount(currentRetry + 1);

      this.reconnectTimer = setTimeout(() => {
        if (!this.stopped) this.connect();
      }, delay);
    };

    this.ws.onerror = () => {
      useConnectionStore.getState().setLastError('WebSocket error');
    };
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      const { lastMessageAt, status } = useConnectionStore.getState();
      if (status !== 'connected') return;
      if (lastMessageAt !== null && Date.now() - lastMessageAt >= STALE_THRESHOLD_MS) {
        this.ws?.close(4000); // force close → triggers onclose → reconnect
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private startThroughputMonitor(): void {
    this.throughputTimer = setInterval(() => {
      if (this.bytesThisSecond > THROUGHPUT_WARN_BYTES_PER_S) {
        console.warn(
          `[BinanceWSManager] High throughput detected: ${(this.bytesThisSecond / 1024).toFixed(1)} KB/s — budget is ${THROUGHPUT_WARN_BYTES_PER_S / 1024} KB/s (D-03)`,
        );
      }
      this.bytesThisSecond = 0;
    }, 1_000);
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.throughputTimer !== null) {
      clearInterval(this.throughputTimer);
      this.throughputTimer = null;
    }
  }
}

// Singleton
export const binanceWSManager = new BinanceWSManager([
  'btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'xrpusdt',
  'adausdt', 'dogeusdt', 'avaxusdt', 'maticusdt', 'linkusdt',
  'dotusdt', 'ltcusdt', 'uniusdt', 'atomusdt', 'xlmusdt',
  'etcusdt', 'algousdt', 'vetusdt', 'filusdt', 'trxusdt',
]);
