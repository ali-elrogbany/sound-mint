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
export const CONTRACT_ADDRESS = "0x1e944ccb07dbe870d121a5b6c66b1de7b72d081d";

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
            }
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

    // ── Write: mint(address to, string ipfsURI, AudioTraits traits) ────────
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
];
