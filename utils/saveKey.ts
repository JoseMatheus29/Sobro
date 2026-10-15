// The idempotency key of a save. The server answers a repeated key with the first answer instead of saving
// again, so a "Tentar de novo" after a lost answer cannot make two transactions. The key is kept while the
// form is exactly what was sent; a form that changed is a new attempt and gets a new key (the server would
// otherwise hand back the old answer and ignore the change).
export interface SaveKeyStore {
  /** The key for an attempt with this content: the same as the last one while the content is the same. */
  keyFor: (content: unknown) => string;
  /** Forget the key once the save worked: the next save is a new one. */
  clear: () => void;
}

export function createSaveKeyStore(newKey: () => string): SaveKeyStore {
  let last: { fingerprint: string; key: string } | null = null;
  return {
    keyFor(content) {
      const fingerprint = JSON.stringify(content);
      if (last === null || last.fingerprint !== fingerprint) last = { fingerprint, key: newKey() };
      return last.key;
    },
    clear() {
      last = null;
    },
  };
}
