if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {} as Crypto;
}

if (typeof (globalThis as any).Buffer === 'undefined') {
  (globalThis as any).Buffer = {};
}

export {};
