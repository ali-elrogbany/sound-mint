import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import StepIndicator from '../components/StepIndicator'
import DropZone from '../components/DropZone'
import WaveformPlayer from '../components/WaveformPlayer'
import AnalyzingScreen from '../components/AnalyzingScreen'
import NFTPreviewCard from '../components/NFTPreviewCard'
import MintScreen from '../components/MintScreen'
import SuccessScreen from '../components/SuccessScreen'
import WalletButton from '../components/WalletButton'
import NotificationBell from '../components/NotificationBell'

// Steps: 1=Upload  2=Analyzing  3=Preview  4=Mint  5=Success
export default function MintPage() {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [tokenId, setTokenId] = useState(null)
  const [customName, setCustomName] = useState('')

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileAccepted = (uploadedFile, newSessionId) => {
    setFile(uploadedFile)
    setSessionId(newSessionId)
    setError(null)
    setStep(2)
  }

  const handleAnalysisComplete = (pipelineResult) => {
    setResult(pipelineResult)
    setStep(3)
  }

  const handleError = (msg) => {
    setError(msg)
    setStep(1)
  }

  const handleRegenerate = () => {
    setStep(1)
    setFile(null)
    setSessionId(null)
    setResult(null)
    setError(null)
    setError(null)
    setTxHash(null)
    setTokenId(null)
    setCustomName('')
  }

  const handleProceedToMint = () => {
    setStep(4)
  }

  const handleMintSuccess = (hash, id) => {
    setTxHash(hash)
    setTokenId(id)
    setStep(5)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link
          to="/"
          className="font-bold text-xl gradient-text tracking-tight hover:opacity-80 transition-opacity"
        >
          ← SoundMint
        </Link>

        {/* Live wallet button — replaces the disabled placeholder */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <WalletButton />
        </div>
      </nav>

      {/* ── Step Indicator ── */}
      <div className="px-6 pt-8 pb-4 max-w-3xl mx-auto w-full">
        <StepIndicator currentStep={step} />
      </div>

      {/* ── Step Content ── */}
      <main className="flex-1 flex flex-col items-center px-6 pb-12">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Upload ── */}
          {step === 1 && (
            <motion.div
              key="upload"
              className="w-full max-w-2xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Upload Your Track</h2>
                <p className="text-muted">MP3 files only · Max 25 MB · Your audio stays private</p>
              </div>

              {/* Error banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-error/10 border border-error/30 rounded-xl p-4 mb-6 text-error text-sm flex items-center gap-3"
                >
                  <span>⚠️</span>
                  <div>
                    <p className="font-medium">Something went wrong</p>
                    <p className="text-error/70 mt-0.5">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-error/60 hover:text-error text-lg"
                  >
                    ×
                  </button>
                </motion.div>
              )}

              <DropZone onFileAccepted={handleFileAccepted} onError={setError} />

              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <WaveformPlayer file={file} />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Step 2: Analyzing ── */}
          {step === 2 && (
            <motion.div
              key="analyzing"
              className="w-full max-w-2xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AnalyzingScreen
                sessionId={sessionId}
                fileName={file?.name}
                onComplete={handleAnalysisComplete}
                onError={handleError}
              />
            </motion.div>
          )}

          {/* ── Step 3: Preview ── */}
          {step === 3 && result && (
            <motion.div
              key="preview"
              className="w-full max-w-2xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Your NFT Preview</h2>
                <p className="text-muted">
                  Your song's acoustic DNA has been transformed into unique generative art.
                </p>
              </div>
              <NFTPreviewCard
                result={result}
                customName={customName}
                onNameChange={setCustomName}
                onRegenerate={handleRegenerate}
                onMint={handleProceedToMint}
              />
            </motion.div>
          )}

          {/* ── Step 4: Mint ── */}
          {step === 4 && result && (
            <motion.div
              key="mint"
              className="w-full max-w-2xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MintScreen
                result={result}
                customName={customName}
                onSuccess={handleMintSuccess}
                onError={handleError}
                onBack={() => setStep(3)}
              />
            </motion.div>
          )}

          {/* ── Step 5: Success ── */}
          {step === 5 && txHash && (
            <motion.div
              key="success"
              className="w-full max-w-2xl"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SuccessScreen
                txHash={txHash}
                tokenId={tokenId}
                result={result}
                onReset={handleRegenerate}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
