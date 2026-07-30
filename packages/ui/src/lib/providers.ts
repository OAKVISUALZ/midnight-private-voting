import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { createWalletProvidersFromConnectedAPI } from './walletAdapter.js';

export async function buildProviders(
  connectedAPI: ConnectedAPI,
): Promise<MidnightProviders> {
  const config = await connectedAPI.getConfiguration();

  const shieldedAddresses = await connectedAPI.getShieldedAddresses();
  const unshieldedAddress = await connectedAPI.getUnshieldedAddress();

  const shieldedAddr = shieldedAddresses.shieldedAddress;
  const unshieldedAddr = unshieldedAddress.unshieldedAddress;

  const zkConfigProvider = new FetchZkConfigProvider(
    `${config.indexerUri}/zk-artifacts`,
    fetch.bind(window),
  );

  const proofProvider = httpClientProofProvider(
    config.proverServerUri!,
    zkConfigProvider,
  );

  const { walletProvider, midnightProvider } = createWalletProvidersFromConnectedAPI(
    connectedAPI,
    proofProvider,
    zkConfigProvider,
    shieldedAddresses.shieldedCoinPublicKey,
    unshieldedAddr,
  );

  const privateStateProvider = levelPrivateStateProvider({
    privateStoragePasswordProvider: () => 'private-voting-demo-storage-password',
    accountId: shieldedAddr,
  });

  const publicDataProvider = indexerPublicDataProvider(
    config.indexerUri,
    config.indexerWsUri,
  );

  return {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  };
}
