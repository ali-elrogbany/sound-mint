import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CONTRACT_ADDRESS } from '../config/contract.js'

/**
 * SuccessScreen — Step 5 shown after a successful mint
 *
 * Props:
 *  - txHash    {string}   — confirmed transaction hash
 *  - tokenId   {string}   — minted token ID (as string)
 *  - result    {object}   — pipeline result (animation_url, visual_traits, audio_traits)
 *  - onReset   {function} — restart the flow from step 1
 */
export default function SuccessScreen({ txHash, tokenId, result, onReset }) {
  const canvasRef = useRef(null)

  const palette = result?.visual_traits?.color_palette || ['#A044FF', '#12D8FA']
  const gradientBorder = `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`

  const etherscanUrl = `https://sepolia.etherscan.io/tx/${txHash}`

  // ── Confetti canvas ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const colors = [palette[0], palette[1], '#12D8FA', '#43E97B', '#F7971E', '#ffffff']
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
    }))

    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()

        p.x += p.vx
        p.y += p.vy
        p.rotation += p.spin
        if (p.y > canvas.height) {
          p.y = -10
          p.x = Math.random() * canvas.width
        }
      })
      raf = requestAnimationFrame(draw)
    }
    draw()

    // Stop confetti after 5 seconds
    const stop = setTimeout(() => cancelAnimationFrame(raf), 5000)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(stop)
    }
  }, [palette])

  return (
    <div className="relative w-full max-w-2xl mx-auto space-y-6">
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ borderRadius: '16px' }}
      />

      {/* ── Success header ── */}
      <motion.div
        className="text-center relative z-20"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-2">
          <span className="gradient-text">NFT Minted!</span>
        </h2>
        <p className="text-muted">
          Token <span className="font-bold text-text">#{tokenId}</span> is now permanently on the Ethereum Sepolia blockchain.
        </p>
      </motion.div>

      {/* ── NFT preview card ── */}
      <motion.div
        className="relative z-20 mx-auto rounded-2xl p-0.5"
        style={{ background: gradientBorder, maxWidth: '380px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring' }}
      >
        <div className="bg-surface rounded-2xl overflow-hidden">
          {result?.animation_url ? (
            <img
              src={result.animation_url}
              alt="Minted NFT"
              className="w-full aspect-square object-cover"
            />
          ) : (
            <div
              className="w-full aspect-square flex items-center justify-center text-5xl"
              style={{ background: `linear-gradient(135deg, ${palette[0]}22, ${palette[1]}22)` }}
            >
              🎨
            </div>
          )}
          {/* Token ID badge */}
          <div
            className="absolute top-3 right-3 text-xs font-bold text-white px-3 py-1 rounded-full"
            style={{ background: gradientBorder }}
          >
            #{tokenId}
          </div>
        </div>
      </motion.div>

      {/* ── Transaction info ── */}
      <motion.div
        className="glass-card p-5 space-y-4 relative z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <p className="text-xs text-muted uppercase tracking-widest font-medium">Transaction Details</p>

        <div className="space-y-3">
          <InfoRow label="Token ID" value={`#${tokenId}`} accent />
          <InfoRow label="Network" value="Ethereum Sepolia" />
          <InfoRow
            label="Transaction Hash"
            value={`${txHash?.slice(0, 14)}…${txHash?.slice(-8)}`}
            href={etherscanUrl}
            linkLabel="Etherscan ↗"
          />
          <InfoRow
            label="Contract"
            value={`${CONTRACT_ADDRESS?.slice(0, 10)}…${CONTRACT_ADDRESS?.slice(-6)}`}
          />
        </div>
      </motion.div>

      {/* ── External links ── */}
      <motion.div
        className="grid grid-cols-2 gap-3 relative z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <a
          id="etherscan-link"
          href={etherscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card flex flex-col items-center justify-center gap-2 py-4 px-3 text-center hover:border-primary/40 transition-all duration-200 hover:shadow-glow-primary group"
        >
          <span className="text-2xl">🔍</span>
          <div>
            <p className="text-sm font-semibold text-text group-hover:text-primary transition-colors">Etherscan</p>
            <p className="text-xs text-muted">View transaction</p>
          </div>
        </a>

        <Link
          id="gallery-token-link"
          to={`/gallery/token/${tokenId}`}
          className="glass-card flex flex-col items-center justify-center gap-2 py-4 px-3 text-center hover:border-secondary/40 transition-all duration-200 hover:shadow-glow-secondary group"
        >
          <span className="text-2xl">🎨</span>
          <div>
            <p className="text-sm font-semibold text-text group-hover:text-secondary transition-colors">NFT Gallery</p>
            <p className="text-xs text-muted">View in SoundMint</p>
          </div>
        </Link>
      </motion.div>

      {/* ── Mint another CTA ── */}
      <motion.div
        className="text-center relative z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <button
          id="mint-another-btn"
          onClick={onReset}
          className="text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-glow-primary"
          style={{ background: gradientBorder }}
        >
          🎵 Mint Another Track
        </button>
        <p className="text-muted text-xs mt-3">
          Your NFT is now ready to be viewed in the gallery.
        </p>
      </motion.div>
    </div>
  )
}

// ── Small helper component ─────────────────────────────────────────────────
function InfoRow({ label, value, href, linkLabel, accent }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-muted text-sm flex-shrink-0">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold ${accent ? 'gradient-text' : 'text-text'}`}>
          {value}
        </span>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-primary hover:text-secondary transition-colors mt-0.5"
          >
            {linkLabel}
          </a>
        )}
      </div>
    </div>
  )
}
