import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { VotingLedgerState } from '@midnight-private-voting/contract/managed/private-voting/contract/index.js';

const CONTRACT_CODE =
  '0000000000000000000000000000000000000000000000000000000000000000';

const CONTRACT_LEDGER_DESCRIPTORS = {
  proposals: { type: 'map', key: 'uint8', value: 'uint64' },
  voterCommitments: { type: 'merkle-tree', depth: 20 },
  nullifiers: { type: 'set' },
  votingOpen: { type: 'bool' },
} as const;

const CONTRACT_CIRCUIT_DESCRIPTORS = [
  { name: 'registerVoter', params: ['voterSecret'], isImpure: true },
  { name: 'castVote', params: ['voterSecret', 'authPath', 'proposalId'], isImpure: true },
] as const;

const CONTRACT_QUERY_DESCRIPTORS = [
  { name: 'getProposalVotes', params: ['proposalId'] },
  { name: 'getTotalVoters', params: [] },
  { name: 'isNullifierUsed', params: ['nullifier'] },
] as const;

const compiledContract = {
  contract: 'private-voting',
  version: '0.1.0',
  code: { bytecode: CONTRACT_CODE },
  ledgerDescriptors: CONTRACT_LEDGER_DESCRIPTORS,
  circuitDescriptors: CONTRACT_CIRCUIT_DESCRIPTORS,
  queryDescriptors: CONTRACT_QUERY_DESCRIPTORS,
};

export interface ProposalVotes {
  id: number;
  votes: bigint;
}

export class VotingContractAPI {
  private constructor(
    private providers: MidnightProviders,
    private contractAddress: string,
  ) {}

  static async deploy(providers: MidnightProviders, _walletAPI: ConnectedAPI): Promise<VotingContractAPI> {
    const voterSecret = crypto.getRandomValues(new Uint8Array(32));

    const deployed = await deployContract(providers, {
      compiledContract,
      privateStateId: `private-voting-${Date.now()}`,
      initialPrivateState: { voterSecret },
    });

    const contractAddress = deployed.deployTxData.public.contractAddress;
    return new VotingContractAPI(providers, contractAddress);
  }

  static async join(
    providers: MidnightProviders,
    contractAddress: string,
  ): Promise<VotingContractAPI> {
    return new VotingContractAPI(providers, contractAddress);
  }

  getAddress(): string {
    return this.contractAddress;
  }

  async registerVoter(): Promise<void> {
    const contract = await findDeployedContract(providers, {
      contractAddress: this.contractAddress,
      compiledContract,
      privateStateId: `private-voting-${this.contractAddress.slice(0, 8)}`,
      initialPrivateState: {},
    });
    await contract.callTx.registerVoter();
  }

  async castVote(proposalId: number): Promise<void> {
    const contract = await findDeployedContract(providers, {
      contractAddress: this.contractAddress,
      compiledContract,
      privateStateId: `private-voting-${this.contractAddress.slice(0, 8)}`,
      initialPrivateState: {},
    });

    const ledger = await contract.query.getCurrentLedgerState();
    const authPath = await this.buildAuthPath(ledger);
    await contract.callTx.castVote(proposalId, authPath);
  }

  private async buildAuthPath(_ledger: VotingLedgerState): Promise<Uint8Array[]> {
    return [];
  }

  async getProposalVotes(proposalId: number): Promise<bigint> {
    const contract = await findDeployedContract(providers, {
      contractAddress: this.contractAddress,
      compiledContract,
      privateStateId: `private-voting-${this.contractAddress.slice(0, 8)}`,
      initialPrivateState: {},
    });
    return contract.query.getProposalVotes(proposalId);
  }

  async getTotalVoters(): Promise<bigint> {
    const contract = await findDeployedContract(providers, {
      contractAddress: this.contractAddress,
      compiledContract,
      privateStateId: `private-voting-${this.contractAddress.slice(0, 8)}`,
      initialPrivateState: {},
    });
    return contract.query.getTotalVoters();
  }

  async getAllProposalVotes(proposalIds: number[]): Promise<ProposalVotes[]> {
    const results: ProposalVotes[] = [];
    for (const id of proposalIds) {
      const votes = await this.getProposalVotes(id);
      results.push({ id, votes });
    }
    return results;
  }
}
