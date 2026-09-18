/**
 * Network configuration + wallet-seed / deployment-record persistence.
 *
 * Ported from the working midnight-app deploy stack: same shape, but scoped
 * to the networks the Private Voting dApp targets, with the currently live
 * public Preprod endpoints. (Preprod node RPC is `rpc.preprod.midnight.network`;
 * the older `node.preprod.*` host does not resolve.)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

export type NetworkId = 'preprod' | 'preview' | 'undeployed';

export const NETWORK_IDS: readonly NetworkId[] = ['preprod', 'preview', 'undeployed'] as const;

export interface NetworkConfig {
  networkId: NetworkId;
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
  faucet: string | null;
}

export interface DeploymentRecord {
  address: string;
  deployedAt: string;
  deployer: string;
}

export interface NetworkState {
  version: 1;
  activeNetwork: NetworkId;
  wallets: Partial<Record<NetworkId, { seed: string; createdAt: string }>>;
  deployments: Partial<Record<NetworkId, DeploymentRecord>>;
}

export const STATE_FILE_NAME = '.midnight-state.json';
export const STATE_VERSION = 1 as const;

export const NETWORK_CONFIGS: Record<NetworkId, NetworkConfig> = {
  undeployed: {
    networkId: 'undeployed',
    indexer: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node: 'ws://127.0.0.1:9944',
    proofServer: 'http://127.0.0.1:6300',
    faucet: null,
  },
  preview: {
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preview.midnight.network',
    proofServer: 'https://proof-server.preview.midnight.network',
    faucet: 'https://faucet.preview.midnight.network',
  },
  preprod: {
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preprod.midnight.network',
    proofServer: 'https://proof-server.preprod.midnight.network',
    faucet: 'https://faucet.preprod.midnight.network',
  },
};

export function isNetworkId(v: unknown): v is NetworkId {
  return typeof v === 'string' && (NETWORK_IDS as readonly string[]).includes(v);
}

export interface FsOptions {
  cwd?: string;
}

function statePath(opts: FsOptions = {}): string {
  return path.join(opts.cwd ?? process.cwd(), STATE_FILE_NAME);
}

export function loadState(opts: FsOptions = {}): NetworkState | null {
  const p = statePath(opts);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse ${p}: ${(e as Error).message}. Delete the file to reset.`);
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as { version?: unknown }).version !== STATE_VERSION
  ) {
    throw new Error(`Unsupported state-file version in ${p} (expected ${STATE_VERSION}).`);
  }
  if (!isNetworkId((parsed as { activeNetwork?: unknown }).activeNetwork)) {
    throw new Error(`Invalid activeNetwork in ${p}.`);
  }
  return parsed as NetworkState;
}

export function saveState(state: NetworkState, opts: FsOptions = {}): void {
  const p = statePath(opts);
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`);
  fs.renameSync(tmp, p);
}

function resolveNetworkId(env: NodeJS.ProcessEnv): NetworkId {
  const v = env.MIDNIGHT_NETWORK ?? 'preprod';
  if (!isNetworkId(v)) throw new Error(`Unknown MIDNIGHT_NETWORK: ${v}`);
  return v;
}

const ENV_OVERRIDES: Array<[keyof NetworkConfig, string]> = [
  ['indexer', 'MIDNIGHT_INDEXER_URL'],
  ['indexerWS', 'MIDNIGHT_INDEXER_WS_URL'],
  ['node', 'MIDNIGHT_NODE_URL'],
  ['faucet', 'MIDNIGHT_FAUCET_URL'],
  ['proofServer', 'MIDNIGHT_PROOF_SERVER_URL'],
];

export function resolveNetwork(env: NodeJS.ProcessEnv = process.env): NetworkConfig {
  const network = resolveNetworkId(env);
  const out: NetworkConfig = { ...NETWORK_CONFIGS[network] };
  for (const [field, varName] of ENV_OVERRIDES) {
    const v = env[varName];
    if (v) (out as unknown as Record<string, unknown>)[field] = v;
  }
  return out;
}

export const GENESIS_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

export function getOrCreateSeed(network: NetworkId, env: NodeJS.ProcessEnv = process.env): string {
  if (network === 'undeployed') return GENESIS_SEED;
  const fromEnv = env.MIDNIGHT_WALLET_SEED;
  if (fromEnv) return fromEnv;
  const existing = loadState();
  const persisted = existing?.wallets?.[network]?.seed;
  if (persisted) return persisted;
  const seed = crypto.randomBytes(32).toString('hex');
  const next: NetworkState = existing ?? {
    version: STATE_VERSION,
    activeNetwork: network,
    wallets: {},
    deployments: {},
  };
  next.activeNetwork = network;
  next.wallets = {
    ...next.wallets,
    [network]: { seed, createdAt: new Date().toISOString() },
  };
  saveState(next);
  return seed;
}

export function recordDeployment(
  network: NetworkId,
  address: string,
  deployer: string,
  opts: FsOptions = {},
): void {
  const cwd = opts.cwd ?? process.cwd();
  const existing = loadState({ cwd });
  const next: NetworkState = existing ?? {
    version: STATE_VERSION,
    activeNetwork: network,
    wallets: {},
    deployments: {},
  };
  next.deployments = {
    ...next.deployments,
    [network]: { address, deployer, deployedAt: new Date().toISOString() },
  };
  saveState(next, { cwd });
}