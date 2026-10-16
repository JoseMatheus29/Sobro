import { layoutTutorial, tutorialStorageKey } from './tutorial';

// A 390 x 844 screen, like the prototype.
const SCREEN = { width: 390, height: 844 };

describe('layoutTutorial', () => {
  it('lights up the floating button with a round ring and puts the card above it', () => {
    const layout = layoutTutorial({ x: 314, y: 666, width: 56, height: 56 }, SCREEN);
    expect(layout.hole).toEqual({ x: 306, y: 658, width: 72, height: 72 });
    expect(layout.radius).toBe(36);
    expect(layout.placement).toBe('above');
    // The card ends 18 below the top of the hole: 844 - (658 - 18).
    expect(layout.cardAnchor).toBe(204);
    // The arrow points at the middle of the button, which is 342 from the left of the screen.
    expect(layout.caretLeft).toBe(314);
  });

  it('puts the card below a target in the upper half of the screen', () => {
    const layout = layoutTutorial({ x: 20, y: 124, width: 350, height: 188 }, SCREEN);
    expect(layout.hole).toEqual({ x: 12, y: 116, width: 366, height: 204 });
    expect(layout.radius).toBe(26);
    expect(layout.placement).toBe('below');
    expect(layout.cardAnchor).toBe(338);
    expect(layout.caretLeft).toBe(167);
  });

  it('lights up a tab of the bar with the card above it', () => {
    const layout = layoutTutorial({ x: 195, y: 750, width: 89.5, height: 50 }, SCREEN);
    expect(layout.hole).toEqual({ x: 187, y: 742, width: 105.5, height: 66 });
    expect(layout.placement).toBe('above');
    expect(layout.cardAnchor).toBe(120);
    expect(layout.caretLeft).toBeCloseTo(211.75);
  });

  it('keeps the arrow inside the card when the target is at the edge of the screen', () => {
    const left = layoutTutorial({ x: 0, y: 750, width: 40, height: 50 }, SCREEN);
    const right = layoutTutorial({ x: 360, y: 750, width: 30, height: 50 }, SCREEN);
    expect(left.caretLeft).toBe(16);
    expect(right.caretLeft).toBe(350 - 16 - 16);
  });

  it('does not let the hole leave the screen', () => {
    const layout = layoutTutorial({ x: -20, y: 800, width: 100, height: 100 }, SCREEN);
    expect(layout.hole.x).toBe(0);
    expect(layout.hole.y + layout.hole.height).toBeLessThanOrEqual(SCREEN.height);
  });

  it('dims everything but the hole with four rectangles that do not overlap it', () => {
    const { hole, dim } = layoutTutorial({ x: 195, y: 750, width: 89.5, height: 50 }, SCREEN);
    const dimmed = dim.reduce((sum, r) => sum + r.width * r.height, 0);
    expect(dimmed).toBeCloseTo(SCREEN.width * SCREEN.height - hole.width * hole.height);
    for (const r of dim) {
      expect(r.width).toBeGreaterThanOrEqual(0);
      expect(r.height).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('tutorialStorageKey', () => {
  it('is one key for each account, so two people on a phone each see it once', () => {
    expect(tutorialStorageKey('a')).not.toBe(tutorialStorageKey('b'));
    expect(tutorialStorageKey('a')).toBe(tutorialStorageKey('a'));
  });
});
