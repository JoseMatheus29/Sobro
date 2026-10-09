import { type TransactionRecord } from '@/db/transactions';
import { CATEGORY_TIPS, DEFAULT_CATEGORY_TIP } from './insightRules-type';
import { generateInsights } from './insightRules';

// Friday, 9 October 2026: day 9 of a 31-day month, with September (30 days) before it.
const NOW = new Date('2026-10-09T12:00:00.000Z');

let nextId = 1;

function expense(amount: number, overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  return {
    id: nextId++,
    cardId: 1,
    cardName: 'Cartão Principal',
    categoryId: 'food',
    categoryName: 'Alimentação',
    categoryIcon: 'restaurant',
    categoryColor: '#E67E22',
    name: 'Item',
    description: null,
    amount: -amount,
    type: 'expense',
    occurredAt: '2026-10-05T12:00:00.000Z',
    createdAt: '2026-10-05T12:00:00.000Z',
    ...overrides,
  };
}

function income(amount: number, overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  return expense(amount, {
    categoryId: 'salary',
    categoryName: 'Salário',
    categoryIcon: 'account-balance',
    amount,
    type: 'income',
    ...overrides,
  });
}

const september = (day: number) => `2026-09-${String(day).padStart(2, '0')}T12:00:00.000Z`;
const ids = (list: { id: string }[]) => list.map((i) => i.id);
const find = (list: ReturnType<typeof generateInsights>, id: string) => list.find((i) => i.id === id);

describe('generateInsights', () => {
  it('has nothing to say when there is no data at all', () => {
    expect(generateInsights({ current: [], previous: [], now: NOW })).toEqual([]);
  });

  it('nudges the user when the month is empty but the last one was not', () => {
    const result = generateInsights({ current: [], previous: [expense(50, { occurredAt: september(3) })], now: NOW });
    expect(ids(result)).toEqual(['empty-month']);
    expect(result[0].title).toContain('outubro');
  });

  describe('spending trend', () => {
    it('is positive when spending is below the same stretch of last month', () => {
      const result = generateInsights({
        current: [expense(300)],
        previous: [expense(400, { occurredAt: september(3) })],
        now: NOW,
      });
      const trend = find(result, 'trend');
      expect(trend?.tone).toBe('positive');
      expect(trend?.title).toBe('Seus gastos estão 25% abaixo de setembro');
    });

    it('warns when spending is above', () => {
      const result = generateInsights({
        current: [expense(500)],
        previous: [expense(400, { occurredAt: september(3) })],
        now: NOW,
      });
      const trend = find(result, 'trend');
      expect(trend?.tone).toBe('warning');
      expect(trend?.title).toBe('Seus gastos estão 25% acima de setembro');
    });

    it('calls a small difference "the same pace"', () => {
      const result = generateInsights({
        current: [expense(102)],
        previous: [expense(100, { occurredAt: september(3) })],
        now: NOW,
      });
      expect(find(result, 'trend')?.tone).toBe('neutral');
    });

    it('only counts last month up to today, not all of it', () => {
      const result = generateInsights({
        current: [expense(100)],
        previous: [expense(100, { occurredAt: september(3) }), expense(900, { occurredAt: september(20) })],
        now: NOW,
      });
      expect(find(result, 'trend')?.tone).toBe('neutral');
    });

    it('is skipped without spending last month to compare with', () => {
      const result = generateInsights({ current: [expense(100)], previous: [], now: NOW });
      expect(find(result, 'trend')).toBeUndefined();
    });
  });

  describe('balance', () => {
    it('praises keeping a good share of the income', () => {
      const result = generateInsights({ current: [income(1000), expense(500)], previous: [], now: NOW });
      const balance = find(result, 'balance');
      expect(balance?.tone).toBe('positive');
      expect(balance?.title).toBe('Você guardou 50% do que recebeu');
    });

    it('is neutral when little is kept', () => {
      const result = generateInsights({ current: [income(1000), expense(900)], previous: [], now: NOW });
      expect(find(result, 'balance')?.tone).toBe('neutral');
    });

    it('warns when spending passes the income', () => {
      const result = generateInsights({ current: [income(100), expense(300)], previous: [], now: NOW });
      const balance = find(result, 'balance');
      expect(balance?.tone).toBe('warning');
      expect(balance?.title).toBe('Suas saídas passaram das entradas em R$ 200,00');
    });

    it('asks for the income when only expenses were registered', () => {
      const result = generateInsights({ current: [expense(300)], previous: [], now: NOW });
      expect(find(result, 'balance')?.title).toContain('não registrou entradas');
    });
  });

  describe('where the money goes', () => {
    const dining = [expense(200), expense(100)];
    const bus = expense(50, { categoryId: 'transport', categoryName: 'Transporte', categoryIcon: 'directions-car' });

    it('names the biggest category with its tip', () => {
      const result = generateInsights({ current: [...dining, bus], previous: [], now: NOW });
      const top = find(result, 'top-category');
      expect(top?.title).toBe('Alimentação é seu maior gasto: 86% do mês');
      expect(top?.tip).toBe(CATEGORY_TIPS.food);
      expect(top?.icon).toBe('restaurant');
    });

    it('uses the generic tip for a category the user created', () => {
      const pets = (amount: number) => expense(amount, { categoryId: 'pets', categoryName: 'Pets', categoryIcon: 'pets' });
      const result = generateInsights({ current: [pets(200), pets(100), bus], previous: [], now: NOW });
      expect(find(result, 'top-category')?.tip).toBe(DEFAULT_CATEGORY_TIP);
    });

    it('needs a few expenses before breaking them down', () => {
      const result = generateInsights({ current: [expense(200), expense(100)], previous: [], now: NOW });
      expect(find(result, 'top-category')).toBeUndefined();
      expect(find(result, 'big-expense')).toBeUndefined();
    });

    it('calls out one expense that weighs on the month', () => {
      const result = generateInsights({
        current: [expense(600, { name: 'Aluguel' }), expense(50), expense(50)],
        previous: [],
        now: NOW,
      });
      expect(find(result, 'big-expense')?.title).toBe('Aluguel concentra 86% dos seus gastos');
    });

    it('leaves out an expense that is a small part of the month', () => {
      const result = generateInsights({ current: [expense(100), expense(100), expense(100), expense(100)], previous: [], now: NOW });
      expect(find(result, 'big-expense')).toBeUndefined();
    });

    it('flags the category that grew the most against last month', () => {
      const leisure = (amount: number, overrides: Partial<TransactionRecord> = {}) =>
        expense(amount, { categoryId: 'leisure', categoryName: 'Lazer', categoryIcon: 'sports-esports', ...overrides });
      const result = generateInsights({
        current: [leisure(300), expense(100), expense(100)],
        previous: [leisure(100, { occurredAt: september(2) })],
        now: NOW,
      });
      const spike = find(result, 'category-spike');
      expect(spike?.tone).toBe('warning');
      expect(spike?.title).toBe('Lazer subiu 200% em relação a setembro');
    });

    it('ignores a rise too small to matter', () => {
      const leisure = (amount: number, overrides: Partial<TransactionRecord> = {}) =>
        expense(amount, { categoryId: 'leisure', categoryName: 'Lazer', categoryIcon: 'sports-esports', ...overrides });
      const result = generateInsights({
        current: [leisure(40), expense(100), expense(100)],
        previous: [leisure(10, { occurredAt: september(2) })],
        now: NOW,
      });
      expect(find(result, 'category-spike')).toBeUndefined();
    });
  });

  describe('pace of the month', () => {
    it('projects the month from the daily average', () => {
      const result = generateInsights({ current: [expense(90)], previous: [], now: NOW });
      const pace = find(result, 'pace');
      expect(pace?.tone).toBe('neutral');
      expect(pace?.title).toBe('No ritmo atual, você fecha outubro com R$ 310,00 em saídas');
      expect(pace?.tip).toBe('Sua média é R$ 10,00 por dia.');
    });

    it('warns when the projection is above what came in', () => {
      const result = generateInsights({ current: [income(100), expense(90)], previous: [], now: NOW });
      expect(find(result, 'pace')?.tone).toBe('warning');
    });

    it('waits for a few days of data', () => {
      const result = generateInsights({
        current: [expense(90)],
        previous: [],
        now: new Date('2026-10-02T12:00:00.000Z'),
      });
      expect(find(result, 'pace')).toBeUndefined();
    });
  });

  it('puts warnings first, then positives, then the rest', () => {
    const result = generateInsights({
      current: [income(100), expense(200), expense(50), expense(50)],
      previous: [expense(40, { occurredAt: september(3) })],
      now: NOW,
    });
    const order = { warning: 0, positive: 1, neutral: 2 };
    const tones = result.map((i) => order[i.tone]);
    expect(tones).toEqual([...tones].sort((a, b) => a - b));
    expect(result[0].tone).toBe('warning');
  });
});
