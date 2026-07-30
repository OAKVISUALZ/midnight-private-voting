import { useState, useCallback, useEffect } from 'react';
import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export interface WalletState {
  api: ConnectedAPI | null;
  initialAPI: InitialAPI | null;
  address: string | null;
  isConnecting: boolean;
  detecting: boolean;
  error: string | null;
}

function findWallets(): InitialAPI[] {
  const midnight = (window as { midnight?: Record<string, unknown> }).midnight;
  if (!midnight) return [];
  return Object.values(midnight).filter(
    (c): c is InitialAPI =>
      !!c &&
      typeof c === 'object' &&
      'name' in c &&
      'apiVersion' in c &&
      'connect' in c &&
      typeof (c as InitialAPI).connect === 'function',
  );
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    api: null,
    initialAPI: null,
    address: null,
    isConnecting: false,
    detecting: true,
    error: null,
  });
  const [availableWallets, setAvailableWallets] = useState<InitialAPI[]>([]);
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    let attempts = 0;
    const timer = setInterval(() => {
      const wallets = findWallets();
      if (wallets.length > 0) {
        setAvailableWallets(wallets);
        setDetecting(false);
        clearInterval(timer);
      } else if (++attempts > 40) {
        setDetecting(false);
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const connect = useCallback(async (networkId = 'preprod') => {
    const wallets = findWallets();
    if (wallets.length === 0) {
      setState(prev => ({ ...prev, error: 'No Lace wallet detected. Please install the Midnight extension.' }));
      return;
    }
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      const wallet = wallets[0];
      const api = await wallet.connect(networkId);
      const config = await api.getConfiguration();
      const unshielded = await api.getUnshieldedAddress();
      setState({
        api,
        initialAPI: wallet,
        address: unshielded.unshieldedAddress,
        isConnecting: false,
        detecting: false,
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
    setState({ api: null, initialAPI: null, address: null, isConnecting: false, detecting: false, error: null });
  }, []);

  return { ...state, availableWallets, connect, disconnect };
}
