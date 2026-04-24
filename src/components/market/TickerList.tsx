import { useTickersStore } from '../../stores/tickers';
import { TOP_SYMBOLS } from '../../constants/symbols';
import { TickerRow } from './TickerRow';
import { useSelectedSymbolStore } from '../../stores/selected-symbol';

function MobileTickerCard({ symbol }: { symbol: string }) {
  const ticker = useTickersStore((state) => state.tickers[symbol]);
  const selectedSymbol = useSelectedSymbolStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useSelectedSymbolStore((state) => state.setSelectedSymbol);

  const isSelected = selectedSymbol === symbol;

  if (!ticker) {
    return (
      <button
        type="button"
        className={`w-full text-left px-4 py-3 flex justify-between items-center border-b border-slate-800 transition-colors min-h-[56px] hover:bg-slate-800 ${isSelected ? 'bg-slate-700/50' : ''}`}
        onClick={() => setSelectedSymbol(symbol)}
      >
        <span className="font-semibold text-slate-300 text-sm">
          {symbol.replace('USDT', '')}
          <span className="text-slate-500 font-normal text-xs ml-0.5">USDT</span>
        </span>
        <span className="text-slate-500 text-sm tabular-nums">Loading...</span>
      </button>
    );
  }

  const changePercent = parseFloat(ticker.priceChangePercent);
  const isPositive = changePercent >= 0;
  const changeClass = isPositive ? 'text-emerald-400' : 'text-rose-400';
  const changeSign = isPositive ? '+' : '';

  return (
    <button
      type="button"
      className={`w-full text-left px-4 py-3 border-b border-slate-800 transition-colors min-h-[56px] hover:bg-slate-800 ${isSelected ? 'bg-slate-700/50 ring-1 ring-inset ring-slate-600' : ''}`}
      onClick={() => setSelectedSymbol(symbol)}
    >
      <div className="flex justify-between items-center">
        <span className="font-semibold text-slate-200 text-sm">
          {symbol.replace('USDT', '')}
          <span className="text-slate-500 font-normal text-xs ml-0.5">USDT</span>
        </span>
        <span className="text-slate-200 text-sm tabular-nums font-mono">
          {parseFloat(ticker.lastPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex justify-between items-center mt-0.5">
        <span className="text-slate-500 text-xs tabular-nums">
          Vol: {parseFloat(ticker.volume) >= 1_000_000 ? `${(parseFloat(ticker.volume) / 1_000_000).toFixed(1)}M` : `${(parseFloat(ticker.volume) / 1_000).toFixed(1)}K`}
        </span>
        <span className={`text-xs tabular-nums font-medium ${changeClass}`}>
          {changeSign}{changePercent.toFixed(2)}%
        </span>
      </div>
    </button>
  );
}

export function TickerList() {
  const tickerCount = useTickersStore((state) => Object.keys(state.tickers).length);
  const isLoading = tickerCount === 0;

  return (
    <>
      {/* Desktop layout: semantic table */}
      <div className="hidden sm:block h-full overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin mb-3" />
            <p className="text-sm">Connecting to market data...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-400 text-xs uppercase tracking-wider">Symbol</th>
                <th className="px-3 py-2 text-right font-medium text-slate-400 text-xs uppercase tracking-wider">Price</th>
                <th className="px-3 py-2 text-right font-medium text-slate-400 text-xs uppercase tracking-wider">24h %</th>
                <th className="px-3 py-2 text-right font-medium text-slate-400 text-xs uppercase tracking-wider">Volume</th>
                <th className="px-3 py-2 text-center font-medium text-slate-400 text-xs uppercase tracking-wider">Last 7 Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {TOP_SYMBOLS.map((symbol) => (
                <TickerRow key={symbol} symbol={symbol} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile layout: card list */}
      <div className="sm:hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin mb-3" />
            <p className="text-sm">Connecting to market data...</p>
          </div>
        ) : (
          <div>
            {TOP_SYMBOLS.map((symbol) => (
              <MobileTickerCard key={symbol} symbol={symbol} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
