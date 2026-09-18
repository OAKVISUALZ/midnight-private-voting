import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  registerVoter(context: __compactRuntime.CircuitContext<PS>,
                voterSecret_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  castVote(context: __compactRuntime.CircuitContext<PS>,
           voterSecret_0: bigint,
           authPath_0: { leaf: bigint,
                         path: { sibling: { field: bigint }, goes_left: boolean
                               }[]
                       },
           proposalId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerVoter(context: __compactRuntime.CircuitContext<PS>,
                voterSecret_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  castVote(context: __compactRuntime.CircuitContext<PS>,
           voterSecret_0: bigint,
           authPath_0: { leaf: bigint,
                         path: { sibling: { field: bigint }, goes_left: boolean
                               }[]
                       },
           proposalId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  registerVoter(context: __compactRuntime.CircuitContext<PS>,
                voterSecret_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  castVote(context: __compactRuntime.CircuitContext<PS>,
           voterSecret_0: bigint,
           authPath_0: { leaf: bigint,
                         path: { sibling: { field: bigint }, goes_left: boolean
                               }[]
                       },
           proposalId_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  proposals: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): { read(): bigint }
  };
  voterCommitments: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: bigint): __compactRuntime.MerkleTreePath<bigint>;
    findPathForLeaf(leaf_0: bigint): __compactRuntime.MerkleTreePath<bigint> | undefined
  };
  nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: bigint): boolean;
    [Symbol.iterator](): Iterator<bigint>
  };
  readonly votingOpen: boolean;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>, open_0: boolean): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
