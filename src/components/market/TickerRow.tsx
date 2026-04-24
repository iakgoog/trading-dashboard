import React from 'react';
import { useTickersStore } from '../../stores/tickers';
import { useSelectedSymbolStore } from '../../stores/selected-symbol';
import { Sparkline } from './Sparkline';

interface TickerRowProps {
  symbol: string;
}

function formatVolume(volume: string): string {
  const v = parseFloat(volume);
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(2)}K`;
  return v.toFixed(2);
}

function formatPrice(price: string): string {
  const p = parseFloat(price);
  if (p >= 1_000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(6);
}

export const TickerRow = React.memo(function TickerRow({ symbol }: TickerRowProps) {
  const ticker = useTickersStore((state) => state.tickers[symbol]);
  const selectedSymbol = useSelectedSymbolStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useSelectedSymbolStore((state) => state.setSelectedSymbol);

  const isSelected = selectedSymbol === symbol;

  if (!ticker) {
    return (
      <tr
        className={`cursor-pointer transition-colors hover:bg-slate-800 ${isSelected ? 'bg-slate-700/50' : ''}`}
        onClick={() => setSelectedSymbol(symbol)}
      >
        <td className="px-3 py-2 text-sm font-medium text-slate-300">{symbol.replace('USDT', '')}</td>
        <td className="px-3 py-2 text-right text-sm tabular-nums text-slate-500">—</td>
        <td className="px-3 py-2 text-right text-sm tabular-nums text-slate-500">—</td>
        <td className="px-3 py-2 text-right text-sm tabular-nums text-slate-500">—</td>
        <td className="px-3 py-2 flex justify-center">
          <Sparkline symbol={symbol} />
        </td>
      </tr>
    );
  }

  const changePercent = parseFloat(ticker.priceChangePercent);
  const isPositive = changePercent >= 0;
  const changeClass = isPositive ? 'text-emerald-400' : 'text-rose-400';
  const changeSign = isPositive ? '+' : '';

  return (
    <tr
      className={`cursor-pointer transition-colors hover:bg-slate-800 ${isSelected ? 'bg-slate-700/50 ring-1 ring-inset ring-slate-600' : ''}`}
      onClick={() => setSelectedSymbol(symbol)}
    >
      <td className="px-3 py-2 text-sm font-semibold text-slate-200">
        {symbol.replace('USDT', '')}
        <span className="text-slate-500 font-normal text-xs ml-0.5">USDT</span>
      </td>
      <td className="px-3 py-2 text-right text-sm tabular-nums text-slate-300 font-mono">
        {formatPrice(ticker.lastPrice)}
      </td>
      <td className={`px-3 py-2 text-right text-sm tabular-nums font-medium ${changeClass}`}>
        {changeSign}{changePercent.toFixed(2)}%
      </td>
      <td className="px-3 py-2 text-right text-sm tabular-nums text-slate-400 font-mono">
        {formatVolume(ticker.volume)}
      </td>
      <td className="px-3 py-2">
        <div className="flex justify-center">
          <Sparkline symbol={symbol} />
        </div>
      </td>
    </tr>
  );
});

TickerRow.displayName = 'TickerRow';
