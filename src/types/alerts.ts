export type AlertDirection = 'above' | 'below'

export interface Alert {
  id: string
  symbol: string
  price: number
  direction: AlertDirection
  triggeredAt?: number
}

export interface TriggeredAlert {
  id: string
  symbol: string
  price: number
  direction: AlertDirection
  triggeredAt: number
}
