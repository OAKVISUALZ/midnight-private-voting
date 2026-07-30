import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { WalletProvider, UnboundTransaction, ZKConfigProvider } from '@midnight-ntwrk/midnight-js-types';
import { Transaction, type FinalizedTransaction, type Proof, type Binding, type SignatureEnabled } from '@midnight-ntwrk/ledger-v8';

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToUint8Array(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/, '');
  const matches = cleaned.match(/.{1,2}/g);
  return matches ? new Uint8Array(matches.map(b => parseInt(b, 16))) : new Uint8Array();
}

export function createWalletProvidersFromConnectedAPI(
  connectedAPI: ConnectedAPI,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  _proofProvider: any,
  _zkConfigProvider: ZKConfigProvider<string>,
  shieldedCoinPublicKey: string,
  _unshieldedAddress: string,
) {
  const walletProvider: WalletProvider = {
    getCoinPublicKey() {
      return shieldedCoinPublicKey;
    },
    getEncryptionPublicKey() {
      return shieldedCoinPublicKey;
    },
    async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
      const serialized = tx.serialize();
      const serializedStr = uint8ArrayToHex(serialized);
      const result = await connectedAPI.balanceUnsealedTransaction(serializedStr);
      const resultBytes = hexToUint8Array(result.tx);
      return Transaction.deserialize('signature', 'proof', 'binding', resultBytes) as FinalizedTransaction;
    },
  };

  const midnightProvider = {
    async submitTx(tx: FinalizedTransaction): Promise<string> {
      const serialized = tx.serialize();
      const serializedStr = uint8ArrayToHex(serialized);
      await connectedAPI.submitTransaction(serializedStr);
      return tx.identifiers()[0];
    },
  };

  return { walletProvider, midnightProvider };
}
