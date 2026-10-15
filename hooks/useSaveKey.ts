import { useState } from 'react';

import { newIdempotencyKey } from '@/api/client';
import { createSaveKeyStore, type SaveKeyStore } from '@/utils/saveKey';

// The idempotency key of the form being saved, for the call that creates something: `keys.keyFor(body)` when
// the person taps Save (the same key again on "Tentar de novo"), `keys.clear()` once it worked.
export function useSaveKey(): SaveKeyStore {
  const [store] = useState(() => createSaveKeyStore(newIdempotencyKey));
  return store;
}
