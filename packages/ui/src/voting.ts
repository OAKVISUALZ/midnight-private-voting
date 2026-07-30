import { deployContract, findDeployedContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DemoContract, DemoCircuits } from './lib/types.js';

export interface ProposalVotes {
  id: number;
  votes: bigint;
}

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

export class VotingContractAPI {
  private constructor(
    private providers: MidnightProviders,
    private foundContract: FoundContract<DemoContract>,
  ) {}

  static async deploy(providers: MidnightProviders): Promise<VotingContractAPI> {
    setNetworkId('preprod');
    const contractInstance: DemoContract = {
      registerVoter: () => ({ newLedgerState: {} }),
      castVote: () => ({ newLedgerState: {} }),
    };
    const found = await deployContract(providers, {
      compiledContract,
      contractInstance,
    });
    return new VotingContractAPI(providers, found);
  }

  static async join(
    providers: MidnightProviders,
    contractAddress: string,
  ): Promise<VotingContractAPI> {
    setNetworkId('preprod');
    const contractInstance: DemoContract = {
      registerVoter: () => ({ newLedgerState: {} }),
      castVote: () => ({ newLedgerState: {} }),
    };
    const found = await findDeployedContract(providers, {
      compiledContract,
      contractAddress,
      contractInstance,
    });
    return new VotingContractAPI(providers, found);
  }

  getAddress(): string {
    return this.foundContract.deployTxData.public.contractAddress;
  }

  async registerVoter(): Promise<void> {
    await submitCallTx(this.providers, {
      compiledContract,
      contractAddress: this.getAddress(),
      circuitId: 'registerVoter' as DemoCircuits,
      args: [],
    });
  }

  async castVote(proposalId: number): Promise<void> {
    await submitCallTx(this.providers, {
      compiledContract,
      contractAddress: this.getAddress(),
      circuitId: 'castVote' as DemoCircuits,
      args: [proposalId],
    });
  }

  async queryProposalVotes(proposalId: number): Promise<bigint> {
    return this.foundContract.query.getProposalVotes(proposalId);
  }

  async queryTotalVoters(): Promise<bigint> {
    return this.foundContract.query.getTotalVoters();
  }

  async getAllProposalVotes(proposalIds: number[]): Promise<ProposalVotes[]> {
    const results: ProposalVotes[] = [];
    for (const id of proposalIds) {
      const votes = await this.queryProposalVotes(id);
      results.push({ id, votes });
    }
    return results;
  }
}
