import { useCallback, useEffect, useState } from 'react';

import { getSeenRelease, markReleaseSeen } from '@/db/whatsNew';
import {
  LATEST_RELEASE_ID,
  RELEASES,
  WHATS_NEW_DELAY_MS,
  type Release,
} from '@/types/whatsNew/whatsNew-type';
import { unseenReleases } from '@/utils/whatsNew';

interface UseWhatsNewInput {
  /** The account; without it nothing shows (what was seen is one record for each account). */
  userId: string | undefined;
  /** The Home is on screen and loaded. */
  ready: boolean;
  /** Whether this account has seen the first-run tutorial: null while that is still being read. */
  tutorialSeen: boolean | null;
  /** The tutorial is on screen right now: the news waits for it to end. */
  tutorialVisible: boolean;
}

// "O que há de novo": once the Home is ready, shows what the account has not seen yet (see types/whatsNew). A brand-new
// account is still going through the tutorial and has nothing "new" to catch up on, so for it the latest release is just
// marked as seen. Closing the dialog marks it seen; leaving the app with it open does not, so it comes back.
export function useWhatsNew({ userId, ready, tutorialSeen, tutorialVisible }: UseWhatsNewInput) {
  // undefined while it is being read; null when the account has never seen any.
  const [seenId, setSeenId] = useState<string | null | undefined>(undefined);
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getSeenRelease(userId).then((value) => {
      if (!cancelled) setSeenId(value);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // A new account: the tutorial is coming, so it is not told what is "new".
  useEffect(() => {
    if (!userId || seenId === undefined || tutorialSeen !== false || seenId === LATEST_RELEASE_ID) return;
    setSeenId(LATEST_RELEASE_ID);
    markReleaseSeen(userId, LATEST_RELEASE_ID);
  }, [userId, seenId, tutorialSeen]);

  useEffect(() => {
    if (!ready || tutorialVisible || tutorialSeen !== true || seenId === undefined || releases.length > 0) return;
    const unseen = unseenReleases(RELEASES, seenId);
    if (unseen.length === 0) return;
    const timer = setTimeout(() => setReleases(unseen), WHATS_NEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, tutorialVisible, tutorialSeen, seenId, releases.length]);

  const dismiss = useCallback(() => {
    setReleases([]);
    setSeenId(LATEST_RELEASE_ID);
    if (userId) markReleaseSeen(userId, LATEST_RELEASE_ID);
  }, [userId]);

  return { releases, dismiss };
}
