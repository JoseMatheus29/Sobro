import { type RefObject } from 'react';
import { type View } from 'react-native';

import { type TutorialTargetId } from '@/types/tutorial/tutorial-type';

// The things the tutorial can light up register themselves here when they are on screen (hooks/useTutorialTarget.ts),
// so the tutorial can measure them wherever they are, without the screens passing refs around.
const targets = new Map<TutorialTargetId, RefObject<View | null>>();

export function registerTutorialTarget(id: TutorialTargetId, ref: RefObject<View | null>): void {
  targets.set(id, ref);
}

// Only forgets it when it is still the one registered: another screen may have registered its own since.
export function unregisterTutorialTarget(id: TutorialTargetId, ref: RefObject<View | null>): void {
  if (targets.get(id) === ref) targets.delete(id);
}

export function getTutorialTarget(id: TutorialTargetId): View | null {
  return targets.get(id)?.current ?? null;
}
