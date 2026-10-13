import { softenColor, tint } from './color';

describe('tint', () => {
  it('adds an alpha channel to a hex color', () => {
    expect(tint('#277F2B')).toBe('#277F2B24');
  });
});

describe('softenColor', () => {
  it('dusts a saturated color, keeping its hue', () => {
    expect(softenColor('#E67E22')).toBe('#BE8C60');
    expect(softenColor('#9B59B6')).toBe('#9977A7');
    expect(softenColor('#1ABC9C')).toBe('#60BEAB');
  });

  it('lifts a dark color and tones down a bright one to the same band', () => {
    expect(softenColor('#A83636')).toBe('#AE6F6F');
    expect(softenColor('#F1C40F')).toBe('#BEAB60');
  });

  it('leaves grays gray', () => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(softenColor('#718096').slice(i, i + 2), 16));
    expect(Math.abs(r - g)).toBeLessThan(14);
    expect(Math.abs(g - b)).toBeLessThan(14);
  });

  it('is applied to hex colors only', () => {
    expect(softenColor('rgba(1,2,3,0.5)')).toBe('rgba(1,2,3,0.5)');
    expect(softenColor('red')).toBe('red');
    expect(softenColor('#fff')).toBe('#fff');
  });
});
