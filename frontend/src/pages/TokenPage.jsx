import { useParams, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { CONTRACT_ADDRESS } from '../config/contract';
import { KEY_NAMES, energyLabel, bpmLabel, brightnessLabel, ipfsToHttp } from '../lib/constants';
import WalletButton from '../components/WalletButton';
import { useTokenData } from '../hooks/useTokenData';
import TraitsBadge from '../components/TraitsBadge';
import { useState } from 'react';

export default function TokenPage() {
    const { tokenId } = useParams();
    const { tokenDetail, metadata, txHash, loading, error } = useTokenData(tokenId);
    const [showToast, setShowToast] = useState(false);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
                <div className="animate-spin text-4xl text-primary mb-4">⟳</div>
                <p className="text-muted">Loading token data...</p>
            </div>
        );
    }

    if (error || !tokenDetail) {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
                <p className="text-error text-xl mb-4">Token not found or error loading.</p>
                <Link to="/gallery" className="text-primary hover:underline">← Back to Gallery</Link>
            </div>
        );
    }

    const [uri, traits, owner, minter, timestamp] = tokenDetail;
    const imageUri = metadata?.animation_url || metadata?.image;
    
    // Fallback traits for TraitsBadge compatibility
    const fallbackTraits = {
        display: {
            key_name: KEY_NAMES[traits.dominantKey],
            bpm_rounded: traits.bpm,
            bpm_label: bpmLabel(traits.bpm),
            energy_label: energyLabel(traits.energyLevel).toLowerCase()
        },
        visual_traits: {
            shape: metadata?.attributes?.find(a => a.trait_type === 'Shape Style')?.value,
            color_palette: [metadata?.background_color ? `#${metadata.background_color}` : '#A044FF', '#12D8FA']
        }
    };

    return (
        <div className="min-h-screen bg-bg flex flex-col">
            {/* ── Nav ── */}
            <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <Link to="/" className="font-bold text-xl gradient-text tracking-tight hover:opacity-80 transition-opacity">
                        SoundMint
                    </Link>
                    <Link to="/mint" className="text-sm font-medium text-muted hover:text-white transition-colors">Mint</Link>
                    <Link to="/gallery" className="text-sm font-medium text-primary">Gallery</Link>
                </div>
                <WalletButton />
            </nav>

            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* ── Left: Image/Animation ── */}
                <div className="flex flex-col gap-6">
                    <div className="w-full aspect-square bg-surface rounded-2xl overflow-hidden border border-white/10 shadow-glow-primary p-1">
                        <div className="w-full h-full bg-black rounded-[14px] overflow-hidden">
                            {imageUri ? (
                                <img src={ipfsToHttp(imageUri)} alt={`Token ${tokenId}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-6xl">🎨</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right: Details ── */}
                <div className="flex flex-col gap-8">
                    <div>
                        <Link to="/gallery" className="text-muted hover:text-white text-sm mb-4 inline-block transition-colors">← Back to Gallery</Link>
                        <h1 className="text-4xl font-black mb-2">{metadata?.name || `SoundMint #${tokenId}`}</h1>
                        <p className="text-muted leading-relaxed">{metadata?.description || 'A unique animated NFT generated from the acoustic DNA of a musical track.'}</p>
                    </div>

                    {/* Traits */}
                    <div>
                        <h3 className="text-sm uppercase tracking-widest font-semibold text-muted mb-4">Acoustic DNA</h3>
                        <div className="flex justify-start">
                            <TraitsBadge traits={fallbackTraits} />
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-sm uppercase tracking-widest font-semibold text-muted mb-2">On-Chain Info</h3>
                        <InfoRow label="Owner" value={truncate(owner)} href={`https://sepolia.etherscan.io/address/${owner}`} />
                        <InfoRow label="Minter" value={truncate(minter)} href={`https://sepolia.etherscan.io/address/${minter}`} />
                        <InfoRow label="Minted Date" value={timestamp ? new Date(Number(timestamp) * 1000).toLocaleDateString() : 'Unknown'} />
                        <InfoRow label="Contract" value={truncate(CONTRACT_ADDRESS)} href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} />
                        {txHash && (
                            <InfoRow label="Mint Tx" value={truncate(txHash)} href={`https://sepolia.etherscan.io/tx/${txHash}`} />
                        )}
                        <InfoRow label="Metadata" value="IPFS" href={ipfsToHttp(uri)} />
                    </div>

                    <div className="flex gap-4">
                        <button onClick={handleShare} className="flex-1 bg-surface border border-white/20 hover:border-white/40 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200">
                            📤 Share
                        </button>
                        <Link to="/mint" className="flex-1 text-center bg-primary text-white font-bold py-3 px-5 rounded-xl transition-all duration-200 hover:shadow-glow-primary">
                            🎵 Mint Another
                        </Link>
                    </div>
                </div>
            </main>

            {/* Toast */}
            {showToast && (
                <div className="fixed bottom-6 right-6 bg-success text-black font-semibold px-4 py-2 rounded-lg shadow-glow-success animate-fade-in-up">
                    Link copied to clipboard!
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value, href }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
            <span className="text-muted text-sm">{label}</span>
            {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:text-secondary transition-colors">
                    {value} ↗
                </a>
            ) : (
                <span className="text-sm font-semibold text-text">{value}</span>
            )}
        </div>
    );
}

function truncate(str) {
    if (!str) return '';
    if (str.length < 12) return str;
    return `${str.slice(0, 6)}…${str.slice(-4)}`;
}
