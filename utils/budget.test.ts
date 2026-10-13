import { budgetColor, budgetForMonth, budgetLevel } from './budget';

describe('budgetForMonth', () => {
  const entries = [
    { month: '0000-00', amount: 2000 },
    { month: '2026-08', amount: 3000 },
    { month: '2026-10', amount: 2500 },
  ];

  it('uses the entry that started most recently on or before the month', () => {
    expect(budgetForMonth(entries, '2026-10')).toBe(2500);
    expect(budgetForMonth(entries, '2026-09')).toBe(3000);
    expect(budgetForMonth(entries, '2026-08')).toBe(3000);
    expect(budgetForMonth(entries, '2026-07')).toBe(2000);
  });

  it('keeps applying until it changes, including to later months', () => {
    expect(budgetForMonth(entries, '2027-03')).toBe(2500);
  });

  it('does not depend on the order of the entries', () => {
    expect(budgetForMonth([...entries].reverse(), '2026-09')).toBe(3000);
  });

  it('is null before the first entry and with no entries', () => {
    expect(budgetForMonth([{ month: '2026-08', amount: 3000 }], '2026-07')).toBeNull();
    expect(budgetForMonth([], '2026-10')).toBeNull();
  });

  it('is null from a month where the budget was removed', () => {
    const removed = [...entries, { month: '2026-11', amount: null }];
    expect(budgetForMonth(removed, '2026-10')).toBe(2500);
    expect(budgetForMonth(removed, '2026-11')).toBeNull();
    expect(budgetForMonth(removed, '2026-12')).toBeNull();
  });
});

describe('budgetLevel', () => {
  it('is fine while more than 20% of the budget is left', () => {
    expect(budgetLevel(0)).toBe('ok');
    expect(budgetLevel(0.5)).toBe('ok');
    expect(budgetLevel(0.79)).toBe('ok');
  });

  it('is a caution from 80% spent (20% left) up to just under 90%', () => {
    expect(budgetLevel(0.8)).toBe('caution');
    expect(budgetLevel(0.85)).toBe('caution');
    expect(budgetLevel(0.89)).toBe('caution');
  });

  it('is in danger from 90% spent (10% left) and past the ceiling', () => {
    expect(budgetLevel(0.9)).toBe('danger');
    expect(budgetLevel(1)).toBe('danger');
    expect(budgetLevel(1.4)).toBe('danger');
  });

  it('has nothing to warn about without a budget', () => {
    expect(budgetLevel(null)).toBe('ok');
  });
});

describe('budgetColor', () => {
  const colors = { income: 'green', warning: 'yellow', expense: 'red' };

  it('is green, yellow or red by level', () => {
    expect(budgetColor(0.3, colors)).toBe('green');
    expect(budgetColor(0.85, colors)).toBe('yellow');
    expect(budgetColor(0.95, colors)).toBe('red');
    expect(budgetColor(null, colors)).toBe('green');
  });
});
