import { type TransactionRecord } from '@/db/transactions';
import { alertLevel, alertToast, changeOf, spendingAlerts } from './spendingAlerts';
import { type SpendingChange } from './spendingAlerts-type';

const food = (amount: number): SpendingChange => ({ categoryId: 'food', categoryName: 'Alimentação', amount });
const fun = (amount: number): SpendingChange => ({ categoryId: 'fun', categoryName: 'Lazer', amount });

describe('alertLevel', () => {
  it('is fine under 80%, close from 80% and over only past the ceiling', () => {
    expect(alertLevel(79, 100)).toBe('ok');
    expect(alertLevel(80, 100)).toBe('caution');
    expect(alertLevel(99.99, 100)).toBe('caution');
    expect(alertLevel(100, 100)).toBe('caution');
    expect(alertLevel(100.01, 100)).toBe('over');
  });

  it('has nothing to measure against without a ceiling', () => {
    expect(alertLevel(500, 0)).toBe('ok');
  });
});

describe('spendingAlerts', () => {
  const base = { budget: null, limits: {}, byCategory: {}, added: null, removed: null };

  it('warns when an expense takes the budget to 80%', () => {
    const alerts = spendingAlerts({ ...base, budget: 1000, spent: 820, added: food(100) });
    expect(alerts).toEqual([{ kind: 'budget', level: 'caution', spent: 820, ceiling: 1000 }]);
  });

  it('warns once more when the budget is crossed', () => {
    const alerts = spendingAlerts({ ...base, budget: 1000, spent: 1050, added: food(100) });
    expect(alerts).toEqual([{ kind: 'budget', level: 'over', spent: 1050, ceiling: 1000 }]);
  });

  it('says nothing when it was already there before the expense', () => {
    // 850 before, 900 now: it was close already
    expect(spendingAlerts({ ...base, budget: 1000, spent: 900, added: food(50) })).toEqual([]);
    // 1100 before, 1150 now: it was already over
    expect(spendingAlerts({ ...base, budget: 1000, spent: 1150, added: food(50) })).toEqual([]);
  });

  it('says nothing while there is room, or without a budget', () => {
    expect(spendingAlerts({ ...base, budget: 1000, spent: 500, added: food(100) })).toEqual([]);
    expect(spendingAlerts({ ...base, spent: 5000, added: food(100) })).toEqual([]);
  });

  it('warns about a category limit that was reached, and names the category', () => {
    const alerts = spendingAlerts({
      ...base,
      limits: { food: 400 },
      spent: 700,
      byCategory: { food: 340, fun: 360 },
      added: food(60),
    });
    expect(alerts).toEqual([{ kind: 'category', level: 'caution', categoryId: 'food', categoryName: 'Alimentação', spent: 340, ceiling: 400 }]);
  });

  it('ignores the limit of a category the expense is not in', () => {
    const alerts = spendingAlerts({
      ...base,
      limits: { food: 400 },
      spent: 700,
      byCategory: { food: 390, fun: 310 },
      added: fun(10),
    });
    expect(alerts).toEqual([]);
  });

  it('puts the most serious first: over before close, the budget before a category', () => {
    const alerts = spendingAlerts({
      ...base,
      budget: 1000,
      limits: { food: 400 },
      spent: 850,
      byCategory: { food: 450 },
      added: food(100),
    });
    expect(alerts.map((a) => `${a.kind}:${a.level}`)).toEqual(['category:over', 'budget:caution']);
  });

  it('judges an edit by what it changes: the old expense is taken back', () => {
    // 100 became 200 in the same category: from 790 to 890 of 1000
    const alerts = spendingAlerts({ ...base, budget: 1000, spent: 890, added: food(200), removed: food(100) });
    expect(alerts.map((a) => a.level)).toEqual(['caution']);
    // 200 became 100: spending went down, nothing to say
    expect(spendingAlerts({ ...base, budget: 1000, spent: 890, added: food(100), removed: food(200) })).toEqual([]);
  });

  it('uses the category of the old expense when an edit moves it', () => {
    // 300 moved from Lazer to Alimentação: Alimentação went from 100 to 400 of 450
    const alerts = spendingAlerts({
      ...base,
      limits: { food: 450, fun: 300 },
      spent: 500,
      byCategory: { food: 400, fun: 100 },
      added: food(300),
      removed: fun(300),
    });
    expect(alerts.map((a) => a.categoryId)).toEqual(['food']);
  });
});

describe('alertToast', () => {
  it('has none without a warning', () => {
    expect(alertToast([])).toBeNull();
  });

  it('tells the most serious one and counts the others', () => {
    const toast = alertToast([
      { kind: 'category', level: 'over', categoryId: 'food', categoryName: 'Alimentação', spent: 450, ceiling: 400 },
      { kind: 'budget', level: 'caution', spent: 850, ceiling: 1000 },
    ]);
    expect(toast).toEqual({
      type: 'warning',
      title: 'Limite de Alimentação estourado',
      message: 'Passou R$ 50,00 do limite de R$ 400,00. + 1 outro aviso',
      icon: 'error-outline',
    });
  });

  it('says how much is left when close to the ceiling', () => {
    const toast = alertToast([{ kind: 'budget', level: 'caution', spent: 820, ceiling: 1000 }]);
    expect(toast?.title).toBe('Orçamento do mês em 82%');
    expect(toast?.message).toBe('Faltam R$ 180,00 para o teto de R$ 1.000,00.');
    expect(toast?.icon).toBe('warning-amber');
  });
});

describe('changeOf', () => {
  const t = (overrides: Partial<TransactionRecord>): TransactionRecord => ({
    id: 1,
    cardId: 1,
    cardName: 'Nubank',
    categoryId: 'food',
    categoryName: 'Alimentação',
    categoryIcon: 'restaurant',
    categoryColor: '#D98E5F',
    name: 'Mercado',
    description: null,
    amount: -80,
    type: 'expense',
    occurredAt: '2026-11-03T12:00:00.000Z',
    createdAt: '2026-11-03T12:00:00.000Z',
    ...overrides,
  });

  it('is the amount and category of an expense', () => {
    expect(changeOf(t({}))).toEqual({ categoryId: 'food', categoryName: 'Alimentação', amount: 80 });
  });

  it('is nothing for an income, a transfer or the payment of an invoice', () => {
    expect(changeOf(t({ type: 'income', amount: 80 }))).toBeNull();
    expect(changeOf(t({ transferId: 5 }))).toBeNull();
    expect(changeOf(t({ categoryId: 'invoice' }))).toBeNull();
  });
});
