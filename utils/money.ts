// Money typed into a field. The phone's own number keyboard is not trusted with the comma: on Android it only lets
// through the decimal separator of the language the app was built for, so a keyboard that offers "," (the person's
// language) has the key refused and only whole numbers could be typed. So the field takes digits only and fills them
// from the right, like a bank app and like the new-transaction flow: typing 1 5 0 5 0 gives 150,50. The comma is
// always there, and it never has to be typed.
//
// The text a field keeps is "canonical": no thousands separator and a comma for the decimals ("1234,50", "-80,00", ""
// for nothing typed), so `parseMoneyText` is all a screen needs to read it.

/** Up to R$ 999.999.999,99: more than anyone registers, and far from where a number loses cents. */
export const MONEY_MAX_DIGITS = 11;

const canonical = (cents: number, negative: boolean): string => {
  if (cents === 0) return '';
  const digits = String(cents).padStart(3, '0');
  return `${negative ? '-' : ''}${digits.slice(0, -2)},${digits.slice(-2)}`;
};

// What the person typed (any characters: the field's own text with a new digit, or one less) as canonical text. Only
// digits count. With `allowNegative` a "-" anywhere makes it negative (an account can start below zero), and a lone
// "-" stays so the sign can be typed before the digits.
export function maskMoney(typed: string, allowNegative = false): string {
  const digits = typed.replace(/\D/g, '').replace(/^0+/, '').slice(0, MONEY_MAX_DIGITS);
  const negative = allowNegative && typed.includes('-');
  if (digits === '') return negative ? '-' : '';
  return canonical(Number(digits), negative);
}

// A value that is already known (a budget, a limit, what is left to pay) as canonical text, for a field to start from.
// Zero is "nothing typed".
export function amountToMoneyText(amount: number): string {
  const cents = Math.round(Math.abs(amount) * 100);
  return canonical(cents, amount < 0);
}

// The number behind canonical text: 0 for nothing typed, NaN for a lone "-".
export function parseMoneyText(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return Number(trimmed.replace(',', '.'));
}

// Canonical text as the field shows it, with the thousands separated: "1234,50" → "1.234,50".
export function formatMoneyText(text: string): string {
  if (text === '' || text === '-') return text;
  const negative = text.startsWith('-');
  const [whole, cents] = text.replace('-', '').split(',');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${grouped},${cents}`;
}
