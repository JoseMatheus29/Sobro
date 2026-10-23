import * as SecureStore from 'expo-secure-store';

// Where the session tokens are kept, one value per key. On the phone it is the secure store (the keystore);
// `tokenStorage.web.ts` is the browser's version, which has no such thing.
export const readToken = (key: string): Promise<string | null> => SecureStore.getItemAsync(key);
export const writeToken = (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value);
export const removeToken = (key: string): Promise<void> => SecureStore.deleteItemAsync(key);
