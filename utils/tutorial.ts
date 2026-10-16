import {
  TUTORIAL_CARD_GAP,
  TUTORIAL_CARD_SIDE,
  TUTORIAL_CARET_MARGIN,
  TUTORIAL_CARET_SIZE,
  TUTORIAL_HOLE_PADDING,
  TUTORIAL_HOLE_RADIUS,
  TUTORIAL_STORAGE_PREFIX,
} from '@/types/tutorial/tutorial-type';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TutorialLayout {
  /** The lit-up area: the target with a margin around it, inside the screen. */
  hole: Rect;
  radius: number;
  /** The card goes above the hole when the target is in the lower half of the screen, below it otherwise. */
  placement: 'above' | 'below';
  /** `bottom` of the card when it is above, `top` when it is below. */
  cardAnchor: number;
  /** Where the arrow of the card is, from the card's left edge. */
  caretLeft: number;
  /** Four rectangles that dim everything but the hole. */
  dim: Rect[];
}

export const tutorialStorageKey = (userId: string) => `${TUTORIAL_STORAGE_PREFIX}${userId}`;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width: Math.max(0, width),
  height: Math.max(0, height),
});

// Where to draw the dim, the ring and the card for a target, from its place on the screen. Everything is measured
// (never fixed) because the bar changes height with the gestures or the buttons, and phones differ in size.
export function layoutTutorial(target: Rect, screen: Size): TutorialLayout {
  const left = clamp(target.x - TUTORIAL_HOLE_PADDING, 0, screen.width);
  const top = clamp(target.y - TUTORIAL_HOLE_PADDING, 0, screen.height);
  const right = clamp(target.x + target.width + TUTORIAL_HOLE_PADDING, 0, screen.width);
  const bottom = clamp(target.y + target.height + TUTORIAL_HOLE_PADDING, 0, screen.height);
  const hole = rect(left, top, right - left, bottom - top);

  // A round button gets a round ring; anything else a softly rounded one.
  const square = Math.abs(hole.width - hole.height) <= 4;
  const radius = square ? hole.width / 2 : Math.min(hole.height / 2, TUTORIAL_HOLE_RADIUS);

  const centerX = target.x + target.width / 2;
  const centerY = target.y + target.height / 2;
  const placement = centerY > screen.height / 2 ? 'above' : 'below';
  const cardAnchor =
    placement === 'above' ? screen.height - (hole.y - TUTORIAL_CARD_GAP) : hole.y + hole.height + TUTORIAL_CARD_GAP;

  const cardWidth = screen.width - 2 * TUTORIAL_CARD_SIDE;
  const caretLeft = clamp(
    centerX - TUTORIAL_CARD_SIDE - TUTORIAL_CARET_SIZE / 2,
    TUTORIAL_CARET_MARGIN,
    cardWidth - TUTORIAL_CARET_SIZE - TUTORIAL_CARET_MARGIN
  );

  const holeRight = hole.x + hole.width;
  const holeBottom = hole.y + hole.height;
  const dim = [
    rect(0, 0, screen.width, hole.y),
    rect(0, holeBottom, screen.width, screen.height - holeBottom),
    rect(0, hole.y, hole.x, hole.height),
    rect(holeRight, hole.y, screen.width - holeRight, hole.height),
  ];

  return { hole, radius, placement, cardAnchor, caretLeft, dim };
}
