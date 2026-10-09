import { type TransactionRecord } from '@/db/transactions';
import { foldText, netOf, searchTransactions } from './search';

let id = 1;
function tx(overrides: Partial<TransactionRecord> & { amount: number }): TransactionRecord {
  return {
    id: id++,
    cardId: 1,
    cardName: 'Cartão Principal',
    categoryId: 'food',
    categoryName: 'Alimentação',
    categoryIcon: 'restaurant',
    categoryColor: '#E67E22',
    name: 'Item',
    description: null,
    type: overrides.amount >= 0 ? 'income' : 'expense',
    occurredAt: '2026-10-05T12:00:00.000Z',
    createdAt: '2026-10-05T12:00:00.000Z',
    ...overrides,
  };
}

const all = [
  tx({ name: 'Mercado Extra', amount: -182.3 }),
  tx({ name: 'Padaria', amount: -14.5, description: 'Pão e café' }),
  tx({ name: 'Uber', amount: -24.9, categoryId: 'transport', categoryName: 'Transporte' }),
  tx({ name: 'Salário', amount: 4200, categoryId: 'salary', categoryName: 'Salário' }),
];

const base = { text: '', type: 'all' as const, categoryId: null };

describe('foldText', () => {
  it('drops accents and case', () => {
    expect(foldText('  Alimentação ')).toBe('alimentacao');
    expect(foldText('SALÁRIO')).toBe('salario');
  });
});

describe('searchTransactions', () => {
  it('keeps everything with no filter', () => {
    expect(searchTransactions(all, base)).toHaveLength(4);
  });

  it('finds by name, ignoring case and accents', () => {
    expect(searchTransactions(all, { ...base, text: 'mercado' }).map((t) => t.name)).toEqual(['Mercado Extra']);
    expect(searchTransactions(all, { ...base, text: 'salario' }).map((t) => t.name)).toEqual(['Salário']);
  });

  it('also looks at the description, the category and the account', () => {
    expect(searchTransactions(all, { ...base, text: 'cafe' }).map((t) => t.name)).toEqual(['Padaria']);
    expect(searchTransactions(all, { ...base, text: 'transporte' }).map((t) => t.name)).toEqual(['Uber']);
    expect(searchTransactions(all, { ...base, text: 'principal' })).toHaveLength(4);
  });

  it('needs every word typed', () => {
    expect(searchTransactions(all, { ...base, text: 'alimentacao padaria' }).map((t) => t.name)).toEqual(['Padaria']);
    expect(searchTransactions(all, { ...base, text: 'padaria uber' })).toEqual([]);
  });

  it('filters by type and by category', () => {
    expect(searchTransactions(all, { ...base, type: 'income' }).map((t) => t.name)).toEqual(['Salário']);
    expect(searchTransactions(all, { ...base, type: 'expense' })).toHaveLength(3);
    expect(searchTransactions(all, { ...base, categoryId: 'food' })).toHaveLength(2);
  });

  it('combines the filters', () => {
    expect(searchTransactions(all, { text: 'extra', type: 'expense', categoryId: 'food' })).toHaveLength(1);
    expect(searchTransactions(all, { text: 'extra', type: 'income', categoryId: null })).toEqual([]);
  });
});

describe('netOf', () => {
  it('adds income and expenses with their signs', () => {
    expect(netOf(all)).toBeCloseTo(4200 - 182.3 - 14.5 - 24.9);
    expect(netOf([])).toBe(0);
  });
});
