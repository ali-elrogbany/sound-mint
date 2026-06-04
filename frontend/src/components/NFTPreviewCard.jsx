import { motion } from 'framer-motion'
import TraitsBadge from './TraitsBadge'

export default function NFTPreviewCard({ result, customName, onNameChange, onRegenerate, onMint }) {
  const { animation_url, audio_traits, visual_traits, file_name } = result || {}

  // Merge audio + visual traits for badge display
  const mergedTraits = {
    display: audio_traits?.display,
    visual_traits: visual_traits,
  }

  const palette = visual_traits?.color_palette || ['#A044FF', '#12D8FA']
  const gradientBorder = `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`

  return (
    <div className="space-y-6">
      {/* NFT Preview with gradient border */}
      <motion.div
        className="relative mx-auto rounded-2xl p-0.5"
        style={{ background: gradientBorder, maxWidth: '420px' }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <div className="bg-surface rounded-2xl overflow-hidden position-relative">
          {animation_url ? (
            <img
              src={animation_url}
              alt="Generated NFT animation"
              className="w-full aspect-square object-cover"
              style={{ display: 'block' }}
            />
          ) : (
            <div
              className="w-full aspect-square flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${palette[0]}22, ${palette[1]}22)` }}
            >
              <div className="text-center space-y-2">
                <div className="text-5xl">🎨</div>
                <p className="text-muted text-sm">Animation generated on server</p>
              </div>
            </div>
          )}

          {/* Overlay badge */}
          <div className="absolute top-3 right-3">
            <div
              className="text-xs font-bold text-white px-3 py-1 rounded-full"
              style={{ background: gradientBorder }}
            >
              SOUNDMINT
            </div>
          </div>
        </div>
      </motion.div>

      <div className="text-center">
        <p className="text-muted text-sm">Generated from</p>
        <p className="font-semibold text-text truncate mb-4">{file_name || 'your track'}</p>
        
        <div className="max-w-xs mx-auto text-left">
          <label className="block text-sm font-semibold text-white/90 mb-1 flex justify-between">
            <span>Name your NFT</span>
            <span className="text-muted font-normal text-xs mt-0.5">✏️ Optional</span>
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => onNameChange(e.target.value.slice(0, 50))}
            placeholder="e.g. SoundMint #1"
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <div className="flex justify-between items-start mt-1.5 px-1">
            <p className="text-[10px] text-muted/80 leading-tight flex-1 pr-2">
              This name is permanently stored on IPFS. It cannot be changed after minting.
            </p>
            <span className="text-[10px] text-muted/60 font-mono mt-0.5 whitespace-nowrap">
              {customName.length}/50
            </span>
          </div>
        </div>
      </div>

      {/* Trait badges */}
      <motion.div
        className="glass-card p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs text-muted uppercase tracking-widest font-medium mb-4 text-center">
          Acoustic DNA
        </p>
        <TraitsBadge traits={mergedTraits} />

        {/* Extra numeric traits */}
        {visual_traits && (
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/5">
            <StatBox label="Particles" value={visual_traits.particle_count?.toLocaleString()} />
            <StatBox label="Anim Speed" value={`${visual_traits.animation_speed}×`} />
            <StatBox label="Glow" value={`${visual_traits.glow_intensity?.toFixed(1)}px`} />
          </div>
        )}
      </motion.div>

      {/* CTAs */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          id="regenerate-btn"
          onClick={onRegenerate}
          className="flex-1 border border-white/20 hover:border-white/40 text-text font-semibold py-3 rounded-xl transition-all duration-200 text-sm"
        >
          ↩ Regenerate
        </button>
        <button
          id="mint-btn"
          onClick={onMint}
          className="flex-2 flex-grow-[2] text-white font-bold py-3 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-glow-primary text-sm"
          style={{ background: gradientBorder }}
        >
          Mint NFT →
        </button>
      </motion.div>

      <p className="text-center text-muted text-xs">
        Minting requires connecting your MetaMask wallet on Sepolia testnet.
      </p>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold gradient-text">{value || '—'}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  )
}
