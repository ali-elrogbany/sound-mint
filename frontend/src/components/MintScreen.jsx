import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther, decodeEventLog } from 'viem'
import { sepolia } from 'wagmi/chains'
import WalletButton from './WalletButton'
import TxToast from './TxToast'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract.js'

/**
 * MintScreen — Step 4 of the minting flow
 *
 * Props:
 *  - result     {object}   — pipeline result from backend (has token_uri, on_chain_traits, animation_url)
 *  - onSuccess  {function} — called with (txHash, tokenId) on successful mint
 *  - onError    {function} — called with (message) on error
 *  - onBack     {function} — navigate back to preview (step 3)
 */
export default function MintScreen({ result, onSuccess, onError, onBack }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const isOnSepolia = chainId === sepolia.id
  const canMint = isConnected && isOnSepolia

  const [toast, setToast] = useState({ show: false, type: 'pending', title: '', message: '', txHash: '' })
  const [mintedTokenId, setMintedTokenId] = useState(null)

  // ── Read mint price from contract ─────────────────────────────────────────
  const { data: mintPriceWei } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'mintPrice',
    query: { enabled: CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' },
  })

  const mintPriceEth = mintPriceWei ? formatEther(mintPriceWei) : '0.01'

  // ── Write: mint() ─────────────────────────────────────────────────────────
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // ── React to confirmed receipt (wagmi v2: no onSuccess in hook config) ────
  const handledRef = useRef(false)
  useEffect(() => {
    if (!isConfirmed || !receipt || handledRef.current) return
    handledRef.current = true

    // Try to decode the Minted event to get tokenId
    let tokenId = '?'
    try {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: CONTRACT_ABI,
            data: log.data,
            topics: log.topics,
            eventName: 'Minted',
          })
          tokenId = decoded.args.tokenId.toString()
          break
        } catch {
          // Not the Minted event — try next log
        }
      }
    } catch { /* ignore */ }

    setMintedTokenId(tokenId)
    setToast({
      show: true,
      type: 'success',
      title: 'NFT Minted! 🎉',
      message: tokenId !== '?' ? `Token #${tokenId} is now on Sepolia.` : 'Transaction confirmed on Sepolia.',
      txHash: receipt.transactionHash,
    })
    onSuccess?.(receipt.transactionHash, tokenId)
  }, [isConfirmed, receipt, onSuccess])

  // ── Handle mint click ─────────────────────────────────────────────────────
  const handleMint = useCallback(() => {
    if (!result) return

    const traits = result.on_chain_traits || {}

    // Derive a genre label from audio traits for the on-chain genre field
    const genreLabel = deriveGenre(result.audio_traits)

    setToast({
      show: true,
      type: 'pending',
      title: 'Confirm in MetaMask…',
      message: 'Please approve the transaction in your wallet.',
    })

    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'mint',
        args: [
          address,
          result.token_uri || '',
          {
            bpm: Math.round(traits.bpm || 0),           // uint16
            dominantKey: traits.dominantKey ?? 0,        // uint8
            energyLevel: traits.energyLevel ?? 0,        // uint8 (0-255)
            brightness: traits.brightness ?? 0,           // uint8 (0-255)
            genre: genreLabel,                            // string
          },
        ],
        value: mintPriceWei ?? parseEther('0.01'),
      },
      {
        onError: (err) => {
          const msg = err?.shortMessage || err?.message || 'Transaction rejected'
          setToast({
            show: true,
            type: 'error',
            title: 'Mint Failed',
            message: msg,
          })
        },
      }
    )
  }, [address, result, mintPriceWei, writeContract])

  // ── Derived UI state ──────────────────────────────────────────────────────
  const isBusy = isWritePending || isConfirming
  const isContractPlaceholder = CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000'

  const buttonLabel = () => {
    if (!isConnected) return '🦊 Connect Wallet to Mint'
    if (!isOnSepolia) return '⚠ Switch to Sepolia'
    if (isWritePending) return 'Confirm in MetaMask…'
    if (isConfirming) return 'Mining Transaction…'
    if (isConfirmed) return '✓ Minted!'
    return `Mint NFT — ${mintPriceEth} ETH`
  }

  // Derive a human-readable genre string from audio features
  // (The actual contract field is a free-form string)
  const deriveGenre = (audioTraits) => {
    if (!audioTraits?.display) return 'Unknown'
    const energy = audioTraits.display.energy_label || 'medium'
    const bpm = audioTraits.display.bpm_rounded || 120
    if (bpm > 140 && energy === 'high')  return 'Electronic'
    if (bpm > 120 && energy !== 'low')   return 'Pop'
    if (bpm < 80  && energy === 'low')   return 'Ambient'
    if (energy === 'high')               return 'Rock'
    return 'Mixed'
  }

  const palette = result?.visual_traits?.color_palette || ['#A044FF', '#12D8FA']
  const gradientBorder = `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Mint Your NFT</h2>
        <p className="text-muted">Connect your MetaMask wallet and pay the mint fee to record your NFT on Sepolia.</p>
      </div>

      {/* ── Contract placeholder warning ── */}
      {isContractPlaceholder && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-300 text-sm"
        >
          <p className="font-semibold mb-1">⚠ Contract not yet deployed</p>
          <p className="text-yellow-300/70 text-xs">
            Deploy <code className="font-mono bg-yellow-500/10 px-1 rounded">contracts/SoundMint.sol</code> via Remix IDE,
            then update <code className="font-mono bg-yellow-500/10 px-1 rounded">CONTRACT_ADDRESS</code> in{' '}
            <code className="font-mono bg-yellow-500/10 px-1 rounded">src/config/contract.js</code>.
          </p>
        </motion.div>
      )}

      {/* ── Wallet panel ── */}
      <motion.div
        className="glass-card p-5 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Wallet</p>
            <p className="text-xs text-muted mt-0.5">
              {isConnected
                ? isOnSepolia
                  ? 'Connected on Sepolia Testnet ✓'
                  : 'Wrong network — please switch to Sepolia'
                : 'Connect MetaMask to continue'}
            </p>
          </div>
          <WalletButton />
        </div>
      </motion.div>

      {/* ── Mint summary card ── */}
      <motion.div
        className="glass-card p-5 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-xs text-muted uppercase tracking-widest font-medium">Mint Summary</p>

        {/* NFT thumbnail */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 p-0.5"
            style={{ background: gradientBorder }}
          >
            <div className="w-full h-full rounded-[10px] overflow-hidden bg-surface">
              {result?.animation_url ? (
                <img
                  src={result.animation_url}
                  alt="NFT preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🎨</div>
              )}
            </div>
          </div>
          <div>
            <p className="font-semibold text-text">SoundMint NFT</p>
            <p className="text-xs text-muted mt-0.5">
              {result?.audio_traits?.display?.key_name
                ? `Key: ${result.audio_traits.display.key_name} · BPM: ${result.audio_traits.display.bpm_rounded}`
                : 'Generative Audio NFT'}
            </p>
          </div>
        </div>

        {/* Fee breakdown */}
        <div className="space-y-2 pt-3 border-t border-white/5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Mint fee</span>
            <span className="font-semibold text-text">{mintPriceEth} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Network</span>
            <span className="font-semibold text-text">Ethereum Sepolia</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Gas</span>
            <span className="text-muted text-xs">Estimated by MetaMask</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-white/5 font-bold">
            <span className="text-text">You pay (approx.)</span>
            <span className="gradient-text">{mintPriceEth} ETH + gas</span>
          </div>
        </div>
      </motion.div>

      {/* ── TX hash (while mining) ── */}
      {txHash && !isConfirmed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-4 flex items-center gap-3"
        >
          <span className="text-primary animate-spin text-lg">⟳</span>
          <div>
            <p className="text-sm font-semibold">Transaction submitted</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-secondary transition-colors"
            >
              {txHash.slice(0, 16)}…{txHash.slice(-8)} ↗
            </a>
          </div>
        </motion.div>
      )}

      {/* ── CTA Buttons ── */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          id="back-to-preview-btn"
          onClick={onBack}
          disabled={isBusy}
          className="border border-white/20 hover:border-white/40 text-text font-semibold py-3 px-5 rounded-xl transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Preview
        </button>

        <button
          id="mint-nft-btn"
          onClick={handleMint}
          disabled={!canMint || isBusy || isConfirmed || isContractPlaceholder}
          className="flex-1 relative text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
          style={{
            background: canMint && !isBusy && !isConfirmed ? gradientBorder : undefined,
            backgroundColor: (!canMint || isBusy || isConfirmed) ? '#333' : undefined,
          }}
        >
          {/* Shimmer effect when idle + ready */}
          {canMint && !isBusy && !isConfirmed && (
            <span
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
              }}
            />
          )}
          {/* Spinner while busy */}
          {isBusy && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 animate-spin">⟳</span>
          )}
          {buttonLabel()}
        </button>
      </motion.div>

      {/* ── IPFS / token URI info ── */}
      {result?.token_uri && (
        <p className="text-center text-muted text-xs leading-relaxed">
          Metadata pinned to IPFS:{' '}
          <a
            href={`https://gateway.pinata.cloud/ipfs/${result.metadata_cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-secondary transition-colors"
          >
            {result.token_uri?.slice(0, 30)}… ↗
          </a>
        </p>
      )}

      {/* ── Toast ── */}
      <TxToast
        {...toast}
        onDismiss={() => setToast((t) => ({ ...t, show: false }))}
      />
    </div>
  )
}
