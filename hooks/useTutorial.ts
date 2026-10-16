import { useCallback, useEffect, useState } from 'react';

import { hasSeenTutorial, markTutorialSeen } from '@/db/tutorial';
import { TUTORIAL_START_DELAY_MS, TUTORIAL_STEPS, type TutorialStep } from '@/types/tutorial/tutorial-type';
import { getTutorialTarget } from '@/utils/tutorialTargets';

interface UseTutorialInput {
  /** The account; without it nothing starts (the flag is one for each account). */
  userId: string | undefined;
  /** The Home is on screen and loaded, so what the steps point at is there. */
  ready: boolean;
}

// The first-run tutorial: starts once, when the Home is ready and this account has not seen it, and goes through the
// steps whose target is on screen. Skipping or finishing marks it as seen; leaving the Home halfway does not, so it
// starts again next time.
export function useTutorial({ userId, ready }: UseTutorialInput) {
  const [seen, setSeen] = useState<boolean | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    hasSeenTutorial(userId).then((value) => {
      if (!cancelled) setSeen(value);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!ready || seen !== false || steps.length > 0) return;
    const timer = setTimeout(() => {
      const available = TUTORIAL_STEPS.filter((step) => getTutorialTarget(step.target) !== null);
      if (available.length > 0) {
        setSteps(available);
        setIndex(0);
      }
    }, TUTORIAL_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, seen, steps.length]);

  const finish = useCallback(() => {
    setSteps([]);
    setSeen(true);
    if (userId) markTutorialSeen(userId);
  }, [userId]);

  const next = useCallback(() => {
    if (index >= steps.length - 1) finish();
    else setIndex(index + 1);
  }, [index, steps.length, finish]);

  const back = useCallback(() => setIndex((current) => Math.max(0, current - 1)), []);

  return { visible: steps.length > 0, steps, index, next, back, finish };
}
