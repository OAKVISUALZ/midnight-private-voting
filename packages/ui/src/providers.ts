import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

export interface ServiceConfig {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  substrateNodeUri: string;
}

export function createLoggerProvider() {
  if (typeof console !== 'undefined') {
    return { info: console.info, warn: console.warn, error: console.error, debug: console.debug };
  }
  return { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} };
}

export async function buildProviders(
  walletAPI: ConnectedAPI,
  walletAddress: string,
): Promise<MidnightProviders> {
  const config: ServiceConfig = await walletAPI.serviceUriConfig();

  setNetworkId('preprod');

  const password = `private-vault-${walletAddress.slice(0, 16)}`;

  const zkConfigProvider = new FetchZkConfigProvider(
    `${config.indexerUri}/zk-artifacts`,
  );

  const proofProvider = dappConnectorProofProvider(walletAPI, zkConfigProvider);

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStoragePasswordProvider: () => password,
      accountId: walletAddress,
    }),
    publicDataProvider: indexerPublicDataProvider(
      config.indexerUri,
      config.indexerWsUri,
    ),
    zkConfigProvider,
    proofProvider,
  };
}
