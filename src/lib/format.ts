/**
 * Adaptive price formatting based on asset value.
 * - price >= 1000   → 2 decimals (BTC: 67,432.00)
 * - price >= 1      → 4 decimals (ETH: 3,421.1234)
 * - price >= 0.01   → 6 decimals
 * - price < 0.01    → 8 decimals (SHIB: 0.00002341)
 */
export function formatAdaptivePrice(price: number): string {
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }

  if (price < 0.01) {
    options.minimumFractionDigits = 8
    options.maximumFractionDigits = 8
  } else if (price < 1) {
    options.minimumFractionDigits = 6
    options.maximumFractionDigits = 6
  } else if (price < 1000) {
    options.minimumFractionDigits = 4
    options.maximumFractionDigits = 4
  }

  return new Intl.NumberFormat('en-US', options).format(price)
}

/**
 * Formats volume with K/M/B suffixes.
 */
export function formatVolume(volume: string | number): string {
  const v = typeof volume === 'string' ? parseFloat(volume) : volume
  if (isNaN(v)) return '0.00'

  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(2)}K`
  return v.toFixed(2)
}
