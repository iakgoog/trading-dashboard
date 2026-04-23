import { useState } from 'react';
import { useConnectionStore } from '../../stores/connection';
import type { ConnectionStatus } from '../../stores/connection';

interface StatusConfig {
  label: string;
  dotClass: string;
  badgeClass: string;
}

const STATUS_CONFIG: Record<ConnectionStatus, StatusConfig> = {
  connected: {
    label: 'Live Data',
    dotClass: 'bg-emerald-500 animate-pulse',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  reconnecting: {
    label: 'Reconnecting...',
    dotClass: 'bg-amber-500 animate-pulse',
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  disconnected: {
    label: 'Disconnected',
    dotClass: 'bg-rose-500',
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
  },
};

export function StatusBadge() {
  const { status, retryCount, lastMessageAt } = useConnectionStore();
  const [open, setOpen] = useState(false);
  const config = STATUS_CONFIG[status];

  const secondsAgo =
    lastMessageAt !== null
      ? Math.floor((Date.now() - lastMessageAt) / 1000)
      : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${config.badgeClass}`}
        aria-label={`Connection status: ${config.label}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
        {config.label}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-10 p-3 text-sm text-slate-700">
          <p className="font-semibold mb-1">Connection Details</p>
          <p>Status: <span className="font-medium">{status}</span></p>
          {retryCount > 0 && (
            <p>Retry count: <span className="font-medium">{retryCount}</span></p>
          )}
          {secondsAgo !== null && (
            <p>Last message: <span className="font-medium">{secondsAgo}s ago</span></p>
          )}
          {secondsAgo === null && (
            <p className="text-slate-400">No messages received yet</p>
          )}
        </div>
      )}
    </div>
  );
}
