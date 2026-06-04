# SoundMint — Product Requirements Document (PRD)

### MVP & Proof of Concept

**Version:** 1.1  
**Status:** Draft  
**Date:** June 2026  
**Author:** Project Owner  
**Classification:** Internal — Confidential

> **v1.1 Change Note:** OpenSea testnet support has been deprecated. All post-mint NFT viewing, verification, and sharing is now handled by the SoundMint native NFT Gallery (`/gallery`). References to OpenSea have been replaced throughout.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Vision & Goals](#2-project-vision--goals)
3. [Scope — MVP vs. Full Product](#3-scope--mvp-vs-full-product)
4. [User Personas](#4-user-personas)
5. [User Stories & Acceptance Criteria](#5-user-stories--acceptance-criteria)
6. [System Architecture Overview](#6-system-architecture-overview)
7. [Functional Requirements](#7-functional-requirements)
    - 7.1 [Audio Upload & Validation](#71-audio-upload--validation)
    - 7.2 [Audio Analysis Engine](#72-audio-analysis-engine)
    - 7.3 [NFT Visual Generation Engine](#73-nft-visual-generation-engine)
    - 7.4 [IPFS Storage & Metadata](#74-ipfs-storage--metadata)
    - 7.5 [Smart Contract](#75-smart-contract)
    - 7.6 [Frontend Interface](#76-frontend-interface)
    - 7.7 [Wallet Integration](#77-wallet-integration)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Technical Stack](#9-technical-stack)
10. [Audio Feature → Visual Trait Mapping](#10-audio-feature--visual-trait-mapping)
11. [Data Models](#11-data-models)
12. [API Specifications](#12-api-specifications)
13. [Smart Contract Specification](#13-smart-contract-specification)
14. [NFT Metadata Standard](#14-nft-metadata-standard)
15. [UI/UX Requirements](#15-uiux-requirements)
    - 15.5 [NFT Gallery](#155-nft-gallery)
16. [Security Requirements](#16-security-requirements)
17. [Testing Requirements](#17-testing-requirements)
18. [Development Roadmap & Milestones](#18-development-roadmap--milestones)
19. [Open Questions & Risks](#19-open-questions--risks)
20. [Glossary](#20-glossary)

---

## 1. Executive Summary

**SoundMint** is a Web3 platform that transforms audio tracks into unique, animated NFTs. Users upload an MP3 file; the platform analyzes the song's acoustic properties (BPM, energy, timbre, key, genre-proxy features) and algorithmically generates a one-of-a-kind animated visual. The animation is then minted as an ERC-721 NFT on an Ethereum-compatible blockchain. For MVP and Proof of Concept phases, the platform will use the Sepolia Testnet before any production deployment.

This document defines the requirements for the **Minimum Viable Product (MVP)** and **Proof of Concept (PoC)** phases, providing a clear and actionable baseline for design, development, and QA teams to begin building.

---

## 2. Project Vision & Goals

### 2.1 Vision Statement

> _"Every song has a visual soul. SoundMint reveals it."_

SoundMint aims to bridge the worlds of music and generative art, enabling artists, music lovers, and collectors to transform audio experiences into verifiable, tradeable digital assets.

### 2.2 Business Goals

| #   | Goal                                            | Success Metric                                           |
| --- | ----------------------------------------------- | -------------------------------------------------------- |
| G1  | Validate core technical pipeline (audio → NFT)  | End-to-end flow working on testnet                       |
| G2  | Demonstrate unique, music-driven generative art | Visual outputs are meaningfully distinct per song        |
| G3  | Achieve a seamless UX from upload to mint       | Full flow completable in under 3 minutes                 |
| G4  | Establish blockchain credibility                | Smart contract auditable and deployed on Sepolia testnet |
| G5  | Build foundation for future monetization        | Minting fee mechanism operational                        |

### 2.3 MVP Success Criteria

The MVP is considered successful when:

- A user can upload an MP3 and receive a unique animated NFT minted to their wallet, end-to-end, without developer assistance.
- The generated animation visually reflects distinct characteristics of different songs (a techno track and an acoustic ballad must yield clearly different outputs).
- The smart contract is deployed and verified on Ethereum Sepolia testnet.
- The full pipeline (upload → analyze → generate → pin to IPFS → mint) completes in under 3 minutes on average.

---

## 3. Scope — MVP vs. Full Product

### 3.1 In Scope for MVP

- MP3 file upload (single file, browser-based)
- Server-side audio feature extraction (BPM, energy, key, timbre)
- Rule-based visual generation → animated GIF output
- IPFS pinning via Pinata (animation + metadata)
- ERC-721 smart contract deployed on Ethereum Sepolia testnet for MVP and Proof of Concept validation
- MetaMask wallet connection
- Mint transaction flow (user pays gas + mint fee)
- Basic NFT preview before minting
- Unique token ID per mint
- On-chain storage of key audio traits
- Simple responsive web interface
- Peer-to-peer NFT trading (list, buy, offer, accept)

### 3.2 Out of Scope for MVP (Future Phases)

- Genre classification using ML models
- Social features (profiles, galleries, sharing)
- Multiple audio formats (WAV, FLAC, AAC)
- Batch minting
- Audio playback of original song in NFT viewer
- AI-generated imagery (Stable Diffusion, etc.)
- Mobile native apps
- Multi-chain support (Ethereum mainnet, Solana)
- Royalties and ERC-2981 standard
- DAO governance / token economics

---

## 4. User Personas

### Persona 1 — The Independent Musician (Primary)

- **Name:** Alex, 28, indie producer
- **Tech level:** Moderate — comfortable with crypto wallets and NFT basics
- **Goal:** Tokenize their music, create collectible digital art around their songs
- **Pain point:** Lacks design skills to create NFT art; wants their music to "speak for itself"
- **Behavior:** Will upload their own tracks; cares about visual uniqueness

### Persona 2 — The NFT Collector (Secondary)

- **Name:** Camille, 34, digital art collector
- **Tech level:** High — active DeFi and NFT user
- **Goal:** Find algorithmically generated art with provable rarity linked to real-world data (music)
- **Pain point:** Most generative NFTs lack a real-world data anchor
- **Behavior:** Focuses on rarity traits, on-chain verifiability, resale potential

### Persona 3 — The Crypto-Curious Music Fan (Tertiary)

- **Name:** Jordan, 22, student and music enthusiast
- **Tech level:** Low-moderate — has MetaMask, bought a few NFTs
- **Goal:** Mint an NFT of their favorite song for fun and ownership
- **Pain point:** Complex UX in most NFT platforms is a barrier
- **Behavior:** Needs a very guided, simple minting experience

---

## 5. User Stories & Acceptance Criteria

### Epic 1 — Audio Upload

**US-001** — As a user, I want to upload an MP3 file from my device so that the platform can analyze it.

| Acceptance Criteria                                                                                 |
| --------------------------------------------------------------------------------------------------- |
| AC1: Upload area accepts `.mp3` files only; rejects all other file types with a clear error message |
| AC2: Maximum file size is 25 MB; files exceeding this show a size error before upload begins        |
| AC3: A progress bar is shown during upload                                                          |
| AC4: The file name is displayed upon successful upload                                              |
| AC5: Upload completes within 30 seconds on a standard broadband connection                          |

---

**US-002** — As a user, I want to see a waveform visualization of my uploaded track so that I can confirm it uploaded correctly.

| Acceptance Criteria                                                         |
| --------------------------------------------------------------------------- |
| AC1: A rendered waveform appears within 5 seconds of upload completion      |
| AC2: The waveform reflects the actual audio amplitude of the file           |
| AC3: A play/pause button allows brief audio preview (30-second cap for MVP) |

---

### Epic 2 — Audio Analysis

**US-003** — As the system, I need to extract audio features from the uploaded MP3 so that the generation engine has data to work with.

| Acceptance Criteria                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1: The following features are extracted: BPM, RMS energy, spectral centroid, zero-crossing rate, dominant musical key (0–11), MFCC vector (13 coefficients) |
| AC2: Analysis completes within 20 seconds for files up to 10 minutes in length                                                                                |
| AC3: Extracted features are stored in a structured JSON object and logged server-side                                                                         |
| AC4: If analysis fails, the user receives an error message and can re-upload                                                                                  |

---

### Epic 3 — NFT Generation

**US-004** — As a user, I want a unique animated NFT to be generated based on my song's audio properties so that the art is directly linked to the music.

| Acceptance Criteria                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------- |
| AC1: The animation is generated server-side and returned as a GIF (min. 400×400px, min. 3 seconds loop)                 |
| AC2: The animation's visual traits (color, speed, shape, density) are deterministically derived from the audio features |
| AC3: Two songs with significantly different BPMs produce animations with visually different speeds                      |
| AC4: Two songs in different musical keys produce animations with different color palettes                               |
| AC5: Generation completes within 60 seconds                                                                             |

---

**US-005** — As a user, I want to preview my generated NFT animation before I commit to minting it.

| Acceptance Criteria                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ |
| AC1: The preview displays the looping GIF animation prominently                                                          |
| AC2: The key extracted audio traits are displayed alongside the preview (BPM, key, energy level label, brightness label) |
| AC3: The user can choose to "Regenerate" (re-run the pipeline) or proceed to "Mint"                                      |

---

### Epic 4 — Wallet & Minting

**US-006** — As a user, I want to connect my MetaMask wallet so that I can mint the NFT to my address.

| Acceptance Criteria                                                                           |
| --------------------------------------------------------------------------------------------- |
| AC1: A "Connect Wallet" button triggers the MetaMask connection modal                         |
| AC2: The platform detects if the user is on the wrong network and prompts a switch to Sepolia |
| AC3: Once connected, the user's truncated wallet address is displayed in the UI               |
| AC4: The user can disconnect their wallet at any time                                         |

---

**US-007** — As a user, I want to mint my generated NFT by paying a small fee so that it is permanently recorded on the blockchain.

| Acceptance Criteria                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------- |
| AC1: The mint fee (0.5 MATIC for MVP testnet; TBD for mainnet) is displayed clearly before confirmation                          |
| AC2: Estimated gas cost is shown (fetched dynamically)                                                                           |
| AC3: The user clicks "Mint NFT" and confirms the transaction in MetaMask                                                         |
| AC4: A transaction hash is returned and displayed with a link to Etherscan (Sepolia)                                             |
| AC5: A success screen shows the minted token ID and a link to view the NFT on the SoundMint Gallery (`/gallery/token/{tokenId}`) |
| AC6: If the transaction fails, a clear error message is shown with a "Try Again" option                                          |

---

### Epic 5 — Post-Mint

**US-008** — As a user, I want to view my minted NFT on the SoundMint Gallery so I can verify it and share it.

| Acceptance Criteria                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------- |
| AC1: After a successful mint, a direct link to `/gallery/token/{tokenId}` is displayed on the success screen            |
| AC2: The gallery token page displays the looping animation, NFT name, token ID, and all on-chain audio trait attributes |
| AC3: The page displays the minting wallet address and a link to the transaction on Etherscan (Sepolia)                  |
| AC4: A "Share" button generates a shareable URL to the token's gallery page                                             |
| AC5: The gallery page is publicly accessible (no wallet connection required to view)                                    |

---

**US-009** — As a user, I want to browse all NFTs minted on SoundMint so I can explore the collection.

| Acceptance Criteria                                                                                 |
| --------------------------------------------------------------------------------------------------- |
| AC1: The `/gallery` page displays a paginated grid of all minted tokens, most recent first          |
| AC2: Each card shows the animation thumbnail, token ID, dominant key, BPM, and energy level         |
| AC3: Clicking a card navigates to the individual token page (`/gallery/token/{tokenId}`)            |
| AC4: A wallet-connected user can filter the gallery to show only their own tokens ("My Collection") |

### Epic 6 — NFT Trading

**US-010** — As an NFT owner, I want to list my NFT for sale at a fixed price so that other users can purchase it.

| Acceptance Criteria |
| --- |
| AC1: Only the token owner can list. |
| AC2: Listing price > 0. |
| AC3: Token is held in escrow (transferred to contract) on listing. |
| AC4: A `Listed` event is emitted. |
| AC5: The listing appears on the Gallery with a "Buy" button. |

---

**US-011** — As a user, I want to buy a listed NFT by paying the listed price so that I become the new owner.

| Acceptance Criteria |
| --- |
| AC1: Buyer sends exact price or more. |
| AC2: Token is transferred to buyer. |
| AC3: Seller receives sale proceeds. |
| AC4: A `Sold` event is emitted. |
| AC5: The Gallery updates ownership immediately. |

---

**US-012** — As an NFT owner, I want to cancel my listing so that my NFT is returned to my wallet and no longer available for sale.

| Acceptance Criteria |
| --- |
| AC1: Only the original lister can cancel. |
| AC2: Token is returned to the owner. |
| AC3: The listing is removed from the Gallery. |
| AC4: A `ListingCancelled` event is emitted. |

---

**US-013** — As a user, I want to make an offer on any NFT (listed or unlisted) by depositing ETH so that the owner can accept my offer.

| Acceptance Criteria |
| --- |
| AC1: Offer amount > 0 and backed by deposited ETH. |
| AC2: Offerer can withdraw (cancel) an active offer to reclaim ETH. |
| AC3: Owner can accept the highest/any offer. |
| AC4: On acceptance, token transfers to offerer, proceeds to seller. |
| AC5: `OfferMade`, `OfferCancelled`, `OfferAccepted` events emitted. |

## 6. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│   React Frontend (Vite + TailwindCSS + wagmi + WaveSurfer.js)  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS REST API
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICE                             │
│              FastAPI (Python 3.11+)                             │
│                                                                 │
│  ┌──────────────────┐   ┌──────────────────────────────────┐   │
│  │  Audio Analysis  │   │    Visual Generation Engine      │   │
│  │  (Librosa)       │──▶│  (P5.js via Puppeteer / Canvas)  │   │
│  └──────────────────┘   └─────────────────┬────────────────┘   │
│                                           │ GIF output          │
│  ┌──────────────────────────────────────▼────────────────┐     │
│  │               IPFS Upload Service (Pinata SDK)         │     │
│  │         Pins: animation GIF + metadata JSON            │     │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                         │ CID returned to frontend
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            BLOCKCHAIN (Ethereum Sepolia Testnet)                │
│         ERC-721 Smart Contract (SoundMint.sol)                  │
│         Deployed on: Ethereum Sepolia Testnet                   │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                DECENTRALIZED STORAGE (IPFS)                     │
│    Animation GIF → ipfs://CID_animation                         │
│    Metadata JSON → ipfs://CID_metadata  (tokenURI)              │
└─────────────────────────────────────────────────────────────────┘
```

### 6.1 Key Architectural Decisions

| Decision                 | Choice                      | Rationale                                                     |
| ------------------------ | --------------------------- | ------------------------------------------------------------- |
| Blockchain               | Ethereum Sepolia Testnet    | Widely supported Ethereum test network with extensive tooling |
| Animation format         | GIF (MVP)                   | Universal browser and marketplace support                     |
| IPFS pinning             | Pinata                      | Reliable pinning service, generous free tier, simple SDK      |
| Smart contract framework | Hardhat + OpenZeppelin      | Industry-standard, well-audited base contracts                |
| Audio analysis           | Python + Librosa            | Best-in-class audio feature extraction library                |
| Visual rendering         | Puppeteer (headless Chrome) | Server-side rendering ensures consistent output               |
| Backend framework        | FastAPI                     | Async support, fast, built-in OpenAPI docs                    |
| Frontend                 | React + Vite                | Fast build, large ecosystem, best-in-class wagmi for Web3     |

---

## 7. Functional Requirements

### 7.1 Audio Upload & Validation

**FR-AUD-001:** The system SHALL accept MP3 files only via a drag-and-drop zone or file picker.

**FR-AUD-002:** The system SHALL reject files exceeding 25 MB and display a validation error.

**FR-AUD-003:** The system SHALL reject non-MP3 MIME types (`audio/mpeg` is the only accepted type).

**FR-AUD-004:** The system SHALL stream the uploaded file to temporary server storage under a UUID-named directory.

**FR-AUD-005:** Uploaded files SHALL be automatically deleted from server storage after 1 hour.

**FR-AUD-006:** The system SHALL support concurrent uploads from different users without interference.

---

### 7.2 Audio Analysis Engine

**FR-ANA-001:** The analysis engine SHALL extract the following features from every uploaded MP3:

| Feature            | Library Call                           | Output Type       |
| ------------------ | -------------------------------------- | ----------------- |
| Tempo (BPM)        | `librosa.beat.beat_track()`            | Float             |
| RMS Energy         | `librosa.feature.rms()`                | Float (mean)      |
| Spectral Centroid  | `librosa.feature.spectral_centroid()`  | Float (mean)      |
| Spectral Rolloff   | `librosa.feature.spectral_rolloff()`   | Float (mean)      |
| Zero-Crossing Rate | `librosa.feature.zero_crossing_rate()` | Float (mean)      |
| MFCC               | `librosa.feature.mfcc(n_mfcc=13)`      | Float array [13]  |
| Chroma (key)       | `librosa.feature.chroma_stft()`        | Int (argmax 0–11) |
| Duration           | `librosa.get_duration()`               | Float (seconds)   |

**FR-ANA-002:** The engine SHALL normalize all scalar features to a 0.0–1.0 range before passing to the generation engine, using pre-defined min/max bounds derived from a calibration dataset.

**FR-ANA-003:** The engine SHALL classify energy into three buckets: `low` (< 0.33), `medium` (0.33–0.66), `high` (> 0.66) for display purposes.

**FR-ANA-004:** The engine SHALL map the dominant chroma index to a musical key name (C, C#, D, D#, E, F, F#, G, G#, A, A#, B).

**FR-ANA-005:** Analysis results SHALL be returned as a structured JSON object within 20 seconds.

**FR-ANA-006:** If Librosa raises an exception during analysis, the backend SHALL return HTTP 422 with a structured error payload.

---

### 7.3 NFT Visual Generation Engine

**FR-GEN-001:** The generation engine SHALL accept the normalized audio feature JSON and produce a looping animated GIF.

**FR-GEN-002:** The output GIF SHALL be a minimum of 400×400 pixels and loop for a minimum of 3 seconds (at minimum 12 fps).

**FR-GEN-003:** The generation process SHALL be deterministic: the same audio feature JSON input MUST always produce the same visual output.

**FR-GEN-004:** The visual parameters SHALL be derived from audio features as defined in Section 10.

**FR-GEN-005:** Generation SHALL be performed server-side using a headless Chromium instance (via Puppeteer) rendering a P5.js sketch, then captured as a GIF via `gif-encoder` or equivalent.

**FR-GEN-006:** The generation engine SHALL complete and return the GIF within 60 seconds.

**FR-GEN-007:** The generated GIF SHALL be stored temporarily on the server under the same session UUID as the source MP3.

---

### 7.4 IPFS Storage & Metadata

**FR-IPFS-001:** Upon successful generation, the system SHALL upload the GIF to IPFS via the Pinata API and return the resulting CID.

**FR-IPFS-002:** The system SHALL construct an ERC-721 compliant metadata JSON object (see Section 14) and upload it to IPFS, receiving a second CID.

**FR-IPFS-003:** The metadata `animation_url` field SHALL reference the animation GIF using the `ipfs://` URI scheme.

**FR-IPFS-004:** Both the animation and metadata CIDs SHALL be returned to the frontend and stored temporarily in session state.

**FR-IPFS-005:** Pinata SHALL be configured to pin files permanently (not temporary pins).

---

### 7.5 Smart Contract

**FR-SC-001:** The smart contract SHALL implement the ERC-721 standard via OpenZeppelin's `ERC721.sol`.

**FR-SC-002:** The smart contract SHALL expose a `mint(address to, string calldata tokenURI, AudioTraits calldata traits)` function.

**FR-SC-003:** The `mint` function SHALL require a payment of at least `mintPrice` (initially 0.5 MATIC on testnet).

**FR-SC-004:** The contract owner SHALL be able to update `mintPrice` via a permissioned setter.

**FR-SC-005:** The contract SHALL store an `AudioTraits` struct on-chain for each token, containing: BPM (uint16), dominant key (uint8), energy level (uint8, 0–255 normalized), brightness (uint8, 0–255 normalized), and duration in seconds (uint16).

**FR-SC-006:** The contract SHALL emit a `Minted(address indexed to, uint256 tokenId, string ipfsURI)` event on every successful mint.

**FR-SC-007:** The contract owner SHALL be able to withdraw accumulated ETH/MATIC via a `withdraw()` function.

**FR-SC-008:** The contract SHALL be deployed and verified on Sepolia testnet for MVP.

**FR-SC-009:** Future production deployment network shall be determined after MVP validation.

---

### 7.6 Frontend Interface

**FR-FE-001:** The frontend SHALL implement the following screens/views:

| Screen    | Path                      | Description                                                         |
| --------- | ------------------------- | ------------------------------------------------------------------- |
| Landing   | `/`                       | Hero, CTA to start minting, brief explainer                         |
| Upload    | `/mint`                   | Drag-and-drop MP3 upload                                            |
| Analyzing | `/mint` (step 2)          | Loading state with animated progress indicator                      |
| Preview   | `/mint` (step 3)          | NFT animation preview + traits display                              |
| Mint      | `/mint` (step 4)          | Wallet connection + mint button + fee display                       |
| Success   | `/mint/success`           | Transaction hash, Gallery link, Etherscan link, share options       |
| Gallery   | `/gallery`                | Paginated grid of all minted tokens; filterable by connected wallet |
| Token     | `/gallery/token/:tokenId` | Individual NFT page: animation, traits, mint info, share button     |

**FR-FE-002:** The frontend SHALL be fully responsive (mobile, tablet, desktop).

**FR-FE-003:** The frontend SHALL display meaningful loading states at every async step (uploading, analyzing, generating, pinning, minting).

**FR-FE-004:** Error states at every step SHALL include a descriptive message and a recovery action (retry or start over).

**FR-FE-005:** The frontend SHALL NOT store the user's private key or seed phrase under any circumstances.

---

### 7.7 Wallet Integration

**FR-WAL-001:** The frontend SHALL support MetaMask wallet connection via `wagmi` + `viem`.

**FR-WAL-002:** The frontend SHALL detect the user's current network and prompt a switch to Ethereum Sepolia (chain ID 11155111 for Sepolia testnet) if they are on a different network.

**FR-WAL-003:** The connected wallet address SHALL be displayed in truncated format (e.g., `0x1234...abcd`).

**FR-WAL-004:** The mint transaction SHALL be initiated from the frontend, signed by the user's wallet, and broadcast to Sepolia.

**FR-WAL-005:** A Etherscan (Sepolia) link SHALL be provided for every submitted transaction.

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Requirement                                 | Target                             |
| ------------------------------------------- | ---------------------------------- |
| MP3 upload (25 MB)                          | < 30 seconds on 20 Mbps connection |
| Audio analysis                              | < 20 seconds per file              |
| NFT generation                              | < 60 seconds per file              |
| IPFS pinning                                | < 30 seconds per file              |
| Total pipeline (upload → IPFS CID ready)    | < 3 minutes                        |
| Frontend initial load (LCP)                 | < 3 seconds                        |
| API endpoint response time (non-processing) | < 200ms                            |

### 8.2 Reliability

- Backend uptime target: 99% (MVP phase, single-instance acceptable)
- IPFS pins MUST be permanent; no temporary-only pins in production
- Smart contract MUST NOT be upgradeable in MVP (KISS principle); upgradeability to be added in v2 via proxy pattern

### 8.3 Scalability (PoC constraints acknowledged)

- MVP is designed for low concurrent usage (< 50 simultaneous users)
- Puppeteer generation workers SHALL be horizontally scalable via a job queue (Bull/Redis) in production; for MVP, a synchronous queue is acceptable

### 8.4 Usability

- The entire flow (upload → mint) SHALL require no documentation to complete for a crypto-literate user
- Key actions SHALL have accessible color contrast (WCAG AA minimum)
- All async operations SHALL have progress feedback within 1 second of initiation

### 8.5 Security

- See Section 16 for full security requirements

---

## 9. Technical Stack

### 9.1 Frontend

| Component        | Technology    | Version |
| ---------------- | ------------- | ------- |
| Framework        | React         | 18.x    |
| Build tool       | Vite          | 5.x     |
| Styling          | TailwindCSS   | 3.x     |
| Web3 hooks       | wagmi         | 2.x     |
| Ethereum client  | viem          | 2.x     |
| Wallet connect   | MetaMask SDK  | latest  |
| Waveform display | WaveSurfer.js | 7.x     |
| Animations       | Framer Motion | 11.x    |
| HTTP client      | Axios         | 1.x     |

### 9.2 Backend

| Component        | Technology                   | Version |
| ---------------- | ---------------------------- | ------- |
| Framework        | FastAPI                      | 0.111.x |
| Runtime          | Python                       | 3.11+   |
| Audio analysis   | Librosa                      | 0.10.x  |
| Headless browser | Pyppeteer / Puppeteer (Node) | latest  |
| IPFS pinning     | Pinata Python SDK            | latest  |
| Task queue (MVP) | In-process async queue       | —       |
| File handling    | Python-multipart             | latest  |
| Testing          | Pytest                       | 8.x     |

### 9.3 Blockchain & Smart Contracts

| Component         | Technology                 | Version                    |
| ----------------- | -------------------------- | -------------------------- |
| Language          | Solidity                   | 0.8.20                     |
| Framework         | Hardhat                    | 2.x                        |
| Base contracts    | OpenZeppelin               | 5.x                        |
| Testing           | Hardhat + Chai + Ethers.js | —                          |
| Deployment        | Hardhat Ignition           | —                          |
| Network (testnet) | Ethereum Sepolia           | Chain ID Ethereum 11155111 |
| Block explorer    | Etherscan (Sepolia)        | —                          |

### 9.4 Infrastructure & Storage

| Component             | Technology                                                  |
| --------------------- | ----------------------------------------------------------- |
| Decentralized storage | IPFS via Pinata                                             |
| Server hosting (MVP)  | Single VPS (4 vCPU, 8 GB RAM — e.g., DigitalOcean, Railway) |
| Environment secrets   | `.env` file + server environment variables                  |
| Reverse proxy         | Nginx                                                       |
| TLS                   | Let's Encrypt                                               |

---

## 10. Audio Feature → Visual Trait Mapping

This section defines the deterministic mapping from audio features to visual parameters. This mapping is the creative and technical heart of the product.

### 10.1 Color Palette (Dominant Key → Hue)

| Key Index | Key Name | Primary Color | Secondary Color | Mood                 |
| --------- | -------- | ------------- | --------------- | -------------------- |
| 0         | C        | `#FF6B6B`     | `#FF8E53`       | Energetic Red-Orange |
| 1         | C# / Db  | `#FF4DA6`     | `#C62A88`       | Vibrant Magenta      |
| 2         | D        | `#4ECDC4`     | `#44A08D`       | Cool Teal            |
| 3         | D# / Eb  | `#A8FF78`     | `#78FFD6`       | Fresh Green-Mint     |
| 4         | E        | `#FED6E3`     | `#A8EDEA`       | Soft Pastel          |
| 5         | F        | `#F7971E`     | `#FFD200`       | Warm Gold            |
| 6         | F# / Gb  | `#8360C3`     | `#2EBFAC`       | Deep Purple-Teal     |
| 7         | G        | `#6A3093`     | `#A044FF`       | Electric Purple      |
| 8         | G# / Ab  | `#FF512F`     | `#DD2476`       | Hot Red-Pink         |
| 9         | A        | `#1FA2FF`     | `#12D8FA`       | Electric Blue        |
| 10        | A# / Bb  | `#43E97B`     | `#38F9D7`       | Neon Green           |
| 11        | B        | `#F953C6`     | `#B91D73`       | Deep Rose            |

### 10.2 Animation Speed (BPM → Cycles/Second)

```
animation_speed = BPM / 60.0
```

- Slow (< 80 BPM) → Slow, flowing, fluid transitions
- Medium (80–140 BPM) → Moderate pulsing rhythm
- Fast (> 140 BPM) → Rapid, energetic particle bursts

### 10.3 Particle Density (RMS Energy)

```
particle_count = round(normalized_energy * 800) + 50   // Range: 50–850 particles
particle_size  = 2 + normalized_energy * 8              // Range: 2–10px radius
```

### 10.4 Shape Geometry (Zero-Crossing Rate)

| ZCR Category | ZCR Range | Shape Type         | Description             |
| ------------ | --------- | ------------------ | ----------------------- |
| Low          | < 0.05    | Circles / Ellipses | Smooth, melodic songs   |
| Medium       | 0.05–0.15 | Polygons (6-sided) | Balanced, mixed songs   |
| High         | > 0.15    | Shards / Triangles | Percussive, noisy songs |

### 10.5 Background Complexity (MFCC[0])

```
complexity = normalize(mfcc[0], min=-400, max=100)
grid_lines = round(complexity * 20)    // 0–20 background grid lines
blur_amount = (1 - complexity) * 5px   // Inverse: simple = blurrier BG
```

### 10.6 Brightness / Glow (Spectral Centroid)

```
glow_intensity = normalized_spectral_centroid * 20px  // Shadow blur
brightness_filter = 80 + normalized_spectral_centroid * 40  // CSS brightness 80%–120%
```

### 10.7 Summary Table

| Audio Feature      | Visual Parameter                        |
| ------------------ | --------------------------------------- |
| Dominant Key       | Color palette (primary + secondary hue) |
| BPM                | Animation cycle speed                   |
| RMS Energy         | Particle count + particle size          |
| Zero-Crossing Rate | Particle/element shape geometry         |
| Spectral Centroid  | Glow intensity + brightness             |
| MFCC[0]            | Background complexity / texture         |
| Duration           | Loop count before repeat (UX)           |

---

## 11. Data Models

### 11.1 Audio Analysis Result

```json
{
    "session_id": "uuid-v4-string",
    "file_name": "my_track.mp3",
    "duration_seconds": 213.4,
    "raw": {
        "bpm": 128.0,
        "rms_energy": 0.042,
        "spectral_centroid": 3200.5,
        "spectral_rolloff": 6400.1,
        "zero_crossing_rate": 0.089,
        "mfcc": [-200.1, 80.3, -12.4, 6.7, 3.2, -1.1, 0.8, 2.3, -0.9, 1.4, 0.5, -0.3, 0.1],
        "dominant_key_index": 7,
        "dominant_key_name": "G"
    },
    "normalized": {
        "bpm": 0.64,
        "energy": 0.58,
        "brightness": 0.42,
        "zcr": 0.71,
        "complexity": 0.55
    },
    "display": {
        "energy_label": "medium",
        "key_name": "G",
        "bpm_rounded": 128
    }
}
```

### 11.2 Generation Output

```json
{
    "session_id": "uuid-v4-string",
    "gif_path": "/tmp/sessions/uuid/output.gif",
    "gif_size_bytes": 2048000,
    "dimensions": { "width": 600, "height": 600 },
    "duration_ms": 3750,
    "visual_traits": {
        "color_palette": ["#6A3093", "#A044FF"],
        "animation_speed": 2.13,
        "particle_count": 514,
        "shape": "polygons",
        "glow_intensity": 8.4,
        "background_complexity": 11
    },
    "generated_at": "2026-06-01T14:32:00Z"
}
```

### 11.3 NFT Metadata (IPFS JSON)

See Section 14.

### 11.4 Mint Request (Frontend → Smart Contract)

```javascript
{
  to: "0xUserWalletAddress",
  tokenURI: "ipfs://QmMetadataCID",
  traits: {
    bpm: 128,           // uint16
    dominantKey: 7,     // uint8 (0–11)
    energyLevel: 148,   // uint8 (0–255)
    brightness: 107,    // uint8 (0–255)
    durationSeconds: 213 // uint16
  },
  value: ethers.parseEther("0.5") // mintPrice in MATIC
}
```

---

## 12. API Specifications

Base URL: `https://api.soundmint.xyz/v1` (production) | `http://localhost:8000/v1` (local)

### POST `/upload`

Upload an MP3 file and trigger the full analysis → generation → pinning pipeline.

**Request:**

- Content-Type: `multipart/form-data`
- Body: `file` (binary MP3), `wallet_address` (string, optional for pre-association)

**Response 200:**

```json
{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "message": "File received. Analysis started."
}
```

**Response 422:** File validation error

```json
{
    "error": "INVALID_FILE_TYPE",
    "message": "Only MP3 files are supported.",
    "detail": null
}
```

---

### GET `/status/{session_id}`

Poll the processing status for a given session.

**Response 200:**

```json
{
    "session_id": "550e8400-...",
    "status": "generating",
    "stage": "GENERATING_NFT",
    "stages_completed": ["UPLOADED", "ANALYZED"],
    "stages_remaining": ["GENERATING_NFT", "PINNING", "READY"],
    "progress_percent": 45,
    "error": null
}
```

Possible `status` values: `processing` | `generating` | `pinning` | `ready` | `failed`

---

### GET `/result/{session_id}`

Retrieve the completed pipeline result, including IPFS CIDs and visual traits.

**Response 200:**

```json
{
  "session_id": "550e8400-...",
  "status": "ready",
  "animation_cid": "QmAnimationCID",
  "metadata_cid": "QmMetadataCID",
  "animation_url": "https://gateway.pinata.cloud/ipfs/QmAnimationCID",
  "token_uri": "ipfs://QmMetadataCID",
  "audio_traits": { ... },
  "visual_traits": { ... },
  "on_chain_traits": {
    "bpm": 128,
    "dominantKey": 7,
    "energyLevel": 148,
    "brightness": 107,
    "durationSeconds": 213
  }
}
```

**Response 404:** Session not found or expired

---

### GET `/health`

Backend health check.

**Response 200:** `{ "status": "ok", "version": "1.1.0" }`

---

### GET `/gallery/tokens`

Returns a paginated list of all minted tokens for the Gallery grid. Data is assembled by reading on-chain events (`Minted`) and resolving IPFS metadata.

**Query params:** `page` (default: 1), `limit` (default: 25, max: 100), `owner` (optional wallet address for "My Collection" filter)

**Response 200:**

```json
{
    "page": 1,
    "limit": 25,
    "total": 142,
    "tokens": [
        {
            "tokenId": 42,
            "name": "SoundMint #42",
            "animation_url": "https://gateway.pinata.cloud/ipfs/QmAnimationCID",
            "traits": {
                "bpm": 128,
                "dominantKey": "G",
                "energyLabel": "Medium",
                "brightnessLabel": "Mid",
                "shapeStyle": "Polygons",
                "animationSpeed": "Fast"
            },
            "owner": "0x1234...abcd",
            "mintedAt": "2026-06-01T14:32:00Z",
            "txHash": "0xabc..."
        }
    ]
}
```

---

### GET `/gallery/tokens/{tokenId}`

Returns full detail for a single token, including resolved IPFS metadata and on-chain traits.

**Response 200:**

```json
{
    "tokenId": 42,
    "name": "SoundMint #42",
    "description": "...",
    "animation_url": "https://gateway.pinata.cloud/ipfs/QmAnimationCID",
    "metadata_url": "https://gateway.pinata.cloud/ipfs/QmMetadataCID",
    "token_uri": "ipfs://QmMetadataCID",
    "on_chain_traits": {
        "bpm": 128,
        "dominantKey": 7,
        "energyLevel": 148,
        "brightness": 107,
        "durationSeconds": 213
    },
    "attributes": [ ... ],
    "owner": "0xOwnerAddress",
    "contract": "0xContractAddress",
    "txHash": "0xMintTxHash",
    "mintedAt": "2026-06-01T14:32:00Z",
    "etherscanUrl": "https://sepolia.etherscan.io/tx/0xMintTxHash"
}
```

**Response 404:** Token not found

---

## 13. Smart Contract Specification

### Contract: `SoundMint.sol`

```
Network:       Sepolia Testnet (MVP)
Standard:      ERC-721
Base:          OpenZeppelin ERC721.sol v5.x + Ownable.sol
Token Name:    SoundMint
Token Symbol:  SNDM
```

### State Variables

| Variable          | Type                              | Description                                   |
| ----------------- | --------------------------------- | --------------------------------------------- |
| `_tokenIdCounter` | `uint256`                         | Auto-incrementing token counter (starts at 1) |
| `mintPrice`       | `uint256`                         | Price in wei to mint one NFT                  |
| `tokenURIs`       | `mapping(uint256 => string)`      | Maps token ID → IPFS metadata URI             |
| `tokenTraits`     | `mapping(uint256 => AudioTraits)` | Maps token ID → on-chain audio traits         |
| `listings`        | `mapping(uint256 => Listing)`     | Active sale listings                          |
| `offers`          | `mapping(uint256 => mapping(address => Offer))` | Per-token offers by address                   |
| `offersByToken`   | `mapping(uint256 => address[])`   | Track offerers per token for enumeration      |

### Structs

```solidity
struct AudioTraits {
    uint16 bpm;               // Beats per minute (e.g., 128)
    uint8  dominantKey;       // Musical key index 0–11 (C=0, C#=1, ... B=11)
    uint8  energyLevel;       // Normalized RMS energy 0–255
    uint8  brightness;        // Normalized spectral centroid 0–255
    uint16 durationSeconds;   // Song duration in seconds
}

struct Listing {
    address seller;
    uint256 price;
    bool    active;
}

struct Offer {
    uint256 amount;
    bool    active;
}
```

### Functions

| Function                                                | Visibility             | Description                                        |
| ------------------------------------------------------- | ---------------------- | -------------------------------------------------- |
| `mint(address to, string tokenURI, AudioTraits traits)` | `public payable`       | Mints new token; requires `msg.value >= mintPrice` |
| `tokenURI(uint256 tokenId)`                             | `public view override` | Returns the IPFS metadata URI for a token          |
| `setMintPrice(uint256 newPrice)`                        | `public onlyOwner`     | Updates the mint price                             |
| `withdraw()`                                            | `public onlyOwner`     | Withdraws contract balance to owner                |
| `getTraits(uint256 tokenId)`                            | `public view`          | Returns the AudioTraits struct for a token         |
| `listToken(uint256 tokenId, uint256 price)`             | `external`             | Owner lists token for sale                           |
| `cancelListing(uint256 tokenId)`                        | `external`             | Seller cancels listing                               |
| `buyToken(uint256 tokenId)`                             | `external payable`     | Buyer purchases listed token                         |
| `makeOffer(uint256 tokenId)`                            | `external payable`     | User deposits ETH as an offer                        |
| `cancelOffer(uint256 tokenId)`                          | `external`             | Offerer withdraws their offer                        |
| `acceptOffer(uint256 tokenId, address offerer)`         | `external`             | Owner accepts a specific offer                       |
| `getListing(uint256 tokenId)`                           | `external view`        | Returns listing details                              |
| `getOffer(uint256 tokenId, address offerer)`            | `external view`        | Returns offer details                                |
| `getOffers(uint256 tokenId)`                            | `external view`        | Returns all active offers for a token                |

### Events

```solidity
event Minted(address indexed to, uint256 indexed tokenId, string ipfsURI);
event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
event ListingCancelled(uint256 indexed tokenId, address indexed seller);
event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
event OfferMade(uint256 indexed tokenId, address indexed offerer, uint256 amount);
event OfferCancelled(uint256 indexed tokenId, address indexed offerer);
event OfferAccepted(uint256 indexed tokenId, address indexed seller, address indexed offerer, uint256 amount);
```

### Deployment Configuration

```javascript
// hardhat.config.js (relevant networks section)
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    chainId: 11155111,
  }
}
```

---

## 14. NFT Metadata Standard

The metadata JSON SHALL comply with the [ERC-721 Metadata Extension](https://eips.ethereum.org/EIPS/eip-721) and follow the widely-adopted attributes schema (compatible with ERC-721 indexers and future marketplace integrations).

### Template

```json
{
    "name": "SoundMint #42",
    "description": "A unique animated NFT generated from the acoustic DNA of a musical track. BPM: 128 | Key: G | Energy: Medium. Created with SoundMint.",
    "image": "ipfs://QmAnimationCID",
    "animation_url": "ipfs://QmAnimationCID",
    "external_url": "https://soundmint.xyz/token/42",
    "background_color": "6A3093",
    "attributes": [
        { "trait_type": "BPM", "value": 128 },
        { "trait_type": "Musical Key", "value": "G" },
        { "trait_type": "Energy Level", "value": "Medium" },
        { "trait_type": "Brightness", "value": "Mid" },
        { "trait_type": "Shape Style", "value": "Polygons" },
        { "trait_type": "Palette", "value": "Electric Purple" },
        { "trait_type": "Animation Speed", "value": "Fast" },
        { "display_type": "number", "trait_type": "Duration (seconds)", "value": 213 },
        { "display_type": "number", "trait_type": "Token ID", "value": 42 }
    ]
}
```

### Attribute Discretization (for Rarity)

Continuous numeric features are discretized into named labels to support rarity display on the SoundMint Gallery and future marketplace integrations:

| Trait           | Raw Range                       | Labels                              |
| --------------- | ------------------------------- | ----------------------------------- |
| BPM             | < 80 / 80–120 / 120–160 / > 160 | Slow / Moderate / Fast / Hyperspeed |
| Energy Level    | 0–0.33 / 0.33–0.66 / > 0.66     | Low / Medium / High                 |
| Brightness      | 0–0.33 / 0.33–0.66 / > 0.66     | Dark / Mid / Bright                 |
| Animation Speed | < 1.5 / 1.5–2.5 / > 2.5 cps     | Slow / Moderate / Rapid             |

---

## 15. UI/UX Requirements

### 15.1 Design Principles

1. **Music-first aesthetics** — Dark theme, vibrant accent colors, glassmorphism UI elements
2. **Progressive disclosure** — Show only what's needed at each step; don't overwhelm
3. **Trust signals** — Display transaction hashes, IPFS links, and contract addresses prominently
4. **Guided flow** — Step indicator showing progress through the pipeline

### 15.2 Step Indicator

```
[1. Upload] → [2. Analyzing] → [3. Preview] → [4. Mint] → [5. Done ✓]
```

### 15.3 Color & Typography

| Token            | Value                       |
| ---------------- | --------------------------- |
| Background       | `#0D0D0D` (near black)      |
| Surface          | `#1A1A2E` (dark navy)       |
| Accent Primary   | `#A044FF` (electric purple) |
| Accent Secondary | `#12D8FA` (cyan)            |
| Text Primary     | `#F0F0F0`                   |
| Text Secondary   | `#888888`                   |
| Success          | `#43E97B`                   |
| Error            | `#FF512F`                   |
| Font             | Inter (sans-serif)          |

### 15.4 Key UI Components

- **DropZone:** Large, animated upload area with dashed border and drag-over state
- **WaveformPlayer:** Full-width waveform display with play/pause; uses WaveSurfer.js
- **TraitsBadge:** Pill-shaped badges displaying key/BPM/energy/shape
- **NFTPreviewCard:** Centered animated GIF with gradient border, trait badges below
- **MintButton:** Large CTA, disabled until wallet connected; shows fee + estimated gas
- **TxToast:** Slide-in notification with transaction hash link and success/failure state

### 15.5 NFT Gallery

The Gallery is the platform-native replacement for OpenSea testnet viewing. It must feel like a first-class part of the product, not a fallback.

**Gallery Grid (`/gallery`)**

- Dark-themed card grid, 3 columns on desktop, 2 on tablet, 1 on mobile
- Each card shows: looping GIF thumbnail (auto-play, muted), token ID badge, dominant key pill, BPM, energy label
- Infinite scroll or pagination (25 tokens per page)
- "My Collection" toggle (visible only when wallet connected) — filters to `ownerOf == connectedAddress`
- "My Listings" toggle (visible only when wallet connected) — filters to listings created by connected address
- Cards show a price badge for listed tokens
- Cards link to `/gallery/token/:tokenId`

**Token Detail Page (`/gallery/token/:tokenId`)**

- Full-width animated GIF playback at 600×600px (or responsive max-width)
- NFT name (`SoundMint #tokenId`) as page heading
- **Marketplace Actions**:
  - If owner: "List for Sale" button or "Cancel Listing"
  - If non-owner and listed: "Buy Now" button
  - "Make Offer" button and "View Offers" section showing all current offers
- Trait badges section: BPM, Key, Energy, Brightness, Shape Style, Palette, Animation Speed, Duration
- On-chain info: Token ID, Contract Address (linked to Etherscan), Minted by (truncated wallet, linked to Etherscan address), Tx Hash (linked to Etherscan tx)
- IPFS links: animation CID and metadata CID (via Pinata gateway)
- "Share" button: copies the page URL to clipboard, shows a toast confirmation
- "Mint Another" CTA linking back to `/mint`

**Data source:** The Gallery reads on-chain data by calling `tokenURI(tokenId)` and `getTraits(tokenId)` on the deployed `SoundMint.sol` contract, then resolves the IPFS metadata JSON via the Pinata gateway. No separate database is required for MVP.

---

## 16. Security Requirements

### 16.1 Smart Contract Security

**SEC-SC-001:** The contract SHALL use OpenZeppelin's audited `ERC721.sol` as its base; no custom token transfer logic.

**SEC-SC-002:** The `withdraw()` function SHALL be guarded by `onlyOwner` and use `call` (not `transfer`) to prevent gas griefing.

**SEC-SC-003:** Integer overflow protection is provided by Solidity 0.8.x built-in checks; no additional SafeMath required.

**SEC-SC-004:** The contract SHALL NOT be upgradeable in MVP to avoid proxy attack vectors.

**SEC-SC-005:** The deployer private key SHALL never be committed to version control; it SHALL be loaded from environment variables only.

**SEC-SC-006:** The contract SHOULD be submitted for a lightweight audit or peer review before mainnet deployment.

**SEC-SC-007:** Reentrancy protection on `buyToken()`, `cancelOffer()`, and `acceptOffer()` using OpenZeppelin `ReentrancyGuard`.

**SEC-SC-008:** Escrow pattern — tokens are transferred to the contract on listing, preventing double-listing or transfer-while-listed.

**SEC-SC-009:** ETH refund safety — offer withdrawals and overpayment refunds use `call()` pattern.

### 16.2 Backend Security

**SEC-BE-001:** All file uploads SHALL be validated for MIME type and magic bytes (not just extension).

**SEC-BE-002:** Uploaded files SHALL be stored in isolated temporary directories (UUID-based); directory traversal attacks SHALL be mitigated by path sanitization.

**SEC-BE-003:** Puppeteer instances SHALL run with `--no-sandbox` disabled in production; use a separate sandboxed subprocess or Docker container.

**SEC-BE-004:** Pinata API keys SHALL be stored as environment variables, never in source code.

**SEC-BE-005:** The API SHALL implement rate limiting: max 10 upload requests per IP per hour for MVP.

**SEC-BE-006:** CORS SHALL be configured to allow only the production frontend origin.

### 16.3 Frontend Security

**SEC-FE-001:** The dApp SHALL NEVER request or store the user's private key or seed phrase.

**SEC-FE-002:** All contract interactions SHALL be performed via signed transactions through the user's wallet (MetaMask); the frontend never holds signing authority.

**SEC-FE-003:** The contract ABI and address SHALL be hardcoded in the frontend build; no dynamic contract address resolution from an untrusted source.

---

## 17. Testing Requirements

### 17.1 Unit Tests

| Module                | What to Test                                                                         |
| --------------------- | ------------------------------------------------------------------------------------ |
| Audio Analysis        | Feature extraction produces expected value ranges for known test files               |
| Feature Normalization | Boundary values (0, max) normalize to 0.0 and 1.0                                    |
| Trait Mapping         | Each audio feature correctly maps to expected visual parameter                       |
| Metadata Builder      | Output JSON is valid ERC-721 metadata and renders correctly in the SoundMint Gallery |
| Smart Contract        | `mint()`, marketplace (`list`, `buy`, `offer`, `accept`), access control             |

### 17.2 Integration Tests

| Scenario                                         | Expected Result                               |
| ------------------------------------------------ | --------------------------------------------- |
| Upload valid MP3 → poll status → retrieve result | `status: ready`, valid CIDs returned          |
| Upload invalid file type                         | HTTP 422, correct error code                  |
| Upload oversized file                            | HTTP 413 or 422 before processing             |
| Mint with insufficient value                     | Smart contract reverts with correct message   |
| Mint with correct value                          | Token minted, event emitted, tokenURI correct |
| tokenURI returns correct IPFS URI                | Matches the CID from the result endpoint      |
| Marketplace end-to-end flow                      | Token listed, bought, ETH and token transfer correctly |

### 17.3 End-to-End Tests (Manual for MVP)

| Test Case       | Steps                                                  | Pass Criteria                                                        |
| --------------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| Full happy path | Upload MP3 → analyze → preview → connect wallet → mint | NFT visible on SoundMint Gallery with correct animation and metadata |
| Wrong network   | Connect wallet on Ethereum mainnet, attempt mint       | Network switch prompt appears                                        |
| Low gas         | Attempt mint with < mintPrice                          | MetaMask shows revert reason                                         |
| Different songs | Mint 3 different genres                                | Visually distinct NFTs produced                                      |

### 17.4 Smart Contract Test Coverage Target

- **Minimum:** 90% line coverage on `SoundMint.sol`
- Run with: `npx hardhat coverage`

---

## 18. Development Roadmap & Milestones

### Phase 0 — Setup (Week 1)

- [ ] Repository setup (monorepo: `/frontend`, `/backend`, `/contracts`)
- [ ] CI/CD pipeline (GitHub Actions — lint, test on push)
- [ ] Environment setup: Python 3.11, Node.js 20, Hardhat, Pinata account
- [ ] `.env.example` documented for all team members
- [ ] Fund deployer wallet

### Phase 1 — Audio Analysis Engine (Weeks 1–2)

- [ ] FastAPI project scaffolding
- [ ] `/upload` and `/status/{id}` endpoints (stub)
- [ ] Librosa feature extraction implementation
- [ ] Unit tests for analysis module
- [ ] Normalization pipeline implementation
- [ ] Test with 10+ diverse MP3 files; document feature ranges

**Milestone 1:** API returns correct, normalized audio features for any MP3 upload ✓

### Phase 2 — Visual Generation Engine (Weeks 3–4)

- [ ] P5.js sketch design and implementation (particle system + color + shape)
- [ ] Puppeteer headless rendering integration
- [ ] GIF export pipeline (gif-encoder)
- [ ] Validate determinism (same input → same output)
- [ ] Aesthetic review: test with 5+ song types, adjust mappings
- [ ] `/result/{id}` endpoint returns GIF URL

**Milestone 2:** A visually compelling, music-driven GIF is generated for any uploaded MP3 ✓

### Phase 3 — IPFS & Metadata (Week 5)

- [ ] Pinata SDK integration
- [ ] GIF pinning workflow
- [ ] Metadata JSON builder
- [ ] Metadata pinning workflow
- [ ] Validate IPFS gateway accessibility
- [ ] End-to-end API test: upload MP3 → receive metadata CID

**Milestone 3:** Full backend pipeline operational; metadata CID returned and accessible on IPFS ✓

### Phase 4 — Smart Contract (Week 6)

- [ ] `SoundMint.sol` implementation
- [ ] Hardhat test suite (> 90% coverage)
- [ ] Deploy to Sepolia testnet
- [ ] Verify contract on Etherscan (Sepolia)
- [ ] Manual mint test via Hardhat console
- [ ] Document ABI and deployed address

**Milestone 4:** Smart contract deployed and verified on Amoy testnet; manual mint succeeds ✓

### Phase 5 — Frontend (Weeks 7–8)

- [ ] React + Vite project setup, TailwindCSS
- [ ] Landing page
- [ ] Upload step (DropZone + WaveSurfer waveform)
- [ ] Analysis loading state + polling logic
- [ ] NFT preview screen (GIF + traits)
- [ ] wagmi wallet connection + network detection
- [ ] Mint flow + MetaMask transaction
- [ ] Success screen + Etherscan (Sepolia) link + SoundMint Gallery token link
- [ ] Gallery grid page (`/gallery`) — paginated token cards, "My Collection" filter
- [ ] Token detail page (`/gallery/token/:tokenId`) — animation, traits, on-chain info, share button
- [ ] Error states for every step
- [ ] Responsive layout QA

**Milestone 5:** Full frontend functional on testnet; non-technical user can complete the flow ✓

### Phase 6 — Integration & QA (Week 9)

- [ ] End-to-end testing (10+ diverse tracks)
- [ ] Performance benchmarking (total pipeline < 3 min target)
- [ ] Security review checklist
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness QA
- [ ] Bug fix sprint

**Milestone 6:** MVP passes all integration test cases; no P1 or P2 bugs open ✓

---

## 19. Open Questions & Risks

### Open Questions

| #    | Question                                                                        | Owner           | Target Date           |
| ---- | ------------------------------------------------------------------------------- | --------------- | --------------------- |
| OQ-1 | What is the final mainnet mint price in MATIC?                                  | Product         | Before Week 7         |
| OQ-2 | Should the original MP3 be stored (IPFS/Arweave) or discarded after minting?    | Product + Legal | Before Week 5         |
| OQ-3 | Who owns the copyright of the generated animation — the platform or the minter? | Legal           | Before mainnet launch |
| OQ-4 | Should the platform take a royalty on secondary sales (ERC-2981)?               | Product         | v2 scoping            |
| OQ-5 | Is Puppeteer acceptable server-side, or should we use a pure canvas approach?   | Engineering     | Week 2                |

### Risks

| Risk                                                      | Likelihood | Impact | Mitigation                                                                      |
| --------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------- |
| Librosa BPM detection is inaccurate for complex rhythms   | Medium     | Medium | Use `librosa.beat.plp()` as fallback; set floor at 60 BPM                       |
| Puppeteer GIF export is slow (> 60s for complex sketches) | Medium     | High   | Profile and simplify sketch; add timeout with fallback to simpler animation     |
| Pinata API downtime                                       | Low        | High   | Abstract IPFS layer; add NFT.Storage as secondary provider                      |
| Sepolia testnet instability                               | Medium     | Low    | Use multiple RPC providers (Alchemy + Infura); mock blockchain for frontend dev |
| Generated animations look too similar across songs        | Medium     | High   | Early aesthetic QA in Phase 2; widen visual parameter ranges                    |
| Large MP3 files cause backend memory issues               | Medium     | Medium | Implement streaming analysis (Librosa supports chunked loading)                 |
| User uploads copyrighted music                            | High       | High   | Add Terms of Service; platform does not store MP3 beyond session lifetime       |

---

## 20. Glossary

| Term                   | Definition                                                                       |
| ---------------------- | -------------------------------------------------------------------------------- |
| **BPM**                | Beats Per Minute — the tempo of a musical track                                  |
| **CID**                | Content Identifier — a unique hash used by IPFS to address stored content        |
| **ERC-721**            | The Ethereum token standard defining non-fungible tokens (NFTs)                  |
| **GIF**                | Graphics Interchange Format — a lossless bitmap format supporting animation      |
| **IPFS**               | InterPlanetary File System — a peer-to-peer distributed storage protocol         |
| **Librosa**            | A Python library for audio and music analysis                                    |
| **MFCC**               | Mel-Frequency Cepstral Coefficients — compact representation of audio timbre     |
| **Mint**               | The act of creating a new NFT on a blockchain                                    |
| **NFT**                | Non-Fungible Token — a unique, verifiable digital asset recorded on a blockchain |
| **Pinata**             | A commercial IPFS pinning service that ensures files remain accessible           |
| **Puppeteer**          | A Node.js library for controlling a headless Chromium browser                    |
| **RMS Energy**         | Root Mean Square energy — a measure of the overall loudness of an audio signal   |
| **Spectral Centroid**  | The "center of mass" of the audio spectrum; correlates with perceived brightness |
| **Token URI**          | The IPFS URI stored on-chain that points to a token's metadata JSON              |
| **wagmi**              | A React hooks library for Ethereum/EVM wallet and contract interactions          |
| **Zero-Crossing Rate** | The rate at which a signal changes sign; higher in percussive/noisy audio        |

---

_Document End — SoundMint PRD v1.1_

_This document is a living artifact. Updates should be versioned and dated. All major changes require sign-off from the Project Owner._
