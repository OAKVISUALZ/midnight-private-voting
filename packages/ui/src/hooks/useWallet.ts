import { useState, useCallback, useEffect } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export interface WalletState {
  api: ConnectedAPI | null;
  address: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    api: null,
    address: null,
    balance: null,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      const wallets = Object.values(window.midnight ?? {});
      if (wallets.length === 0) {
        throw new Error('No Midnight wallet detected. Please install Lace wallet.');
      }

      const wallet = wallets[0];
      const api = await wallet.connect('preprod');
      const walletState = await api.state();

      const addr = walletState.address || walletState.shieldedAddresses?.[0] || 'unknown';
      const bal = walletState.balances?.total?.toString() ?? null;

      setState({
        api,
        address: addr,
        balance: bal,
        isConnecting: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err.message : 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      api: null,
      address: null,
      balance: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    const checkWallet = () => {
      if (!window.midnight || Object.keys(window.midnight).length === 0) {
        setState(prev => ({
          ...prev,
          error: 'Lace wallet not detected. Please install the extension.',
        }));
      }
    };
    const timer = setTimeout(checkWallet, 500);
    return () => clearTimeout(timer);
  }, []);

  return { ...state, connect, disconnect };
}
