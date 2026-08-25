import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { useState } from 'react'

export default function WaveformPlayer({ file }) {
  const containerRef = useRef(null)
  const wavesurferRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const PREVIEW_CAP_SECONDS = 30

  useEffect(() => {
    if (!containerRef.current || !file) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(160, 68, 255, 0.5)',
      progressColor: '#A044FF',
      cursorColor: '#12D8FA',
      barWidth: 2,
      barRadius: 2,
      barGap: 1,
      height: 64,
      normalize: true,
      backend: 'WebAudio',
    })

    ws.loadBlob(file)

    ws.on('ready', () => {
      setDuration(Math.min(ws.getDuration(), PREVIEW_CAP_SECONDS))
    })

    ws.on('timeupdate', (t) => {
      setCurrentTime(t)
      // Enforce 30s preview cap
      if (t >= PREVIEW_CAP_SECONDS) {
        ws.pause()
        ws.seekTo(0)
        setPlaying(false)
        setCurrentTime(0)
      }
    })

    ws.on('finish', () => setPlaying(false))

    wavesurferRef.current = ws

    return () => {
      ws.destroy()
      wavesurferRef.current = null
    }
  }, [file])

  const togglePlay = () => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.playPause()
    setPlaying(p => !p)
  }

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">🎵</span>
        <span className="text-sm font-medium text-text truncate max-w-xs">{file.name}</span>
        <span className="text-xs text-muted ml-auto">Preview (30s cap)</span>
      </div>

      {/* Waveform */}
      <div ref={containerRef} className="w-full mb-4 rounded-lg overflow-hidden" />

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          id="waveform-play-pause"
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center text-white transition-all duration-200 hover:shadow-glow-primary shrink-0"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div className="flex-1 flex items-center justify-between text-xs text-muted">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  )
}
