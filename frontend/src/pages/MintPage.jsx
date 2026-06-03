import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import StepIndicator from '../components/StepIndicator'
import DropZone from '../components/DropZone'
import WaveformPlayer from '../components/WaveformPlayer'
import AnalyzingScreen from '../components/AnalyzingScreen'
import NFTPreviewCard from '../components/NFTPreviewCard'

// Steps: 1=Upload, 2=Analyzing, 3=Preview, 4=Mint(stub), 5=Done(stub)
export default function MintPage() {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileAccepted = (uploadedFile, newSessionId) => {
    setFile(uploadedFile)
    setSessionId(newSessionId)
    setError(null)
    setStep(2) // Move to analyzing step
  }

  const handleAnalysisComplete = (pipelineResult) => {
    setResult(pipelineResult)
    setStep(3) // Move to preview
  }

  const handleError = (msg) => {
    setError(msg)
    setStep(1) // Return to upload on error
  }

  const handleRegenerate = () => {
    setStep(1)
    setFile(null)
    setSessionId(null)
    setResult(null)
    setError(null)
  }

  const handleProceedToMint = () => {
    setStep(4) // Stub — Epic 4 (wallet integration)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link to="/" className="font-bold text-xl gradient-text tracking-tight hover:opacity-80 transition-opacity">
          ← SoundMint
        </Link>
        {/* Wallet button placeholder — Epic 4 */}
        <button
          disabled
          className="text-muted border border-white/10 rounded-full px-4 py-2 text-sm cursor-not-allowed"
        >
          Connect Wallet
        </button>
      </nav>

      {/* ── Step Indicator ── */}
      <div className="px-6 pt-8 pb-4 max-w-3xl mx-auto w-full">
        <StepIndicator currentStep={step} />
      </div>

      {/* ── Step Content ── */}
      <main className="flex-1 flex flex-col items-center px-6 pb-12">
        <AnimatePresence mode="wait">
          {/* Step 1 — Upload */}
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
                  <button onClick={() => setError(null)} className="ml-auto text-error/60 hover:text-error text-lg">×</button>
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

          {/* Step 2 — Analyzing */}
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

          {/* Step 3 — Preview */}
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
                <p className="text-muted">Your song's acoustic DNA has been transformed into unique generative art.</p>
              </div>
              <NFTPreviewCard
                result={result}
                onRegenerate={handleRegenerate}
                onMint={handleProceedToMint}
              />
            </motion.div>
          )}

          {/* Step 4 — Mint stub */}
          {step === 4 && (
            <motion.div
              key="mint-stub"
              className="w-full max-w-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-10 text-center">
                <div className="text-5xl mb-4">🔗</div>
                <h2 className="text-2xl font-bold mb-3">Wallet & Minting</h2>
                <p className="text-muted mb-6">
                  Wallet integration and minting flow will be implemented in Epic 4.<br />
                  Connect MetaMask to sign the transaction on Ethereum Sepolia.
                </p>
                <button
                  onClick={handleRegenerate}
                  className="text-primary border border-primary/30 hover:border-primary/60 rounded-full px-6 py-2 text-sm transition-all duration-200"
                >
                  ← Back to Preview
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
