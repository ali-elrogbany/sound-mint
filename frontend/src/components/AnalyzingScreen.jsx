import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const STAGES = ['UPLOADED', 'ANALYZED', 'GENERATING_NFT', 'PINNING', 'READY']
const STAGE_LABELS = {
  UPLOADED: 'File received',
  ANALYZED: 'Audio analyzed',
  GENERATING_NFT: 'Generating your NFT art…',
  PINNING: 'Pinning to IPFS…',
  READY: 'Ready!',
}

const SoundwaveBars = () => (
  <div className="flex items-end gap-1 h-12 justify-center">
    {[0.6, 1.0, 0.75, 1.0, 0.55, 0.8, 0.45].map((h, i) => (
      <div
        key={i}
        className="soundwave-bar"
        style={{ height: `${h * 100}%`, animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
)

export default function AnalyzingScreen({ sessionId, fileName, onComplete, onError }) {
  const intervalRef = useRef(null)
  const maxPolls = 120 // 4 minutes max (2s interval)
  const pollCount = useRef(0)

  const fetchResult = useCallback(async (sid) => {
    const { data } = await axios.get(`/v1/result/${sid}`)
    return data
  }, [])

  const poll = useCallback(async () => {
    if (!sessionId) return
    pollCount.current++

    if (pollCount.current > maxPolls) {
      clearInterval(intervalRef.current)
      onError('Pipeline timed out. Please try again.')
      return
    }

    try {
      const { data } = await axios.get(`/v1/status/${sessionId}`)

      if (data.status === 'failed') {
        clearInterval(intervalRef.current)
        onError(data.error || 'Pipeline failed.')
        return
      }

      if (data.status === 'ready' || data.stage === 'READY') {
        clearInterval(intervalRef.current)
        const result = await fetchResult(sessionId)
        onComplete(result)
        return
      }
    } catch (err) {
      if (err.response?.status !== 202) {
        // 202 = still processing, that's fine
        console.warn('Polling error:', err.message)
      }
    }
  }, [sessionId, onComplete, onError, fetchResult])

  useEffect(() => {
    if (!sessionId) return
    pollCount.current = 0
    poll() // immediate first poll
    intervalRef.current = setInterval(poll, 2000)
    return () => clearInterval(intervalRef.current)
  }, [sessionId, poll])

  return (
    <div className="glass-card p-10 flex flex-col items-center text-center gap-6 min-h-[400px] justify-center">
      <SoundwaveBars />

      <div>
        <h2 className="text-2xl font-bold mb-2">Analyzing Your Track</h2>
        <p className="text-muted text-sm max-w-sm">
          {fileName && <span className="text-text font-medium">"{fileName}"</span>}
          {' '}—  extracting BPM, musical key, energy, and timbre…
        </p>
      </div>

      {/* Stage progress */}
      <div className="w-full max-w-sm space-y-2">
        {STAGES.filter(s => s !== 'READY').map((stage, i) => (
          <motion.div
            key={stage}
            className="flex items-center gap-3 text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
          >
            <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse shrink-0" />
            <span className="text-muted">{STAGE_LABELS[stage]}</span>
          </motion.div>
        ))}
      </div>

      <p className="text-muted text-xs mt-4">
        This takes up to 90 seconds. Please stay on this page.
      </p>
    </div>
  )
}
