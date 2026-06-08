// ─────────────────────────────────────────────────────────────────────────────
// SoundMint Contract Configuration
//
// IMPORTANT: Fill in CONTRACT_ADDRESS after deploying SoundMint.sol via Remix.
//   1. Deploy contracts/SoundMint.sol to Sepolia via Remix IDE
//   2. Copy the deployed contract address
//   3. Replace the placeholder below with your deployed address
// ─────────────────────────────────────────────────────────────────────────────

// Deployed SoundMint.sol address on Ethereum Sepolia Testnet
// Replace with your actual deployed address after Remix deployment
export const CONTRACT_ADDRESS = "0x6aef200fe6fd373e560d34b3a9993e7db2d11732";

// ABI — matches the exact SoundMint.sol interface
export const CONTRACT_ABI = [
    // ── Read: mint price (in wei) ──────────────────────────────────────────
    {
        inputs: [],
        name: "mintPrice",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },

    // ── Read: tokenURIs public mapping ─────────────────────────────────────
    {
        inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        name: "tokenURIs",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },

    // ── Read: tokenTraits public mapping ───────────────────────────────────
    {
        inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        name: "tokenTraits",
        outputs: [
            { internalType: "uint16", name: "bpm", type: "uint16" },
            { internalType: "uint8", name: "dominantKey", type: "uint8" },
            { internalType: "uint8", name: "energyLevel", type: "uint8" },
            { internalType: "uint8", name: "brightness", type: "uint8" },
            { internalType: "string", name: "genre", type: "string" },
        ],
        stateMutability: "view",
        type: "function",
    },

    // ── Read: Gallery helpers ──────────────────────────────────────────────
    {
        inputs: [],
        name: "totalSupply",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "getTokenDetail",
        outputs: [
            { internalType: "string", name: "uri", type: "string" },
            {
                components: [
                    { internalType: "uint16", name: "bpm", type: "uint16" },
                    { internalType: "uint8", name: "dominantKey", type: "uint8" },
                    { internalType: "uint8", name: "energyLevel", type: "uint8" },
                    { internalType: "uint8", name: "brightness", type: "uint8" },
                    { internalType: "string", name: "genre", type: "string" },
                ],
                internalType: "struct SoundMint.AudioTraits",
                name: "traits",
                type: "tuple",
            },
            { internalType: "address", name: "owner", type: "address" },
            { internalType: "address", name: "minter", type: "address" },
            { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "getTraits",
        outputs: [
            {
                components: [
                    { internalType: "uint16", name: "bpm", type: "uint16" },
                    { internalType: "uint8", name: "dominantKey", type: "uint8" },
                    { internalType: "uint8", name: "energyLevel", type: "uint8" },
                    { internalType: "uint8", name: "brightness", type: "uint8" },
                    { internalType: "string", name: "genre", type: "string" },
                ],
                internalType: "struct SoundMint.AudioTraits",
                name: "",
                type: "tuple",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "tokenURI",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "ownerOf",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },

    // ── Read: mintedHashes — check if a song hash has already been minted (AC7) ─
    {
        inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        name: "mintedHashes",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
    },

    // ── Write: mint(address to, string ipfsURI, AudioTraits traits, bytes32 audioHash) ─
    {
        inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "string", name: "ipfsURI", type: "string" },
            {
                components: [
                    { internalType: "uint16", name: "bpm", type: "uint16" },
                    { internalType: "uint8", name: "dominantKey", type: "uint8" },
                    { internalType: "uint8", name: "energyLevel", type: "uint8" },
                    { internalType: "uint8", name: "brightness", type: "uint8" },
                    { internalType: "string", name: "genre", type: "string" },
                ],
                internalType: "struct SoundMint.AudioTraits",
                name: "traits",
                type: "tuple",
            },
            { internalType: "bytes32", name: "audioHash", type: "bytes32" },  // FR-SC-002
        ],
        name: "mint",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "payable",
        type: "function",
    },

    // ── Event: Minted ───────────────────────────────────────────────────────
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "to", type: "address" },
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: false, internalType: "string", name: "ipfsURI", type: "string" },
            { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        name: "Minted",
        type: "event",
    },

    // ── Marketplace: ERC721 Approval ───────────────────────────────────────
    {
        inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "approve",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "getApproved",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },

    // ── Marketplace: Core Functions ─────────────────────────────────────────
    {
        inputs: [
            { internalType: "uint256", name: "tokenId", type: "uint256" },
            { internalType: "uint256", name: "price", type: "uint256" },
        ],
        name: "listToken",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "cancelListing",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "buyToken",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "makeOffer",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "cancelOffer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "tokenId", type: "uint256" },
            { internalType: "address", name: "offerer", type: "address" },
        ],
        name: "acceptOffer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },

    // ── Marketplace: View Functions ─────────────────────────────────────────
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "getListing",
        outputs: [
            {
                components: [
                    { internalType: "address", name: "seller", type: "address" },
                    { internalType: "uint256", name: "price", type: "uint256" },
                    { internalType: "bool", name: "active", type: "bool" },
                ],
                internalType: "struct SoundMint.Listing",
                name: "",
                type: "tuple",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "tokenId", type: "uint256" },
            { internalType: "address", name: "offerer", type: "address" },
        ],
        name: "getOffer",
        outputs: [
            {
                components: [
                    { internalType: "uint256", name: "amount", type: "uint256" },
                    { internalType: "bool", name: "active", type: "bool" },
                ],
                internalType: "struct SoundMint.Offer",
                name: "",
                type: "tuple",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "getOfferers",
        outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
        stateMutability: "view",
        type: "function",
    },

    // ── Marketplace: Events ─────────────────────────────────────────────────
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "seller", type: "address" },
            { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
        ],
        name: "Listed",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "seller", type: "address" },
        ],
        name: "ListingCancelled",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "seller", type: "address" },
            { indexed: true, internalType: "address", name: "buyer", type: "address" },
            { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
        ],
        name: "Sold",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "offerer", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "OfferMade",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "offerer", type: "address" },
        ],
        name: "OfferCancelled",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "seller", type: "address" },
            { indexed: true, internalType: "address", name: "offerer", type: "address" },
            { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "OfferAccepted",
        type: "event",
    },
];
