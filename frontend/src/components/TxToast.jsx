import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * TxToast — slide-in notification for transaction status
 *
 * Props:
 *  - show       {boolean}  — controls visibility
 *  - type       {'success'|'error'|'pending'}
 *  - title      {string}
 *  - message    {string}
 *  - txHash     {string=}  — if provided, shows Etherscan link
 *  - onDismiss  {function} — called when auto-dismissed or closed manually
 */
export default function TxToast({ show, type = 'pending', title, message, txHash, onDismiss }) {
  // Auto-dismiss after 8s for success/error
  useEffect(() => {
    if (!show || type === 'pending') return
    const timer = setTimeout(() => onDismiss?.(), 8000)
    return () => clearTimeout(timer)
  }, [show, type, onDismiss])

  const styles = {
    success: {
      border: 'border-success/40',
      bg: 'rgba(67,233,123,0.08)',
      glow: '0 0 24px rgba(67,233,123,0.25)',
      icon: '✓',
      iconColor: 'text-success',
    },
    error: {
      border: 'border-error/40',
      bg: 'rgba(255,81,47,0.08)',
      glow: '0 0 24px rgba(255,81,47,0.25)',
      icon: '✗',
      iconColor: 'text-error',
    },
    pending: {
      border: 'border-primary/40',
      bg: 'rgba(160,68,255,0.08)',
      glow: '0 0 24px rgba(160,68,255,0.2)',
      icon: '⟳',
      iconColor: 'text-primary',
    },
  }

  const s = styles[type] || styles.pending

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`fixed bottom-6 right-6 z-50 w-80 glass-card border ${s.border} p-4`}
          style={{ background: s.bg, boxShadow: s.glow }}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <span
              className={`text-xl font-bold ${s.iconColor} ${type === 'pending' ? 'animate-spin' : ''} flex-shrink-0 mt-0.5`}
            >
              {s.icon}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text text-sm">{title}</p>
              {message && (
                <p className="text-muted text-xs mt-0.5 leading-relaxed">{message}</p>
              )}
              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-secondary transition-colors mt-1.5 font-medium"
                >
                  View on Etherscan ↗
                </a>
              )}
            </div>

            {/* Close button */}
            {type !== 'pending' && (
              <button
                onClick={onDismiss}
                className="text-muted hover:text-text transition-colors text-lg leading-none flex-shrink-0 -mt-0.5"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            )}
          </div>

          {/* Progress bar for auto-dismiss */}
          {type !== 'pending' && (
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 rounded-full"
              style={{
                background: type === 'success'
                  ? 'linear-gradient(90deg, #43E97B, #12D8FA)'
                  : 'linear-gradient(90deg, #FF512F, #DD2476)',
              }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 8, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
