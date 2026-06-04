import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';
import { KEY_NAMES, energyLabel, bpmLabel, ipfsToHttp } from '../lib/constants';
import WalletButton from '../components/WalletButton';
import { useTokenData } from '../hooks/useTokenData';
import { useMarketplace } from '../hooks/useMarketplace';

function GalleryCard({ tokenId, filterMode, connectedAddress }) {
    const { tokenDetail, metadata, loading } = useTokenData(tokenId);
    const { listing } = useMarketplace(tokenId);

    if (loading || !tokenDetail) {
        return (
            <div className="glass-card p-4 animate-pulse flex flex-col gap-3">
                <div className="w-full aspect-square bg-surface rounded-xl"></div>
                <div className="h-4 bg-surface w-1/2 rounded"></div>
                <div className="h-4 bg-surface w-3/4 rounded"></div>
            </div>
        );
    }

    const [uri, traits, owner] = tokenDetail;
    const imageUri = metadata?.animation_url || metadata?.image;
    
    // Client-side filtering
    if (filterMode === 'collection' && owner?.toLowerCase() !== connectedAddress?.toLowerCase()) {
        return null;
    }
    if (filterMode === 'listings' && (!listing?.active || listing.seller?.toLowerCase() !== connectedAddress?.toLowerCase())) {
        return null;
    }
    
    return (
        <Link to={`/gallery/token/${tokenId}`} className="glass-card overflow-hidden group hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary">
            <div className="relative w-full aspect-square bg-surface">
                {imageUri ? (
                    <img src={ipfsToHttp(imageUri)} alt={`Token ${tokenId}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
                )}
                {listing?.active && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-lg shadow-glow-primary">
                        {listing.price} ETH
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-lg">
                    #{tokenId}
                </div>
            </div>
            <div className="p-4 space-y-2">
                <h3 className="font-bold text-text truncate">{metadata?.name || `SoundMint #${tokenId}`}</h3>
                <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] uppercase font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Key: {KEY_NAMES[traits.dominantKey] || '?'}
                    </span>
                    <span className="text-[10px] uppercase font-semibold bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                        {bpmLabel(traits.bpm)} {traits.bpm} BPM
                    </span>
                    <span className="text-[10px] uppercase font-semibold bg-white/10 text-muted px-2 py-0.5 rounded-full">
                        {energyLabel(traits.energyLevel)} Energy
                    </span>
                </div>
            </div>
        </Link>
    );
}

export default function GalleryPage() {
    const { address, isConnected } = useAccount();
    const [filterMode, setFilterMode] = useState('all'); // 'all', 'collection', 'listings'
    const [page, setPage] = useState(1);
    const PER_PAGE = 25;

    const { data: totalSupplyStr } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'totalSupply',
    });

    const totalSupply = Number(totalSupplyStr || 0n);

    // Filter tokens (this is a simplified client-side filter; for production, indexing is better)
    // We render tokens backwards from totalSupply down to 1
    const tokens = [];
    for (let i = totalSupply; i >= 1; i--) {
        tokens.push(i);
    }

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

            <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-black mb-2">Collection</h1>
                        <p className="text-muted text-sm">{totalSupply} tokens minted on Sepolia</p>
                    </div>

                    {isConnected && (
                        <div className="flex flex-wrap items-center gap-2 bg-surface border border-white/10 p-1.5 rounded-xl">
                            <button 
                                onClick={() => setFilterMode('all')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterMode === 'all' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                            >
                                All NFTs
                            </button>
                            <button 
                                onClick={() => setFilterMode('collection')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterMode === 'collection' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                            >
                                My Collection
                            </button>
                            <button 
                                onClick={() => setFilterMode('listings')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterMode === 'listings' ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}
                            >
                                My Listings
                            </button>
                        </div>
                    )}
                </div>

                {totalSupply === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-muted text-lg">No tokens minted yet.</p>
                        <Link to="/mint" className="text-primary hover:text-secondary font-semibold mt-4 inline-block">Be the first to mint →</Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* We map the tokenIds. The GalleryCard component will fetch data for each and hide itself if it doesn't match the filter mode.
                                Note: In a real app, filtering would require an indexer (like The Graph). For this PoC MVP, 
                                client-side hiding is used, which means pagination pages might appear sparsely populated when filtered. */}
                            {tokens.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(tokenId => (
                                <GalleryCard key={tokenId} tokenId={tokenId} filterMode={filterMode} connectedAddress={address} />
                            ))}
                        </div>

                        {/* Basic Pagination */}
                        {totalSupply > PER_PAGE && (
                            <div className="flex justify-center mt-12 gap-4">
                                <button 
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-4 py-2 border border-white/20 rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                                >
                                    Previous
                                </button>
                                <span className="flex items-center text-sm text-muted">Page {page}</span>
                                <button 
                                    disabled={page * PER_PAGE >= totalSupply}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-4 py-2 border border-white/20 rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
