import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { nodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { createLogger } from '@midnight-ntwrk/midnight-js-logger-provider';
import { randomBytes } from 'crypto';

const NETWORK = process.env.MIDNIGHT_NETWORK || 'preprod';
const PROOF_SERVER = process.env.MN_PROOF_SERVER_URL || 'http://localhost:6300';
const INDEXER_URL = process.env.MN_INDEXER_URL || 'https://indexer.preprod.midnight.network';
const SEED = process.env.MN_SEED;

const compiledContract = {
  contract: 'private-voting',
  version: '0.1.0',
  ledgerDescriptors: {
    proposals: { type: 'map', key: 'uint8', value: 'uint64' },
    voterCommitments: { type: 'merkle-tree', depth: 20 },
    nullifiers: { type: 'set' },
    votingOpen: { type: 'bool' },
  },
  circuitDescriptors: [
    { name: 'registerVoter', params: ['voterSecret'], isImpure: true },
    { name: 'castVote', params: ['voterSecret', 'authPath', 'proposalId'], isImpure: true },
  ],
  queryDescriptors: [
    { name: 'getProposalVotes', params: ['proposalId'] },
    { name: 'getTotalVoters', params: [] },
    { name: 'isNullifierUsed', params: ['nullifier'] },
  ],
} as const;

async function main() {
  if (!SEED) {
    console.error('Error: MN_SEED environment variable is required');
    console.error('Set it to your Lace wallet seed phrase');
    process.exit(1);
  }

  console.log(`Deploying PrivateVoting contract to ${NETWORK}...`);
  setNetworkId(NETWORK);

  const logger = createLogger();

  const zkConfigProvider = nodeZkConfigProvider(
    new URL('../contract/managed/private-voting', import.meta.url).pathname,
  );

  const proofProvider = httpClientProofProvider(PROOF_SERVER, zkConfigProvider);

  const accountId = `voter-${randomBytes(8).toString('hex')}`;

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStoragePasswordProvider: () => SEED.slice(0, 32),
      accountId,
    }),
    publicDataProvider: indexerPublicDataProvider(INDEXER_URL),
    zkConfigProvider,
    proofProvider,
    logger,
  };

  const contractInstance = {
    registerVoter: () => ({ newLedgerState: {} }),
    castVote: () => ({ newLedgerState: {} }),
  };

  const deployed = await deployContract(providers, {
    compiledContract,
    contractInstance,
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;
  console.log(`Contract deployed successfully!`);
  console.log(`Address: ${contractAddress}`);
  console.log(`Network: ${NETWORK}`);
  console.log(`\nVerify: https://explorer.${NETWORK}.midnight.network/contracts/${contractAddress}`);
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
