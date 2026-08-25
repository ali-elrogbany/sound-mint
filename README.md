# SoundMint 🎵→🎨

> _"Every song has a visual soul. SoundMint reveals it."_

SoundMint transforms MP3 audio tracks into unique animated NFTs on Ethereum Sepolia testnet. The platform analyzes acoustic properties (BPM, energy, timbre, key) and algorithmically generates one-of-a-kind animated GIF art, which is then minted as an ERC-721 token.

## Project Structure

```
sound-mint/
├── backend/          # FastAPI Python service (audio analysis + NFT generation)
├── frontend/         # React + Vite dApp (upload → preview → mint UI)
└── contracts/        # Solidity smart contracts (Hardhat + OpenZeppelin)
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- MetaMask wallet (for minting)

### Backend

```bash
cd backend
cp .env.example .env   # Fill in your Pinata keys
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all required variables.

## Architecture

```
Browser (React) ──HTTPS──▶ FastAPI Backend
                              ├── Librosa (audio analysis)
                              ├── Pyppeteer + P5.js (GIF generation)
                              └── Pinata SDK (IPFS pinning)
                                        │
                              Ethereum Sepolia Testnet
                              ERC-721 SoundMint.sol
```

## Tech Stack

| Layer      | Technology                                                |
| ---------- | --------------------------------------------------------- |
| Frontend   | React 18, Vite 5, TailwindCSS 3, wagmi 2, WaveSurfer.js 7 |
| Backend    | FastAPI, Python 3.11, Librosa, Pyppeteer                  |
| Blockchain | Solidity 0.8.20, Hardhat 2, OpenZeppelin 5                |
| Storage    | IPFS via Pinata                                           |
| Network    | Ethereum Sepolia Testnet (Chain ID: 11155111)             |
