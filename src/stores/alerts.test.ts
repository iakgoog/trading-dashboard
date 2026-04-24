import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAlertsStore } from './alerts'

vi.stubGlobal('Notification', { permission: 'denied', requestPermission: vi.fn() })

beforeEach(() => {
  useAlertsStore.setState({ alerts: [], triggered: [] })
})

describe('addAlert / removeAlert', () => {
  it('adds an alert with correct fields', () => {
    useAlertsStore.getState().addAlert('BTCUSDT', 50000, 'above')
    const alerts = useAlertsStore.getState().alerts
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({ symbol: 'BTCUSDT', price: 50000, direction: 'above' })
    expect(alerts[0]!.triggeredAt).toBeUndefined()
  })

  it('removes the correct alert by id', () => {
    useAlertsStore.getState().addAlert('BTCUSDT', 50000, 'above')
    useAlertsStore.getState().addAlert('ETHUSDT', 3000, 'below')
    const id = useAlertsStore.getState().alerts[0]!.id
    useAlertsStore.getState().removeAlert(id)
    const alerts = useAlertsStore.getState().alerts
    expect(alerts).toHaveLength(1)
    expect(alerts[0]!.symbol).toBe('ETHUSDT')
  })
})

describe('checkAndTrigger', () => {
  it('triggers when price is at or above threshold (above direction)', () => {
    useAlertsStore.getState().addAlert('BTCUSDT', 50000, 'above')
    useAlertsStore.getState().checkAndTrigger('BTCUSDT', 50001)
    expect(useAlertsStore.getState().triggered).toHaveLength(1)
    expect(useAlertsStore.getState().alerts[0]!.triggeredAt).toBeDefined()
  })

  it('triggers when price is at or below threshold (below direction)', () => {
    useAlertsStore.getState().addAlert('BTCUSDT', 50000, 'below')
    useAlertsStore.getState().checkAndTrigger('BTCUSDT', 49999)
    expect(useAlertsStore.getState().triggered).toHaveLength(1)
    expect(useAlertsStore.getState().alerts[0]!.triggeredAt).toBeDefined()
  })

  it('does not trigger when price has not crossed threshold', () => {
    useAlertsStore.getState().addAlert('BTCUSDT', 50000, 'above')
    useAlertsStore.getState().checkAndTrigger('BTCUSDT', 49999)
    expect(useAlertsStore.getState().triggered).toHaveLength(0)
    expect(useAlertsStore.getState().alerts[0]!.triggeredAt).toBeUndefined()
  })

  it('does not re-trigger an already-triggered alert', () => {
    useAlertsStore.getState().addAlert('BTCUSDT', 50000, 'above')
    useAlertsStore.getState().checkAndTrigger('BTCUSDT', 50001)
    useAlertsStore.getState().checkAndTrigger('BTCUSDT', 50002)
    expect(useAlertsStore.getState().triggered).toHaveLength(1)
  })

  it('does not trigger alerts for a different symbol', () => {
    useAlertsStore.getState().addAlert('ETHUSDT', 3000, 'above')
    useAlertsStore.getState().checkAndTrigger('BTCUSDT', 99999)
    expect(useAlertsStore.getState().triggered).toHaveLength(0)
  })

  it('caps triggered history at 20 entries', () => {
    for (let i = 0; i < 25; i++) {
      useAlertsStore.getState().addAlert('BTCUSDT', 1000 + i, 'above')
    }
    useAlertsStore.getState().checkAndTrigger('BTCUSDT', 2000)
    expect(useAlertsStore.getState().triggered).toHaveLength(20)
  })
})
