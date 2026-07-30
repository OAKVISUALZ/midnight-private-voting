import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { nodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { deployContract, findDeployedContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
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

async function buildProviders() {
  const accountId = `voter-${randomBytes(4).toString('hex')}`;
  const zkConfigProvider = nodeZkConfigProvider(
    new URL('../contract/managed/private-voting', import.meta.url).pathname,
  );
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStoragePasswordProvider: () => SEED?.slice(0, 32) ?? 'default-password',
      accountId,
    }),
    publicDataProvider: indexerPublicDataProvider(INDEXER_URL),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(PROOF_SERVER, zkConfigProvider),
    logger: createLogger(),
  };
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!SEED) {
    console.error('Error: MN_SEED environment variable is required');
    process.exit(1);
  }

  setNetworkId(NETWORK);
  const providers = await buildProviders();

  switch (command) {
    case 'deploy': {
      console.log('Deploying contract...');
      const contractInstance = {
        registerVoter: () => ({ newLedgerState: {} }),
        castVote: () => ({ newLedgerState: {} }),
      };
      const deployed = await deployContract(providers, { compiledContract, contractInstance });
      console.log(`Contract deployed at: ${deployed.deployTxData.public.contractAddress}`);
      break;
    }
    case 'register': {
      const contractAddress = args[0];
      if (!contractAddress) { console.error('Usage: interact register <contract-address>'); process.exit(1); }
      console.log(`Registering voter on contract ${contractAddress}...`);
      await submitCallTx(providers, {
        compiledContract,
        contractAddress,
        circuitId: 'registerVoter',
        args: [],
      });
      console.log('Registered successfully');
      break;
    }
    case 'vote': {
      const [contractAddress, proposalId] = args;
      if (!contractAddress || !proposalId) { console.error('Usage: interact vote <contract-address> <proposal-id>'); process.exit(1); }
      console.log(`Casting vote for proposal ${proposalId}...`);
      await submitCallTx(providers, {
        compiledContract,
        contractAddress,
        circuitId: 'castVote',
        args: [Number(proposalId)],
      });
      console.log('Vote cast successfully');
      break;
    }
    case 'results': {
      const contractAddress = args[0];
      if (!contractAddress) { console.error('Usage: interact results <contract-address>'); process.exit(1); }
      const contract = await findDeployedContract(providers, {
        compiledContract,
        contractAddress,
        contractInstance: { registerVoter: () => ({ newLedgerState: {} }), castVote: () => ({ newLedgerState: {} }) },
      });
      const [p1, p2, p3, total] = await Promise.all([
        contract.query.getProposalVotes(1),
        contract.query.getProposalVotes(2),
        contract.query.getProposalVotes(3),
        contract.query.getTotalVoters(),
      ]);
      console.log(`Total voters: ${total}`);
      console.log(`Proposal 1: ${p1} votes`);
      console.log(`Proposal 2: ${p2} votes`);
      console.log(`Proposal 3: ${p3} votes`);
      break;
    }
    default:
      console.log(`
Usage: interact <command> [args]

Commands:
  deploy                                Deploy a new contract
  register <contract-address>           Register as a voter
  vote    <contract-address> <prop-id>  Cast a vote for a proposal
  results <contract-address>            Show voting results
      `);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
