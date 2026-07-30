# Private Voting dApp — Midnight Network

Anonymous ballots with publicly verifiable tallies, built on the Midnight blockchain.

> Level 3 — First Quarter Submission for the Midnight Moonshots program.

## Privacy Model

### What an observer CAN learn
- Total number of registered voters, final vote count per proposal, disclosed nullifiers, public ledger state

### What an observer CANNOT learn
- Which voter cast which vote, whether a specific address voted, the content of any individual ballot, the voter's secret key or authentication path, mapping between voters and commitments, any private witness data

### How it works
1. **Pedersen commitments** hide voter identity during registration
2. **Nullifier pattern** prevents double voting without linking votes to identities
3. **ZK proofs** ensure correctness without revealing private inputs
4. Only the nullifier is `disclose()`d publicly — nothing else ever touches the ledger

## Architecture
```
midnight-moonshot/
├── packages/
│   ├── contract/          # Compact smart contract + tests
│   ├── ui/                # React + Vite frontend
│   └── cli/               # Deployment scripts
├── .github/workflows/     # CI/CD
└── docker-compose.yml     # Local devnet
```

## Prerequisites
- Node.js 22+, Docker Desktop, Compact CLI 0.31.0, Lace Wallet

## Getting Started
```bash
npm install
docker compose up -d
npm run compile
npm run test:unit
npm run dev
```

## Tests (6 passing)
| Test | Description |
|------|-------------|
| Register voter | Creates a voter commitment in the Merkle tree |
| Registered voter can vote | Allows voting after valid registration |
| Reject double voting | Nullifier prevents second vote |
| Reject unregistered voter | Non-members cannot cast ballots |
| Track votes per proposal | Multiple votes accumulate correctly |
| Zero votes for unknown proposal | Query returns 0 |

## CI/CD
`.github/workflows/ci.yml` — unit tests, integration tests on every push/PR.

## Product Proposal
> **Idea**: Private Voting — anonymous ballots with publicly verifiable tallies
> **Target**: DAOs, governance committees, community votes
> **Differentiator**: ZK proofs ensure vote privacy while maintaining public verifiability
