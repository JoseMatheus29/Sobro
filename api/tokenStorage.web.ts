// The browser has no secure store (expo-secure-store has no web version: calling it throws), so the tokens
// go in `localStorage`. That is readable by any script running on the page, unlike the phone's keystore: it
// is the price of the first web version, and the way out is a session in an HttpOnly cookie
// (docs/projeto-web-desktop.md, fase 3). A write that fails (private window, storage full) throws, so the
// login says so instead of looking like it worked and losing the session on the next page load.
// The prefix keeps the app apart from anything else that lives on the same address (localhost in development).
const storageKey = (key: string) => `sobro:${key}`;

export async function readToken(key: string): Promise<string | null> {
  return window.localStorage.getItem(storageKey(key));
}

export async function writeToken(key: string, value: string): Promise<void> {
  window.localStorage.setItem(storageKey(key), value);
}

export async function removeToken(key: string): Promise<void> {
  window.localStorage.removeItem(storageKey(key));
}
