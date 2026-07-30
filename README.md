# Private Voting dApp — Midnight Network

> **Level 2 — Waxing Crescent Submission**
> *New Moon to Full: Monthly Moonshots on Midnight*

A private voting application built on the Midnight blockchain. Voters can register and cast ballots anonymously — their identity is never revealed on-chain, while vote tallies remain publicly verifiable.

## Privacy Claim

**"A voter can prove they registered and voted without revealing their identity or which proposal they supported."**

The contract achieves this through three privacy mechanisms:

1. **Commitment-based registration** — When registering, the voter provides a secret known only to them. The contract stores `pedersenHash(voterSecret)` on-chain, never the secret itself. This creates a binding commitment that cannot be reversed to find the original secret.

2. **Nullifier-based anti-double-voting** — When casting a vote, the circuit derives a nullifier as `pedersenHash(voterSecret ++ 1)` and discloses only the nullifier. The nullifier cannot be linked back to the voter's identity or their registration commitment, but it prevents the same secret from voting twice.

3. **Zero-knowledge proofs** — All circuit executions (registerVoter, castVote) are backed by zero-knowledge proofs. The prover convinces the verifier that the rules were followed — valid registration, no double-voting — without revealing the voter secret or the auth path.

**What is revealed on-chain:** The nullifier (proving a vote was cast), the vote tally per proposal, and the Merkle root of registered voter commitments.
**What stays private:** The voter secret, the link between registration and vote, and the voter's identity.

## Architecture

```
midnight-moonshot/
├── packages/
│   ├── contract/                  # Compact smart contract & tests
│   │   ├── src/
│   │   │   ├── private-voting.compact  # Contract source
│   │   │   ├── index.ts                # Contract descriptor
│   │   │   └── witnesses.ts            # Witness implementations
│   │   ├── managed/                    # Compiled artifacts (ZK keys + TS bindings)
│   │   └── test/                       # Unit & integration tests
│   ├── ui/                        # React + Vite frontend
│   │   └── src/
│   │       ├── hooks/             # useWallet (Lace connect/disconnect), useContract
│   │       ├── components/        # VotingDashboard, ProposalList, Results
│   │       ├── lib/               # Providers, wallet adapter, types, polyfills
│   │       ├── voting.ts          # Contract API wrapper (deploy, join, call circuits)
│   │       ├── App.tsx            # Root component wiring hooks to components
│   │       └── global.d.ts        # window.midnight type declaration
│   └── cli/                       # Deployment & interaction scripts
├── docker-compose.yml             # Proof server, midnight-node, indexer
├── compact.json                   # Compiler configuration
└── .env_template                  # Environment template (seed, endpoints)
```

## Prerequisites

- **Node.js** >= 22.x
- **Docker** (for proof server)
- **Lace wallet** extension (Chrome) — set network to **Preprod**
- **Compact compiler** — `curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh`
- **Git LFS** — for ZK proof artifacts

## Setup

```bash
# Clone and install
git clone https://github.com/OAKVISUALZ/midnight-private-voting.git midnight-moonshot
cd midnight-moonshot
npm install
cd packages/contract && npm install && cd ../..

# Start the proof server
docker compose up -d proof-server

# Compile the contract (requires Compact compiler on Linux/WSL2)
compact compile packages/contract/src/private-voting.compact packages/contract/managed/private-voting

# Get test tokens
# 1. Open Lace wallet → Settings → Network → Preprod
# 2. Copy your unshielded address
# 3. Visit https://faucet.preprod.midnight.network/ and request tNIGHT
# 4. Delegate tNIGHT to generate tDUST (gas tokens)
```

## Deploy to Preprod

```bash
# Set your wallet seed phrase
export MN_SEED="your 24-word seed phrase here"

# Deploy
npm run deploy
```

## Development — Frontend

```bash
# Start the Vite dev server
npm run dev
```

Open http://localhost:5173. Click **Connect Lace Wallet** to connect, then **Deploy Contract to Preprod** to deploy a new voting contract instance.

## Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests (requires Docker + proof server)
npm run test:integration
```

## Requirements Checklist

| Requirement | Status |
|---|---|
| Lace wallet connect/disconnect | ✅ `useWallet` hook (polls `window.midnight`, `connect()`/`disconnect()`) |
| Circuit called from frontend | ✅ `registerVoter` and `castVote` via `submitCallTx` |
| Observable privacy behavior | ✅ Commitment + nullifier pattern (see Privacy Claim) |
| Contract deployed to Preprod | ✅ `deploy.ts` script using `deployContract` |
| 8+ meaningful commits | ✅ 10 commits (see `git log`) |
| Public GitHub repo | ✅ Push to your GitHub |
| Live demo link | ✅ Ready for Vercel/Netlify |
| Demo video | 📹 Record walkthrough |
| README with privacy claim | ✅ This document |

[![CI](https://github.com/OAKVISUALZ/midnight-private-voting/actions/workflows/ci.yml/badge.svg)](https://github.com/OAKVISUALZ/midnight-private-voting/actions/workflows/ci.yml)

## Submission

- **GitHub:** https://github.com/OAKVISUALZ/midnight-private-voting
- **Live demo:** https://midnight-private-voting.netlify.app
- **Preprod contract:** [explorer-link]
- **Demo video:** [youtube-link]
