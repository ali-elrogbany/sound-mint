import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';
import { ipfsToHttp } from '../lib/constants';

export function useTokenData(tokenId) {
    const [metadata, setMetadata] = useState(null);
    const [txHash, setTxHash] = useState(null);
    const [loadingMetadata, setLoadingMetadata] = useState(false);
    
    const publicClient = usePublicClient();

    // 1. Fetch on-chain detail
    const { data: tokenDetail, isLoading: loadingOnChain, error: onChainError } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getTokenDetail',
        args: tokenId ? [BigInt(tokenId)] : undefined,
        query: {
            enabled: !!tokenId
        }
    });

    // 2. Resolve IPFS Metadata
    useEffect(() => {
        if (!tokenDetail) return;
        const uri = tokenDetail[0]; // uri is the first returned item
        if (!uri) return;

        let isMounted = true;
        const fetchMetadata = async () => {
            setLoadingMetadata(true);
            try {
                const response = await fetch(ipfsToHttp(uri));
                if (!response.ok) throw new Error('Failed to fetch metadata');
                const data = await response.json();
                if (isMounted) setMetadata(data);
            } catch (err) {
                console.error('Error fetching IPFS metadata:', err);
            } finally {
                if (isMounted) setLoadingMetadata(false);
            }
        };

        fetchMetadata();
        return () => { isMounted = false; };
    }, [tokenDetail]);

    // 3. Find Mint Tx Hash
    useEffect(() => {
        if (!tokenId || !publicClient) return;

        let isMounted = true;
        const findTx = async () => {
            try {
                // Find the event ABI
                const eventAbi = CONTRACT_ABI.find(a => a.type === 'event' && a.name === 'Minted');
                
                const logs = await publicClient.getLogs({
                    address: CONTRACT_ADDRESS,
                    event: eventAbi,
                    args: {
                        tokenId: BigInt(tokenId)
                    },
                    fromBlock: 'earliest',
                    toBlock: 'latest'
                });
                
                if (logs && logs.length > 0 && isMounted) {
                    setTxHash(logs[0].transactionHash);
                }
            } catch (err) {
                console.error("Failed to fetch mint tx", err);
            }
        };

        findTx();
        return () => { isMounted = false; };
    }, [tokenId, publicClient]);

    return {
        tokenDetail, // [uri, traits, owner, minter, timestamp]
        metadata,
        txHash,
        loading: loadingOnChain || loadingMetadata,
        error: onChainError
    };
}
