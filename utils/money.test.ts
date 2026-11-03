import { amountToMoneyText, formatMoneyText, maskMoney, MONEY_MAX_DIGITS, parseMoneyText } from './money';

describe('maskMoney', () => {
  it('fills the digits from the right, so decimals need no comma', () => {
    expect(maskMoney('1')).toBe('0,01');
    expect(maskMoney('15')).toBe('0,15');
    expect(maskMoney('150')).toBe('1,50');
    expect(maskMoney('15050')).toBe('150,50');
    expect(maskMoney('100000')).toBe('1000,00');
  });

  it('is nothing for nothing, or for zeros only', () => {
    expect(maskMoney('')).toBe('');
    expect(maskMoney('0')).toBe('');
    expect(maskMoney('0,00')).toBe('');
  });

  it('reads what the field shows plus one more digit', () => {
    // the field showed 1.234,50 and the person typed a 6
    expect(maskMoney('1.234,506')).toBe('12345,06');
  });

  it('shifts back when a digit is taken out', () => {
    expect(maskMoney('1.234,5')).toBe('123,45');
  });

  it('ignores whatever is not a digit, a comma or a dot typed by hand included', () => {
    expect(maskMoney('12,5')).toBe('1,25');
    expect(maskMoney('R$ 3.0a')).toBe('0,30');
  });

  it('stops at the biggest amount instead of overflowing', () => {
    expect(maskMoney('9'.repeat(MONEY_MAX_DIGITS + 4))).toBe('999999999,99');
  });

  it('has no sign unless asked for one', () => {
    expect(maskMoney('-150')).toBe('1,50');
  });

  it('keeps the sign when it is allowed', () => {
    expect(maskMoney('-150', true)).toBe('-1,50');
    expect(maskMoney('-', true)).toBe('-');
    expect(maskMoney('1,50-', true)).toBe('-1,50');
  });
});

describe('amountToMoneyText', () => {
  it('writes a known amount the way the field keeps it', () => {
    expect(amountToMoneyText(4000)).toBe('4000,00');
    expect(amountToMoneyText(1234.5)).toBe('1234,50');
    expect(amountToMoneyText(0.07)).toBe('0,07');
  });

  it('is nothing for zero', () => {
    expect(amountToMoneyText(0)).toBe('');
  });

  it('keeps a negative amount negative', () => {
    expect(amountToMoneyText(-80)).toBe('-80,00');
  });

  it('survives the usual floating point drift', () => {
    expect(amountToMoneyText(0.1 + 0.2)).toBe('0,30');
    expect(amountToMoneyText(1.005 * 100)).toBe('100,50');
  });
});

describe('parseMoneyText', () => {
  it('reads canonical text', () => {
    expect(parseMoneyText('150,50')).toBe(150.5);
    expect(parseMoneyText('1234,00')).toBe(1234);
    expect(parseMoneyText('-80,25')).toBe(-80.25);
  });

  it('is 0 for nothing typed and NaN for a lone sign', () => {
    expect(parseMoneyText('')).toBe(0);
    expect(parseMoneyText('  ')).toBe(0);
    expect(parseMoneyText('-')).toBeNaN();
  });

  it('is the inverse of what the field writes', () => {
    for (const cents of [1, 99, 100, 150, 12345, 99999999]) {
      expect(parseMoneyText(maskMoney(String(cents)))).toBeCloseTo(cents / 100, 10);
    }
  });
});

describe('formatMoneyText', () => {
  it('separates the thousands', () => {
    expect(formatMoneyText('1234,50')).toBe('1.234,50');
    expect(formatMoneyText('1234567,89')).toBe('1.234.567,89');
    expect(formatMoneyText('999,00')).toBe('999,00');
  });

  it('keeps the sign and leaves nothing as nothing', () => {
    expect(formatMoneyText('-1234,50')).toBe('-1.234,50');
    expect(formatMoneyText('-')).toBe('-');
    expect(formatMoneyText('')).toBe('');
  });
});
