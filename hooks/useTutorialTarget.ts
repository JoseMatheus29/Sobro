import { useEffect, useRef } from 'react';
import { type View } from 'react-native';

import { type TutorialTargetId } from '@/types/tutorial/tutorial-type';
import { registerTutorialTarget, unregisterTutorialTarget } from '@/utils/tutorialTargets';

// Marks a view as something the tutorial can light up: put the returned ref on it (a plain View also needs
// `collapsable={false}`, or Android may not keep it as a view of its own and it cannot be measured). With `null`
// it marks nothing.
export function useTutorialTarget(id: TutorialTargetId | null) {
  const ref = useRef<View>(null);
  useEffect(() => {
    if (!id) return;
    registerTutorialTarget(id, ref);
    return () => unregisterTutorialTarget(id, ref);
  }, [id]);
  return ref;
}
