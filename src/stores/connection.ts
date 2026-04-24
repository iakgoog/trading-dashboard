import { create } from 'zustand'

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

interface ConnectionState {
  status: ConnectionStatus
  retryCount: number
  lastMessageAt: number | null
  lastError: string | null
  setStatus: (status: ConnectionStatus) => void
  setRetryCount: (count: number) => void
  setLastMessageAt: (time: number) => void
  setLastError: (error: string | null) => void
  reset: () => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'disconnected',
  retryCount: 0,
  lastMessageAt: null,
  lastError: null,
  setStatus: (status) => set({ status }),
  setRetryCount: (retryCount) => set({ retryCount }),
  setLastMessageAt: (lastMessageAt) => set({ lastMessageAt }),
  setLastError: (lastError) => set({ lastError }),
  reset: () =>
    set({
      status: 'disconnected',
      retryCount: 0,
      lastMessageAt: null,
      lastError: null,
    }),
}))
