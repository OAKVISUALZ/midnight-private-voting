import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

export type DemoCircuits = 'registerVoter' | 'castVote';

export type DemoProviders = MidnightProviders;

export interface DemoContract {
  registerVoter: (args: { privateState: { voterSecret?: Uint8Array }; ledgerState: unknown }) => { newLedgerState: unknown };
  castVote: (args: { privateState: { voterSecret?: Uint8Array }; ledgerState: unknown; proposalId: number }) => { newLedgerState: unknown };
}

export function createSimpleContractInstance(): DemoContract {
  return {
    registerVoter: ({ privateState, ledgerState }) => {
      const secret = privateState.voterSecret ?? new Uint8Array(32);
      return {
        newLedgerState: {
          ...(ledgerState as object),
          voterCommitments: {
            ...((ledgerState as any)?.voterCommitments ?? {}),
            leaves: [...(((ledgerState as any)?.voterCommitments?.leaves) ?? []), secret],
          },
        },
      };
    },
    castVote: ({ privateState, ledgerState, proposalId }) => {
      const ledger = ledgerState as any;
      const secret = privateState.voterSecret ?? new Uint8Array(32);
      const newProposals = new Map(ledger.proposals ?? []);
      newProposals.set(proposalId, (newProposals.get(proposalId) ?? 0n) + 1n);
      return {
        newLedgerState: {
          ...ledger,
          proposals: newProposals,
          nullifiers: {
            ...ledger.nullifiers,
            _items: new Set([...((ledger.nullifiers?._items) ?? []), secret.join(',')]),
          },
        },
      };
    },
  };
}
