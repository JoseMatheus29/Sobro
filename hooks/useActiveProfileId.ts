import { createContext, useContext } from 'react';

// The managed profile the app is looking at (null: the person's own). ProfileProvider provides it. It is a context of
// its own, apart from the one with the list of profiles, so the cache hooks can follow it without the screens that
// read data depending on the providers above them.
export const ActiveProfileIdContext = createContext<string | null>(null);

export const useActiveProfileId = (): string | null => useContext(ActiveProfileIdContext);
