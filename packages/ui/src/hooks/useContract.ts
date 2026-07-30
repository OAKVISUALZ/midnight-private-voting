import { useState, useCallback } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { buildProviders } from '../providers.js';
import { VotingContractAPI, type ProposalVotes } from '../voting.js';

export interface ContractState {
  contract: VotingContractAPI | null;
  contractAddress: string | null;
  providers: MidnightProviders | null;
  isDeploying: boolean;
  isRegistering: boolean;
  isVoting: boolean;
  proposalVotes: ProposalVotes[];
  totalVoters: bigint;
  error: string | null;
}

export function useContract() {
  const [state, setState] = useState<ContractState>({
    contract: null,
    contractAddress: null,
    providers: null,
    isDeploying: false,
    isRegistering: false,
    isVoting: false,
    proposalVotes: [],
    totalVoters: 0n,
    error: null,
  });

  const deploy = useCallback(async (walletAPI: ConnectedAPI, walletAddress: string) => {
    setState(prev => ({ ...prev, isDeploying: true, error: null }));
    try {
      const providers = await buildProviders(walletAPI, walletAddress);
      const voting = await VotingContractAPI.deploy(providers, walletAPI);
      setState(prev => ({
        ...prev,
        contract: voting,
        contractAddress: voting.getAddress(),
        providers,
        isDeploying: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isDeploying: false,
        error: err instanceof Error ? err.message : 'Deployment failed',
      }));
    }
  }, []);

  const joinExisting = useCallback(async (
    walletAPI: ConnectedAPI,
    walletAddress: string,
    contractAddress: string,
  ) => {
    setState(prev => ({ ...prev, error: null }));
    try {
      const providers = await buildProviders(walletAPI, walletAddress);
      const voting = await VotingContractAPI.join(providers, contractAddress);
      setState(prev => ({
        ...prev,
        contract: voting,
        contractAddress,
        providers,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to join contract',
      }));
    }
  }, []);

  const registerVoter = useCallback(async () => {
    if (!state.contract) return;
    setState(prev => ({ ...prev, isRegistering: true, error: null }));
    try {
      await state.contract.registerVoter();
      const totalVoters = await state.contract.getTotalVoters();
      setState(prev => ({ ...prev, isRegistering: false, totalVoters }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isRegistering: false,
        error: err instanceof Error ? err.message : 'Registration failed',
      }));
    }
  }, [state.contract]);

  const castVote = useCallback(async (proposalId: number) => {
    if (!state.contract) return;
    setState(prev => ({ ...prev, isVoting: true, error: null }));
    try {
      await state.contract.castVote(proposalId);
      const votes = await state.contract.getAllProposalVotes([1, 2, 3]);
      setState(prev => ({ ...prev, isVoting: false, proposalVotes: votes }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isVoting: false,
        error: err instanceof Error ? err.message : 'Vote failed',
      }));
    }
  }, [state.contract]);

  const refreshResults = useCallback(async () => {
    if (!state.contract) return;
    try {
      const [votes, totalVoters] = await Promise.all([
        state.contract.getAllProposalVotes([1, 2, 3]),
        state.contract.getTotalVoters(),
      ]);
      setState(prev => ({ ...prev, proposalVotes: votes, totalVoters }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to refresh',
      }));
    }
  }, [state.contract]);

  return { ...state, deploy, joinExisting, registerVoter, castVote, refreshResults };
}
