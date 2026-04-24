import { create } from 'zustand'
import type { Alert, AlertDirection, TriggeredAlert } from '../types/alerts'

const MAX_TRIGGERED = 20

interface AlertsState {
  alerts: Alert[]
  triggered: TriggeredAlert[]
  addAlert: (symbol: string, price: number, direction: AlertDirection) => void
  removeAlert: (id: string) => void
  checkAndTrigger: (symbol: string, currentPrice: number) => void
}

function fireNotification(symbol: string, price: number, direction: AlertDirection) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  new Notification(`Price Alert: ${symbol}`, {
    body: `${symbol} is now ${direction} ${price.toLocaleString()}`,
  })
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  triggered: [],

  addAlert: (symbol, price, direction) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
    const alert: Alert = { id: crypto.randomUUID(), symbol, price, direction }
    set((state) => ({ alerts: [...state.alerts, alert] }))
  },

  removeAlert: (id) =>
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

  checkAndTrigger: (symbol, currentPrice) => {
    const { alerts, triggered } = get()
    const toTrigger = alerts.filter((a) => {
      if (a.symbol !== symbol || a.triggeredAt !== undefined) return false
      return a.direction === 'above' ? currentPrice >= a.price : currentPrice <= a.price
    })

    if (toTrigger.length === 0) return

    const now = Date.now()
    const newTriggered: TriggeredAlert[] = toTrigger.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      price: a.price,
      direction: a.direction,
      triggeredAt: now,
    }))

    toTrigger.forEach((a) => fireNotification(a.symbol, a.price, a.direction))

    set((state) => ({
      alerts: state.alerts.map((a) =>
        toTrigger.some((t) => t.id === a.id) ? { ...a, triggeredAt: now } : a
      ),
      triggered: [...newTriggered, ...triggered].slice(0, MAX_TRIGGERED),
    }))
  },
}))
