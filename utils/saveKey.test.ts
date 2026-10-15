import { createSaveKeyStore } from './saveKey';

function store() {
  let n = 0;
  return createSaveKeyStore(() => `key-${++n}`);
}

describe('createSaveKeyStore', () => {
  it('gives the same key to a retry of the same form', () => {
    const keys = store();
    const first = keys.keyFor({ amount: 12.5, name: 'Mercado' });
    expect(keys.keyFor({ amount: 12.5, name: 'Mercado' })).toBe(first);
  });

  it('gives a new key to a form that changed', () => {
    const keys = store();
    const first = keys.keyFor({ amount: 12.5 });
    expect(keys.keyFor({ amount: 13 })).not.toBe(first);
  });

  it('gives a new key after a save that worked', () => {
    const keys = store();
    const first = keys.keyFor({ amount: 12.5 });
    keys.clear();
    expect(keys.keyFor({ amount: 12.5 })).not.toBe(first);
  });

  it('keeps the key of a failed attempt through a retry, but not through a change and back', () => {
    const keys = store();
    const first = keys.keyFor({ amount: 1 });
    keys.keyFor({ amount: 2 });
    // The form went back to what it was, but the attempt in between was another one.
    expect(keys.keyFor({ amount: 1 })).not.toBe(first);
  });
});
