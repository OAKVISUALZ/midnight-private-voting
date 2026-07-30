export { witnesses, type VotingPrivateState } from './witnesses.js';
export const zkConfigPath = new URL('../managed/private-voting', import.meta.url).pathname;

export const compiledContract = {
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
