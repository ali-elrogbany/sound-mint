import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const features = [
  {
    icon: '🎵',
    title: 'Upload Any Track',
    desc: 'Drop your MP3 and let our acoustic engine analyze BPM, energy, key, and timbre.',
  },
  {
    icon: '🎨',
    title: 'Algorithmic Art',
    desc: 'Your sound\'s DNA transforms into a unique animated visual — no two songs generate the same art.',
  },
  {
    icon: '⛓️',
    title: 'Mint on Blockchain',
    desc: 'Permanently record your music-driven NFT on Ethereum Sepolia testnet with on-chain audio traits.',
  },
]

const SoundwaveLoader = () => (
  <div className="flex items-end gap-1 h-8">
    {[1, 2, 3, 4, 5].map(i => (
      <span
        key={i}
        className="soundwave-bar"
        style={{ height: `${[60, 100, 75, 100, 55][i - 1]}%`, animationDelay: `${(i - 1) * 0.15}s` }}
      />
    ))}
  </div>
)

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <SoundwaveLoader />
          <span className="font-bold text-xl tracking-tight gradient-text ml-2">SoundMint</span>
        </div>
        <Link
          to="/mint"
          className="bg-primary hover:bg-primary/80 text-white font-semibold px-5 py-2 rounded-full text-sm transition-all duration-200 hover:shadow-glow-primary"
        >
          Start Minting
        </Link>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live on Ethereum Sepolia Testnet
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            Every song has a<br />
            <span className="gradient-text">visual soul.</span>
          </h1>

          <p className="text-muted text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Upload an MP3. We analyze its acoustic DNA and generate a one-of-a-kind animated NFT — then mint it to the blockchain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/mint"
              className="group relative inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-glow-primary"
            >
              <span>🎵</span>
              <span>Mint Your Track</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </motion.div>

        {/* ── Feature Cards ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass-card p-6 text-left hover:border-primary/40 transition-all duration-300 hover:shadow-glow-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Pipeline Overview ── */}
        <motion.div
          className="mt-20 flex flex-col sm:flex-row items-center gap-3 text-muted text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {['Upload MP3', 'Analyze Audio', 'Generate Art', 'Pin to IPFS', 'Mint NFT'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-3">
              <span className="bg-surface border border-white/10 rounded-full px-3 py-1">{step}</span>
              {i < arr.length - 1 && <span className="text-primary">→</span>}
            </div>
          ))}
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-6 text-center text-muted text-xs">
        SoundMint MVP — Sepolia Testnet Only &nbsp;·&nbsp; Not for mainnet use
      </footer>
    </div>
  )
}
