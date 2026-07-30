import type { PrivateVotingWitnesses } from '../managed/private-voting/contract/index.js';

export interface VotingPrivateState {
  voterSecret?: Uint8Array;
}

export const witnesses: PrivateVotingWitnesses = {
  registerVoter: (ctx) => {
    const { voterSecret } = ctx.privateState;
    if (!voterSecret) throw new Error('voterSecret required');
    return { voterSecret };
  },
  castVote: (ctx) => {
    const { voterSecret } = ctx.privateState;
    if (!voterSecret) throw new Error('voterSecret required');
    return { voterSecret };
  },
};
