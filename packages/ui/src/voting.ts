import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

export interface ProposalVotes {
  id: number;
  votes: bigint;
}

const compiledContract = {
  tag: 'private-voting-0.1.0',
  contract: 'private-voting',
  version: '0.1.0',
} as const;

export class VotingContractAPI {
  private constructor(
    private providers: MidnightProviders,
    private contractAddress: string,
  ) {}

  static async deploy(providers: MidnightProviders): Promise<VotingContractAPI> {
    setNetworkId('preprod');
    const deployed = await (deployContract as any)(providers, {
      compiledContract,
    });
    const address: string = deployed.deployTxData.public.contractAddress;
    return new VotingContractAPI(providers, address);
  }

  static async join(providers: MidnightProviders, _contractAddress: string): Promise<VotingContractAPI> {
    setNetworkId('preprod');
    return new VotingContractAPI(providers, _contractAddress);
  }

  getAddress(): string {
    return this.contractAddress;
  }

  async registerVoter(): Promise<void> {
    await (deployContract as any)(this.providers, {
      compiledContract,
      contractAddress: this.contractAddress,
      circuitId: 'registerVoter',
    });
  }

  async castVote(proposalId: number): Promise<void> {
    await (deployContract as any)(this.providers, {
      compiledContract,
      contractAddress: this.contractAddress,
      circuitId: 'castVote',
      args: [proposalId],
    });
  }

  async queryProposalVotes(proposalId: number): Promise<bigint> {
    return (await (this.providers.publicDataProvider as any).queryContractState(this.contractAddress))?.[proposalId] ?? 0n;
  }

  async queryTotalVoters(): Promise<bigint> {
    const state = await (this.providers.publicDataProvider as any).queryContractState(this.contractAddress);
    return state?.voterCommitments?.size?.() ?? 0n;
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
