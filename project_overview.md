# SoundMint — Project Overview

> _"Every song has a visual soul. SoundMint reveals it."_

SoundMint is a decentralized application (dApp) that transforms uploaded MP3 audio tracks into unique, algorithmically generated animated GIF art and mints them as ERC-721 tokens (NFTs) on the **Ethereum Sepolia testnet**.

---

## Core Workflow

1. **Upload & Analysis:** 
   The user uploads an MP3 track via the frontend. The backend analyzes the acoustic DNA (BPM, key, spectral features, RMS energy) using **Librosa**. It also calculates the raw file SHA-256 hash and a **Chromaprint acoustic fingerprint** (via `pyacoustid`) to prevent duplicate minting of exact audio files or re-encoded variants.

2. **Visual Generation:** 
   The backend launches a headless browser via **Pyppeteer** to run a customized **P5.js WebGL sketch**. The acoustic traits dictate specific camera styles, 3D geometries, physics systems (e.g., gravity wells, black holes), and visual glitches. Pyppeteer captures screenshots of each frame, and **Pillow** compiles them into an animated loop GIF.

3. **IPFS Pinning:** 
   The backend uploads the generated GIF, the raw audio file, and the ERC-721-compliant metadata JSON to IPFS via the **Pinata API**.

4. **On-Chain Minting:** 
   The frontend retrieves the IPFS metadata URI and prompts the user to submit a mint transaction to the smart contract.

5. **Marketplace & Gallery:** 
   Users can view the minted NFTs alongside their on-chain audio traits, listen to the audio waveforms, and trade them (list for sale, purchase, or place offers) directly via the contract's built-in escrow marketplace.

---

## Technology Stack

| Layer | Component | Key Technologies / Libraries |
| :--- | :--- | :--- |
| **Frontend** | UI & Web3 | **React 18**, **Vite 5**, **Tailwind CSS 3**, **RainbowKit 2** (wallet connect), **wagmi 2** & **viem 2** (contract interactions), **WaveSurfer.js 7** (audio waveforms), **Framer Motion 11** (animations) |
| **Backend** | API Services | **FastAPI** (Python 3.11), **SlowAPI** (rate-limiting), **Pytest** (unit/integration testing) |
| **Acoustics & Visuals** | Generation Engine | **Librosa 0.10** (audio analysis), **pyacoustid** (acoustic fingerprinting), **Pyppeteer** (headless Chrome runtime), **P5.js** (WebGL generative engine), **Pillow** (GIF assembler) |
| **Smart Contracts** | Blockchain Core | **Solidity 0.8.20**, **OpenZeppelin 5.0** (`ERC721`, `Ownable`, `ReentrancyGuard`), **Hardhat** (compilation & local deployment) |
| **Storage & Networks** | Infrastructure | **IPFS** (via Pinata SDK / HTTP API), **Ethereum Sepolia Testnet** (Chain ID: `11155111`) |

---

## Key Codebase References

* **Blockchain / Smart Contracts:**
  * [SoundMint.sol](file:///Users/alielrogbany/Documents/EPITA/S1/Introduction_to_blockchain_and_bitcoin/sound-mint/contracts/SoundMint.sol) — Core contract handling minting, on-chain trait serialization, duplicate verification, and the escrow-based gallery marketplace.

* **Backend Services:**
  * [pipeline.py](file:///Users/alielrogbany/Documents/EPITA/S1/Introduction_to_blockchain_and_bitcoin/sound-mint/backend/app/services/pipeline.py) — The asynchronous orchestrator managing backend pipelines (`analyze` $\rightarrow$ `generate` $\rightarrow$ `pin` $\rightarrow$ `ready`).
  * [analyzer.py](file:///Users/alielrogbany/Documents/EPITA/S1/Introduction_to_blockchain_and_bitcoin/sound-mint/backend/app/services/analyzer.py) — Audio feature extractor (BPM, key, energy, spectral features) and Chromaprint fingerprinter.
  * [generator.py](file:///Users/alielrogbany/Documents/EPITA/S1/Introduction_to_blockchain_and_bitcoin/sound-mint/backend/app/services/generator.py) — Spawns Pyppeteer browser, runs the P5.js sketch, captures frames, and packages the animated GIF.
  * [ipfs.py](file:///Users/alielrogbany/Documents/EPITA/S1/Introduction_to_blockchain_and_bitcoin/sound-mint/backend/app/services/ipfs.py) — Pins assets and metadata JSON to IPFS.

* **Frontend:**
  * [App.jsx](file:///Users/alielrogbany/Documents/EPITA/S1/Introduction_to_blockchain_and_bitcoin/sound-mint/frontend/src/App.jsx) — Entry routing definition (`/`, `/mint`, `/gallery`, `/gallery/token/:tokenId`).
  * [contract.js](file:///Users/alielrogbany/Documents/EPITA/S1/Introduction_to_blockchain_and_bitcoin/sound-mint/frontend/src/config/contract.js) — Houses contract configurations, address references, and the matching Solidity ABI definition.
