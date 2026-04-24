/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useKlineData } from './useKlineData';
import { useSelectedSymbolStore } from '../stores/selected-symbol';
import * as api from '../lib/binance/api';

// ─── WebSocket Mock ───────────────────────────────────────────────────────────

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  url: string;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  close() {
    this.onclose?.();
  }

  simulateMessage(data: any) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

// ─── API Mock ────────────────────────────────────────────────────────────────

vi.mock('../lib/binance/api', () => ({
  getKlines: vi.fn(),
}));

// ─── Test Wrapper ────────────────────────────────────────────────────────────

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useKlineData hook', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    useSelectedSymbolStore.getState().setSelectedSymbol(null);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty data when no symbol is selected', () => {
    const { result } = renderHook(() => useKlineData(), { wrapper: createWrapper() });
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches initial data when a symbol is selected', async () => {
    const mockKlines = [{ time: 1000, value: 50000 }];
    vi.mocked(api.getKlines).mockResolvedValue(mockKlines);

    useSelectedSymbolStore.getState().setSelectedSymbol('BTCUSDT');

    const { result } = renderHook(() => useKlineData(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockKlines);
    expect(api.getKlines).toHaveBeenCalledWith('BTCUSDT', '1m', 360);
  });

  it('updates existing candle on WebSocket message with same timestamp', async () => {
    const initialKlines = [{ time: 1000, value: 50000 }];
    vi.mocked(api.getKlines).mockResolvedValue(initialKlines);

    useSelectedSymbolStore.getState().setSelectedSymbol('BTCUSDT');

    const { result } = renderHook(() => useKlineData(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toEqual(initialKlines));

    const ws = MockWebSocket.instances[0]!;
    ws.simulateMessage({
      e: 'kline',
      k: {
        t: 1000,
        c: '51000.00',
      },
    });

    await waitFor(() => {
      expect(result.current.data[0]!.value).toBe(51000);
    });
    expect(result.current.data).toHaveLength(1);
  });

  it('appends new candle on WebSocket message with new timestamp', async () => {
    const initialKlines = [{ time: 1000, value: 50000 }];
    vi.mocked(api.getKlines).mockResolvedValue(initialKlines);

    useSelectedSymbolStore.getState().setSelectedSymbol('BTCUSDT');

    const { result } = renderHook(() => useKlineData(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toEqual(initialKlines));

    const ws = MockWebSocket.instances[0]!;
    ws.simulateMessage({
      e: 'kline',
      k: {
        t: 2000,
        c: '52000.00',
      },
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[1]!.time).toBe(2000);
      expect(result.current.data[1]!.value).toBe(52000);
    });
  });

  it('maintains rolling window of 360 points', async () => {
    // Create 360 points
    const initialKlines = Array.from({ length: 360 }, (_, i) => ({
      time: i * 1000,
      value: 50000 + i,
    }));
    vi.mocked(api.getKlines).mockResolvedValue(initialKlines);

    useSelectedSymbolStore.getState().setSelectedSymbol('BTCUSDT');

    const { result } = renderHook(() => useKlineData(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toHaveLength(360));

    const ws = MockWebSocket.instances[0]!;
    ws.simulateMessage({
      e: 'kline',
      k: {
        t: 360 * 1000,
        c: '60000.00',
      },
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(360);
      expect(result.current.data[0]!.time).toBe(1000); // Oldest (0) removed
      expect(result.current.data[359]!.time).toBe(360000); // Newest added
    });
  });

  it('closes WebSocket on unmount', async () => {
    vi.mocked(api.getKlines).mockResolvedValue([]);
    useSelectedSymbolStore.getState().setSelectedSymbol('BTCUSDT');

    const { unmount } = renderHook(() => useKlineData(), { wrapper: createWrapper() });
    
    const ws = MockWebSocket.instances[0]!;
    const closeSpy = vi.spyOn(ws, 'close');

    unmount();
    expect(closeSpy).toHaveBeenCalled();
  });
});
