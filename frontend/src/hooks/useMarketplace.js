import { useState } from 'react';
import { useReadContract, useWriteContract, useAccount, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';
import { useNotifications } from '../context/NotificationContext';

export function useMarketplace(tokenId) {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    const { addNotification } = useNotifications();

    // ── Reads ──────────────────────────────────────────────────────────────

    // Fetch listing
    const { data: listingData, refetch: refetchListing } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getListing',
        args: tokenId ? [BigInt(tokenId)] : undefined,
        query: { enabled: !!tokenId }
    });
    
    // Parse listing
    const listing = listingData ? {
        seller: listingData.seller,
        price: formatEther(listingData.price),
        active: listingData.active
    } : null;

    // Fetch offerers
    const { data: offerers, refetch: refetchOfferers } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getOfferers',
        args: tokenId ? [BigInt(tokenId)] : undefined,
        query: { enabled: !!tokenId }
    });

    // Fetch user's own offer (if any)
    const { data: userOfferData, refetch: refetchUserOffer } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getOffer',
        args: tokenId && address ? [BigInt(tokenId), address] : undefined,
        query: { enabled: !!tokenId && !!address }
    });

    const userOffer = userOfferData ? {
        amount: formatEther(userOfferData.amount),
        active: userOfferData.active
    } : null;

    const refetchAll = async () => {
        await Promise.all([refetchListing(), refetchOfferers(), refetchUserOffer()]);
    };

    // ── Writes ─────────────────────────────────────────────────────────────

    const listToken = async (priceEth) => {
        if (!tokenId) return;
        const priceWei = parseEther(priceEth.toString());
        
        // 1. Approve contract
        const approveHash = await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESS, BigInt(tokenId)]
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // 2. List
        const listHash = await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'listToken',
            args: [BigInt(tokenId), priceWei]
        });
        await publicClient.waitForTransactionReceipt({ hash: listHash });
        addNotification(
            'marketplace',
            'Token Listed for Sale 🏷️',
            `Token #${tokenId} is now listed for ${priceEth} ETH.`,
            { link: `/gallery/token/${tokenId}` }
        );
        await refetchAll();
    };

    const cancelListing = async () => {
        if (!tokenId) return;
        const hash = await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'cancelListing',
            args: [BigInt(tokenId)]
        });
        await publicClient.waitForTransactionReceipt({ hash });
        addNotification(
            'info',
            'Listing Cancelled',
            `Your listing for Token #${tokenId} has been cancelled.`,
            { link: `/gallery/token/${tokenId}` }
        );
        await refetchAll();
    };

    const buyToken = async (priceEth) => {
        if (!tokenId) return;
        const priceWei = parseEther(priceEth.toString());
        const hash = await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'buyToken',
            args: [BigInt(tokenId)],
            value: priceWei
        });
        await publicClient.waitForTransactionReceipt({ hash });
        addNotification(
            'success',
            'Token Purchased! 🛒',
            `You successfully bought Token #${tokenId} for ${priceEth} ETH.`,
            { link: `/gallery/token/${tokenId}` }
        );
        await refetchAll();
    };

    const makeOffer = async (amountEth) => {
        if (!tokenId) return;
        const amountWei = parseEther(amountEth.toString());
        const hash = await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'makeOffer',
            args: [BigInt(tokenId)],
            value: amountWei
        });
        await publicClient.waitForTransactionReceipt({ hash });
        addNotification(
            'marketplace',
            'Offer Placed 💰',
            `Your offer of ${amountEth} ETH on Token #${tokenId} has been submitted.`,
            { link: `/gallery/token/${tokenId}` }
        );
        await refetchAll();
    };

    const cancelOffer = async () => {
        if (!tokenId) return;
        const hash = await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'cancelOffer',
            args: [BigInt(tokenId)]
        });
        await publicClient.waitForTransactionReceipt({ hash });
        addNotification(
            'info',
            'Offer Cancelled',
            `Your offer on Token #${tokenId} has been withdrawn.`,
            { link: `/gallery/token/${tokenId}` }
        );
        await refetchAll();
    };

    const acceptOffer = async (offererAddress) => {
        if (!tokenId) return;
        const hash = await writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'acceptOffer',
            args: [BigInt(tokenId), offererAddress]
        });
        await publicClient.waitForTransactionReceipt({ hash });
        addNotification(
            'success',
            'Offer Accepted! ✅',
            `You accepted an offer on Token #${tokenId}. The sale is complete.`,
            { link: `/gallery/token/${tokenId}` }
        );
        await refetchAll();
    };

    // Helper to get offer details for a specific address
    const getOfferForAddress = async (offererAddress) => {
        if (!tokenId || !publicClient) return null;
        try {
            const data = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'getOffer',
                args: [BigInt(tokenId), offererAddress]
            });
            return data;
        } catch (err) {
            console.error("Failed to fetch offer for", offererAddress, err);
            return null;
        }
    };

    return {
        listing,
        offerers,
        userOffer,
        listToken,
        cancelListing,
        buyToken,
        makeOffer,
        cancelOffer,
        acceptOffer,
        getOfferForAddress,
        refetchAll
    };
}
