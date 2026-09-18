import { describe, it, expect } from 'vitest';
import { Contract as PrivateVotingContract } from '../managed/private-voting/contract/index.js';

// The contract declares no `witness` functions; all circuit parameters are
// public, so an empty witnesses object is valid.
describe('PrivateVotingContract (compiled 0.31 bindings)', () => {
  it('constructs with no declared witnesses', () => {
    const contract = new PrivateVotingContract({});
    expect(typeof contract.circuits.registerVoter).toBe('function');
    expect(typeof contract.circuits.castVote).toBe('function');
    expect(typeof contract.impureCircuits.castVote).toBe('function');
  });

  it('exposes the constructor state initializer for deployment', () => {
    const contract = new PrivateVotingContract({});
    expect(typeof contract.initialState).toBe('function');
  });
});