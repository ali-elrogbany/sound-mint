import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from 'wagmi'
import { injected } from 'wagmi/connectors'
import { sepolia } from 'wagmi/chains'

/**
 * WalletButton — handles MetaMask connect / disconnect / network switch
 *
 * Behaviour:
 *  - Disconnected  → "Connect Wallet" button
 *  - Wrong network → "⚠ Wrong Network" badge with "Switch to Sepolia" CTA
 *  - Connected (Sepolia) → truncated address, click to open disconnect menu
 */
export default function WalletButton() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isWrongNetwork = isConnected && chainId !== sepolia.id

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const truncate = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''

  // ── Not connected ────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <button
        id="wallet-connect-btn"
        onClick={() => connect({ connector: injected() })}
        disabled={isConnecting}
        className="relative flex items-center gap-2 border border-primary/40 hover:border-primary text-text font-semibold px-4 py-2 rounded-full text-sm transition-all duration-200 hover:shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(160, 68, 255, 0.08)',
        }}
      >
        {isConnecting ? (
          <>
            <span className="animate-spin text-xs">⟳</span>
            Connecting…
          </>
        ) : (
          <>
            <span>🦊</span>
            Connect Wallet
          </>
        )}
      </button>
    )
  }

  // ── Wrong network ────────────────────────────────────────────────────────
  if (isWrongNetwork) {
    return (
      <button
        id="wallet-wrong-network-btn"
        onClick={() => switchChain({ chainId: sepolia.id })}
        disabled={isSwitching}
        className="flex items-center gap-2 border border-error/50 text-error font-semibold px-4 py-2 rounded-full text-sm transition-all duration-200 hover:border-error hover:shadow-[0_0_16px_rgba(255,81,47,0.3)] disabled:opacity-50"
        style={{ background: 'rgba(255,81,47,0.08)' }}
      >
        {isSwitching ? (
          <>
            <span className="animate-spin text-xs">⟳</span>
            Switching…
          </>
        ) : (
          <>
            <span className="animate-pulse">⚠</span>
            Wrong Network — Switch to Sepolia
          </>
        )}
      </button>
    )
  }

  // ── Connected on Sepolia ─────────────────────────────────────────────────
  return (
    <div className="relative" ref={menuRef}>
      <button
        id="wallet-address-btn"
        onClick={() => setMenuOpen((o) => !o)}
        className="flex items-center gap-2 border border-success/40 text-success font-semibold px-4 py-2 rounded-full text-sm transition-all duration-200 hover:border-success hover:shadow-glow-success"
        style={{ background: 'rgba(67,233,123,0.08)' }}
      >
        {/* Green connected dot */}
        <span className="w-2 h-2 rounded-full bg-success animate-pulse-slow inline-block" />
        {truncate(address)}
        <span className="text-muted text-xs ml-1">▾</span>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-52 glass-card py-2 z-50"
          >
            <div className="px-4 py-2 border-b border-white/5">
              <p className="text-xs text-muted">Connected on</p>
              <p className="text-xs font-semibold text-success">Sepolia Testnet</p>
            </div>
            <div className="px-4 py-2 border-b border-white/5">
              <p className="text-xs text-muted mb-0.5">Address</p>
              <p className="text-xs font-mono text-text break-all">{address}</p>
            </div>
            <button
              id="wallet-disconnect-btn"
              onClick={() => { disconnect(); setMenuOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
            >
              Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
