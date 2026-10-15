import { buildQuery } from './queryString';

describe('buildQuery', () => {
  it('writes the parameters that have a value', () => {
    expect(buildQuery({ month: '2026-10', cardId: 3, limit: 200 })).toBe('?month=2026-10&cardId=3&limit=200');
  });

  it('leaves out what is empty', () => {
    expect(buildQuery({ month: undefined, q: '', cardId: null, type: 'expense' })).toBe('?type=expense');
    expect(buildQuery({})).toBe('');
  });

  it('keeps a zero and escapes what needs it', () => {
    expect(buildQuery({ cardId: 0 })).toBe('?cardId=0');
    expect(buildQuery({ q: 'pão e queijo&mais' })).toBe('?q=p%C3%A3o%20e%20queijo%26mais');
  });
});
