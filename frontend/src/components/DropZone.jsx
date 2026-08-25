import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { usePublicClient } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract.js'

const MAX_SIZE_BYTES = 25 * 1024 * 1024

function validateFile(file) {
  if (!file) return 'No file selected.'
  if (file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) {
    return 'Only MP3 files are supported. Please select an .mp3 file.'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 25 MB.`
  }
  return null
}

export default function DropZone({ onFileAccepted, onError }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState(null)
  const publicClient = usePublicClient()

  const handleUpload = useCallback(async (file) => {
    const validationError = validateFile(file)
    if (validationError) {
      onError(validationError)
      return
    }

    setUploading(true)
    setProgress(0)
    setUploadedFile(file)

    const formData = new FormData()
    formData.append('file', file)

    let tokenId = 1
    try {
      if (publicClient && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        let low = 1
        let high = 100000
        let candidate = 1
        while (low <= high) {
          const mid = Math.floor((low + high) / 2)
          try {
            const uri = await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: CONTRACT_ABI,
              functionName: 'tokenURIs',
              args: [BigInt(mid)],
            })
            if (uri && uri !== '') {
              low = mid + 1
            } else {
              candidate = mid
              high = mid - 1
            }
          } catch {
            candidate = mid
            high = mid - 1
          }
        }
        tokenId = candidate
      }
    } catch (e) {
      console.warn('Failed to fetch next tokenId from contract, defaulting to 1', e)
    }

    formData.append('token_id', tokenId)

    try {
      const response = await axios.post('/v1/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      onFileAccepted(file, response.data.session_id)
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.'
      onError(msg)
      setUploading(false)
      setUploadedFile(null)
    }
  }, [onFileAccepted, onError, publicClient])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)
  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div
      id="drop-zone"
      className={`drop-zone cursor-pointer relative overflow-hidden ${dragging ? 'drag-over' : ''}`}
      onClick={() => !uploading && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,.mp3"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="p-12 flex flex-col items-center justify-center gap-4 text-center min-h-[260px]">
        {!uploading && !uploadedFile && (
          <>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="text-6xl"
            >
              🎵
            </motion.div>
            <div>
              <p className="font-bold text-lg text-text">Drop your MP3 here</p>
              <p className="text-muted text-sm mt-1">or click to browse files</p>
            </div>
            <div className="flex gap-4 text-xs text-muted mt-2">
              <span className="bg-surface border border-white/10 rounded-full px-3 py-1">MP3 only</span>
              <span className="bg-surface border border-white/10 rounded-full px-3 py-1">Max 25 MB</span>
            </div>
          </>
        )}

        {uploading && (
          <div className="w-full space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div className="text-left">
                <p className="font-medium text-sm text-text truncate max-w-xs">{uploadedFile?.name}</p>
                <p className="text-muted text-xs">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #A044FF, #12D8FA)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-primary text-sm font-medium">
              {progress < 100 ? `Uploading… ${progress}%` : '✓ Upload complete — starting analysis…'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
