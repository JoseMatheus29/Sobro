// Whose data the app is looking at: null is the person's own, otherwise the id of a managed profile they care for
// (see docs/api-perfis.md). It lives outside React so the HTTP client can read it on every call; ProfileProvider is
// the only thing that changes it, and it does so before anything renders with the new profile.
let activeProfileId: string | null = null;

export const getActiveProfileId = (): string | null => activeProfileId;
export const setActiveProfileId = (id: string | null): void => {
  activeProfileId = id;
};

// What the client tells the app: the server refused a profile (it is not one the person manages, or it is gone).
// It brings the id that call was sent for, so a late answer for a profile already left is not taken for the current one.
let forbiddenHandler: (profileId: string) => void = () => {};
export const setOnProfileForbidden = (handler: (profileId: string) => void) => {
  forbiddenHandler = handler;
};
export const notifyProfileForbidden = (profileId: string) => forbiddenHandler(profileId);

// The routes of the account itself answer for the signed-in person whatever profile is chosen, so they go without
// the header: the login, `/me` and the profiles' own routes.
export function isAccountPath(path: string): boolean {
  return path.startsWith('/v1/auth/') || path === '/v1/me' || path.startsWith('/v1/me?') || path.startsWith('/v1/profiles');
}

// The scope of the cached reads: the profile they were read for, or `own`. Account reads (the person's own
// `/me`, the list of profiles) have none.
export const OWN_SCOPE = 'own';
export const scopeOf = (profileId: string | null): string => profileId ?? OWN_SCOPE;
