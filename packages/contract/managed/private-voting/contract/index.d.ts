export interface VotingLedgerState {
  proposals: Map<number, bigint>;
  voterCommitments: {
    leaves: Uint8Array[];
    depth: number;
    size(): bigint;
    checkMembership(value: Uint8Array, proof: unknown): boolean;
  };
  nullifiers: {
    insert(value: Uint8Array): void;
    member(value: Uint8Array): boolean;
  };
  votingOpen: boolean;
}

export interface PrivateVotingWitnesses {
  registerVoter(ctx: { privateState: { voterSecret?: Uint8Array } }): { voterSecret: Uint8Array };
  castVote(ctx: { privateState: { voterSecret?: Uint8Array } }): { voterSecret: Uint8Array };
}

export declare class PrivateVotingContract {
  constructor(witnesses: PrivateVotingWitnesses);
  impureCircuits: {
    registerVoter(ctx: { privateState: { voterSecret?: Uint8Array }; ledgerState: VotingLedgerState }): { newLedgerState: VotingLedgerState };
    castVote(ctx: { privateState: { voterSecret?: Uint8Array }; ledgerState: VotingLedgerState; proposalId: number }): { newLedgerState: VotingLedgerState };
  };
  queries: {
    getProposalVotes(ctx: { proposalId: number; ledgerState: VotingLedgerState }): bigint;
    getTotalVoters(ctx: { ledgerState: VotingLedgerState }): bigint;
    isNullifierUsed(ctx: { nullifier: Uint8Array; ledgerState: VotingLedgerState }): boolean;
  };
}
