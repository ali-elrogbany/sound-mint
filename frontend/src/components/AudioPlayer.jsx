import { useState, useRef, useEffect } from 'react';
import { ipfsToHttp } from '../lib/constants';

/**
 * AudioPlayer — A premium audio player for SoundMint NFTs.
 *
 * Props:
 *  - audioUrl  {string}   — IPFS or HTTP URL of the original MP3
 *  - trackName {string}   — Display name (e.g. "SoundMint #42")
 *  - palette   {string[]} — [primary, secondary] colors for accent styling
 */
export default function AudioPlayer({ audioUrl, trackName = 'Original Track', palette = ['#A044FF', '#12D8FA'] }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const audioRef = useRef(null);
    const progressBarRef = useRef(null);

    const httpUrl = ipfsToHttp(audioUrl);
    const gradient = `linear-gradient(90deg, ${palette[0]}, ${palette[1]})`;

    // ── Audio event handlers ────────────────────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };
        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
        };
        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
            audio.currentTime = 0;
        };
        const onCanPlay = () => setIsLoading(false);
        const onError = () => {
            setIsLoading(false);
            setError(true);
        };

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
        };
    }, []);

    // Sync volume changes
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    // ── Controls ────────────────────────────────────────────────────────────
    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;
        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                await audio.play();
                setIsPlaying(true);
            }
        } catch {
            setError(true);
        }
    };

    const handleProgressClick = (e) => {
        const bar = progressBarRef.current;
        const audio = audioRef.current;
        if (!bar || !audio || !duration) return;
        const rect = bar.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audio.currentTime = ratio * duration;
    };

    // ── Helpers ─────────────────────────────────────────────────────────────
    const formatTime = (secs) => {
        if (!secs || isNaN(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (error) return null; // Silently hide if audio fails to load

    return (
        <div
            className="rounded-2xl border border-white/10 p-4 space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
        >
            {/* Hidden audio element */}
            <audio ref={audioRef} src={httpUrl} preload="metadata" />

            {/* Track header */}
            <div className="flex items-center gap-3">
                {/* Animated music icon */}
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: gradient }}
                >
                    {isLoading ? (
                        <span className="text-white animate-spin">⟳</span>
                    ) : isPlaying ? (
                        <span className="text-white" style={{ animation: 'pulse 1s infinite' }}>♫</span>
                    ) : (
                        <span className="text-white">♪</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{trackName}</p>
                    <p className="text-xs text-muted">Original Track · MP3</p>
                </div>
                {/* Volume control */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-muted text-xs">
                        {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                    </span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-16 h-1 rounded-full accent-primary cursor-pointer"
                        style={{ accentColor: palette[0] }}
                        aria-label="Volume"
                    />
                </div>
            </div>

            {/* Progress bar + time */}
            <div className="space-y-1">
                <div
                    ref={progressBarRef}
                    onClick={handleProgressClick}
                    className="relative w-full h-2 bg-white/10 rounded-full cursor-pointer group overflow-hidden"
                    role="slider"
                    aria-label="Playback progress"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    {/* Filled progress */}
                    <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-100"
                        style={{ width: `${progress}%`, background: gradient }}
                    />
                    {/* Thumb */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ left: `calc(${progress}% - 6px)` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-muted font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Play/Pause button */}
            <div className="flex justify-center">
                <button
                    id="audio-player-toggle"
                    onClick={togglePlay}
                    disabled={isLoading}
                    aria-label={isPlaying ? 'Pause' : 'Play original track'}
                    className="flex items-center gap-2.5 font-bold py-2.5 px-7 rounded-xl text-white text-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: gradient, boxShadow: isPlaying ? `0 0 20px ${palette[0]}66` : 'none' }}
                >
                    {isLoading ? (
                        <>
                            <span className="animate-spin">⟳</span>
                            <span>Loading…</span>
                        </>
                    ) : isPlaying ? (
                        <>
                            <PauseIcon />
                            <span>Pause</span>
                        </>
                    ) : (
                        <>
                            <PlayIcon />
                            <span>Play Original Track</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function PlayIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
        </svg>
    );
}

function PauseIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
    );
}
