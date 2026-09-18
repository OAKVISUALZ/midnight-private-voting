/**
 * Derive the unshielded (mn_addr_preprod_...) address for a wallet seed on a
 * given network, entirely offline — no proof server, node, or indexer needed.
 *
 * Usage:  npx tsx scripts/derive-address.ts <seed-hex-64> preprod
 *         npx tsx scripts/derive-address.ts <seed-hex-64> preview
 *
 * The printed address is the one to fund from the network's faucet (the
 * faucets are behind a human captcha, so this has to happen in a browser).
 * The seed must match the MIDNIGHT_WALLET_SEED / MN_SEED value used to deploy.
 */
import { Buffer } from 'buffer';
import { HDWallet, Roles, createKeystore } from '@midnight-ntwrk/wallet-sdk';

const seed = process.argv[2];
const network = process.argv[3];
if (!seed || !/^[0-9a-fA-F]{64}$/.test(seed)) {
  console.error('usage: tsx scripts/derive-address.ts <seed-hex-64> <preprod|preview>');
  process.exit(1);
}

const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
if (hdWallet.type !== 'seedOk') throw new Error('Invalid seed');
const result = hdWallet.hdWallet
  .selectAccount(0)
  .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust] as const)
  .deriveKeysAt(0);
if (result.type !== 'keysDerived') throw new Error('Key derivation failed');
hdWallet.hdWallet.clear();

const keys = result.keys as Record<number, Uint8Array>;
const keystore = createKeystore(keys[Roles.NightExternal], network);
process.stdout.write(keystore.getBech32Address().toString() + '\n');