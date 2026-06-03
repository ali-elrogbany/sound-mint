const SHAPE_EMOJI = { circles: '⭕', polygons: '⬡', triangles: '🔺' }
const BPM_COLOR = { Slow: 'text-secondary', Moderate: 'text-primary', Fast: 'text-yellow-400', Hyperspeed: 'text-error' }
const ENERGY_COLOR = { low: 'text-muted', medium: 'text-secondary', high: 'text-success' }

export default function TraitsBadge({ traits }) {
  if (!traits) return null
  const { bpm_label, energy_label, key_name, bpm_rounded } = traits.display || {}
  const { shape } = traits.visual_traits || {}
  const palette = traits.visual_traits?.color_palette || ['#A044FF', '#12D8FA']

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {/* Key */}
      {key_name && (
        <Badge icon="🎼" label={`Key: ${key_name}`} />
      )}

      {/* BPM */}
      {bpm_rounded && (
        <Badge
          icon="🥁"
          label={`${bpm_rounded} BPM`}
          subLabel={bpm_label}
          valueClass={BPM_COLOR[bpm_label] || 'text-text'}
        />
      )}

      {/* Energy */}
      {energy_label && (
        <Badge
          icon="⚡"
          label="Energy"
          subLabel={energy_label}
          valueClass={ENERGY_COLOR[energy_label] || 'text-text'}
        />
      )}

      {/* Shape */}
      {shape && (
        <Badge
          icon={SHAPE_EMOJI[shape] || '🔷'}
          label={`Shape: ${shape}`}
        />
      )}

      {/* Color Palette */}
      {palette && (
        <div className="flex items-center gap-1.5 bg-surface border border-white/10 rounded-full px-3 py-1.5">
          {palette.map((c) => (
            <span
              key={c}
              className="w-3 h-3 rounded-full border border-white/20"
              style={{ background: c }}
              title={c}
            />
          ))}
          <span className="text-xs text-muted ml-1">Palette</span>
        </div>
      )}
    </div>
  )
}

function Badge({ icon, label, subLabel, valueClass = 'text-text' }) {
  return (
    <div className="flex items-center gap-1.5 bg-surface border border-white/10 rounded-full px-3 py-1.5">
      <span className="text-sm">{icon}</span>
      <span className={`text-xs font-medium ${valueClass}`}>{label}</span>
      {subLabel && (
        <span className="text-xs text-muted capitalize">· {subLabel}</span>
      )}
    </div>
  )
}
