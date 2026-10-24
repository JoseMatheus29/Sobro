import { type ManagedProfile } from '@/db/profiles';
import { MAX_MANAGED_PROFILES } from '@/types/profiles/profiles-type';
import { canAddProfile, initialOf, resolveActive, shortName } from './profiles';

const profile = (id: string, name: string): ManagedProfile => ({ id, name, currency: 'BRL', remindersEnabled: true });

describe('initialOf', () => {
  it('is the first letter of the name, upper case', () => {
    expect(initialOf('mãe')).toBe('M');
    expect(initialOf('  tio Zé ')).toBe('T');
  });

  it('keeps an accented or non-latin first letter whole', () => {
    expect(initialOf('érica')).toBe('É');
    expect(initialOf('😀 festa')).toBe('😀');
  });

  it('is a question mark for a name with nothing in it', () => {
    expect(initialOf('   ')).toBe('?');
  });
});

describe('canAddProfile', () => {
  it('stops at the limit the server enforces', () => {
    expect(canAddProfile(0)).toBe(true);
    expect(canAddProfile(MAX_MANAGED_PROFILES - 1)).toBe(true);
    expect(canAddProfile(MAX_MANAGED_PROFILES)).toBe(false);
  });
});

describe('resolveActive', () => {
  const list = [profile('a', 'Mãe'), profile('b', 'Tio Zé')];

  it('is the own profile (null) when none is asked for', () => {
    expect(resolveActive(list, null)).toBeNull();
  });

  it('finds the profile that is asked for', () => {
    expect(resolveActive(list, 'b')).toEqual(list[1]);
  });

  it('falls back to the own profile when the one asked for is not in the list anymore', () => {
    expect(resolveActive(list, 'gone')).toBeNull();
    expect(resolveActive([], 'a')).toBeNull();
  });
});

describe('shortName', () => {
  it('leaves a short name as it is', () => {
    expect(shortName('Mãe')).toBe('Mãe');
  });

  it('clips a long one with an ellipsis', () => {
    expect(shortName('Maria da Conceição Almeida', 10)).toBe('Maria da …');
  });
});
