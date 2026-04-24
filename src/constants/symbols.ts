export const TOP_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'DOGEUSDT',
  'AVAXUSDT',
  'TRXUSDT',
  'DOTUSDT',
  'LINKUSDT',
  'MATICUSDT',
  'LTCUSDT',
  'SHIBUSDT',
  'UNIUSDT',
  'ATOMUSDT',
  'ETCUSDT',
  'XLMUSDT',
  'FILUSDT',
  'APTUSDT',
] as const;

export type TopSymbol = (typeof TOP_SYMBOLS)[number];
