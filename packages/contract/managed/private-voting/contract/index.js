export class PrivateVotingContract {
  constructor(witnesses) {
    this.witnesses = witnesses;
  }

  impureCircuits = {
    registerVoter: ({ privateState, ledgerState }) => {
      const { voterSecret } = this.witnesses.registerVoter({ privateState });
      const newLeaves = [...ledgerState.voterCommitments.leaves, voterSecret];
      return {
        newLedgerState: {
          ...ledgerState,
          voterCommitments: { ...ledgerState.voterCommitments, leaves: newLeaves },
        },
      };
    },

    castVote: ({ privateState, ledgerState, proposalId }) => {
      const { voterSecret } = this.witnesses.castVote({ privateState });
      if (!ledgerState.votingOpen) throw new Error('Voting is closed');
      if (!ledgerState.voterCommitments.checkMembership(voterSecret, null)) {
        throw new Error('Voter not registered');
      }
      const nullifier = new Uint8Array([...voterSecret, 1]);
      if (ledgerState.nullifiers.member(nullifier)) {
        throw new Error('Already voted');
      }
      ledgerState.nullifiers.insert(nullifier);
      const newProposals = new Map(ledgerState.proposals);
      newProposals.set(proposalId, (newProposals.get(proposalId) || 0n) + 1n);
      return {
        newLedgerState: {
          ...ledgerState,
          proposals: newProposals,
          nullifiers: ledgerState.nullifiers,
        },
      };
    },
  };

  queries = {
    getProposalVotes: ({ proposalId, ledgerState }) => {
      return ledgerState.proposals.get(proposalId) || 0n;
    },
    getTotalVoters: ({ ledgerState }) => {
      return ledgerState.voterCommitments.size();
    },
    isNullifierUsed: ({ nullifier, ledgerState }) => {
      return ledgerState.nullifiers.member(nullifier);
    },
  };
}
