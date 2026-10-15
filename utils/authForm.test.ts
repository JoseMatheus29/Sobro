import { extractResetToken, findResetToken, isValidEmail, passwordProblem } from './authForm';

describe('isValidEmail', () => {
  it('accepts an ordinary address, with spaces around it', () => {
    expect(isValidEmail('ana@email.com')).toBe(true);
    expect(isValidEmail('  ana.souza+sobro@ufc.edu.br ')).toBe(true);
  });

  it('refuses what is not an address', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('ana')).toBe(false);
    expect(isValidEmail('ana@')).toBe(false);
    expect(isValidEmail('ana@email')).toBe(false);
    expect(isValidEmail('a na@email.com')).toBe(false);
  });
});

describe('passwordProblem', () => {
  it('asks for 8 to 128 characters', () => {
    expect(passwordProblem('1234567')).toBe('short');
    expect(passwordProblem('12345678')).toBeNull();
    expect(passwordProblem('x'.repeat(128))).toBeNull();
    expect(passwordProblem('x'.repeat(129))).toBe('long');
  });
});

describe('extractResetToken', () => {
  it('reads the token from the link of the e-mail', () => {
    expect(extractResetToken('https://sobro.app/redefinir-senha#token=abc123')).toBe('abc123');
    expect(extractResetToken('sobro://reset#token=abc123')).toBe('abc123');
    expect(extractResetToken('sobro://reset?token=abc123&x=1')).toBe('abc123');
  });

  it('keeps a token that was pasted alone', () => {
    expect(extractResetToken('  abc123  ')).toBe('abc123');
  });

  it('decodes what the link escaped', () => {
    expect(extractResetToken('https://x.app/r#token=a%2Bb')).toBe('a+b');
  });

  it('says when a text is not a link with a token', () => {
    expect(findResetToken('sobro://reset#token=abc123')).toBe('abc123');
    expect(findResetToken('sobro://reset')).toBeNull();
    expect(findResetToken('abc123')).toBeNull();
  });
});
