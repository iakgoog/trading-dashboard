import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import { useConnectionStore } from '../../stores/connection';

afterEach(() => {
  useConnectionStore.getState().reset();
});

describe('StatusBadge', () => {
  it('shows "Live Data" when connected', () => {
    useConnectionStore.getState().setStatus('connected');
    render(<StatusBadge />);
    expect(screen.getByText('Live Data')).toBeInTheDocument();
  });

  it('shows "Reconnecting..." when reconnecting', () => {
    useConnectionStore.getState().setStatus('reconnecting');
    render(<StatusBadge />);
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('shows "Disconnected" when disconnected', () => {
    useConnectionStore.getState().setStatus('disconnected');
    render(<StatusBadge />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('opens popover with retry count on click', () => {
    useConnectionStore.getState().setStatus('reconnecting');
    useConnectionStore.getState().setRetryCount(3);
    render(<StatusBadge />);

    fireEvent.click(screen.getByRole('button', { name: /connection status/i }));
    expect(screen.getByText('Connection Details')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows last message timing in popover', () => {
    useConnectionStore.getState().setStatus('connected');
    useConnectionStore.getState().setLastMessageAt(Date.now() - 5000);
    render(<StatusBadge />);

    fireEvent.click(screen.getByRole('button', { name: /connection status/i }));
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('updates reactively when status changes', () => {
    useConnectionStore.getState().setStatus('disconnected');
    const { rerender } = render(<StatusBadge />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();

    useConnectionStore.getState().setStatus('connected');
    rerender(<StatusBadge />);
    expect(screen.getByText('Live Data')).toBeInTheDocument();
  });
});
