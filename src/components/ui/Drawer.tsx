import type { ReactNode } from 'react'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function Drawer({ isOpen, onClose, children }: DrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          aria-hidden="true"
        />
      )}

      {/* Slide-over panel */}
      <div
        className={[
          'fixed inset-y-0 left-0 w-96 max-w-[90vw] bg-slate-900 shadow-2xl z-40',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Ticker list"
      >
        {children}
      </div>
    </>
  )
}
