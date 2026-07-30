import { describe, it, expect, beforeEach } from 'vitest';
import { PrivateVotingContract } from '../managed/private-voting/contract/index.js';

function createEmptyLedger() {
  return {
    proposals: new Map(),
    voterCommitments: {
      leaves: [] as Uint8Array[],
      depth: 20,
      size() { return BigInt(this.leaves.length); },
      checkMembership(value: Uint8Array, _proof: unknown) {
        return this.leaves.some((l: Uint8Array) => {
          if (l.length !== value.length) return false;
          return l.every((b, i) => b === value[i]);
        });
      },
    },
    nullifiers: {
      _items: new Set<string>(),
      insert(value: Uint8Array) { this._items.add(Array.from(value).join(',')); },
      member(value: Uint8Array) { return this._items.has(Array.from(value).join(',')); },
    },
    votingOpen: true,
  };
}

function makeWitnesses() {
  return {
    registerVoter: (ctx: { privateState: { voterSecret?: Uint8Array } }) => {
      if (!ctx.privateState.voterSecret) throw new Error('voterSecret required');
      return { voterSecret: ctx.privateState.voterSecret };
    },
    castVote: (ctx: { privateState: { voterSecret?: Uint8Array } }) => {
      if (!ctx.privateState.voterSecret) throw new Error('voterSecret required');
      return { voterSecret: ctx.privateState.voterSecret };
    },
  };
}

const aliceSecret = new Uint8Array([1, 2, 3]);
const bobSecret = new Uint8Array([4, 5, 6]);

describe('PrivateVotingContract', () => {
  let contract: PrivateVotingContract;
  let ledger: ReturnType<typeof createEmptyLedger>;

  beforeEach(() => {
    contract = new PrivateVotingContract(makeWitnesses());
    ledger = createEmptyLedger();
  });

  it('should register a voter', () => {
    const result = contract.impureCircuits.registerVoter({
      privateState: { voterSecret: aliceSecret },
      ledgerState: ledger,
    });
    expect(result.newLedgerState.voterCommitments.size()).toBe(1n);
  });

  it('should allow a registered voter to cast a vote', () => {
    const regResult = contract.impureCircuits.registerVoter({
      privateState: { voterSecret: aliceSecret },
      ledgerState: ledger,
    });
    ledger = regResult.newLedgerState;

    const voteResult = contract.impureCircuits.castVote({
      privateState: { voterSecret: aliceSecret },
      ledgerState: ledger,
      proposalId: 1,
    });
    expect(voteResult.newLedgerState.proposals.get(1)).toBe(1n);
  });

  it('should reject double voting', () => {
    ledger = contract.impureCircuits.registerVoter({
      privateState: { voterSecret: aliceSecret },
      ledgerState: ledger,
    }).newLedgerState;

    ledger = contract.impureCircuits.castVote({
      privateState: { voterSecret: aliceSecret },
      ledgerState: ledger,
      proposalId: 1,
    }).newLedgerState;

    expect(() => {
      contract.impureCircuits.castVote({
        privateState: { voterSecret: aliceSecret },
        ledgerState: ledger,
        proposalId: 1,
      });
    }).toThrow('Already voted');
  });

  it('should reject votes from unregistered voters', () => {
    expect(() => {
      contract.impureCircuits.castVote({
        privateState: { voterSecret: bobSecret },
        ledgerState: ledger,
        proposalId: 1,
      });
    }).toThrow('Voter not registered');
  });

  it('should track votes per proposal correctly', () => {
    ledger = contract.impureCircuits.registerVoter({
      privateState: { voterSecret: aliceSecret }, ledgerState: ledger,
    }).newLedgerState;
    ledger = contract.impureCircuits.registerVoter({
      privateState: { voterSecret: bobSecret }, ledgerState: ledger,
    }).newLedgerState;

    ledger = contract.impureCircuits.castVote({
      privateState: { voterSecret: aliceSecret }, ledgerState: ledger, proposalId: 1,
    }).newLedgerState;
    ledger = contract.impureCircuits.castVote({
      privateState: { voterSecret: bobSecret }, ledgerState: ledger, proposalId: 1,
    }).newLedgerState;

    expect(ledger.proposals.get(1)).toBe(2n);
  });

  it('should report zero votes for proposals with no votes', () => {
    expect(contract.queries.getProposalVotes({ proposalId: 99, ledgerState: ledger })).toBe(0n);
  });
});
