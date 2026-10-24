import { type CategoryTotal } from '@/db/transactions';
import { buildCategoryRows, legendOf, overLimit } from '@/utils/categoryRows';

const total = (id: string, name: string, amount: number): CategoryTotal => ({
  categoryId: id,
  categoryName: name,
  icon: 'category',
  color: '#999999',
  bg: '#9999991F',
  total: amount,
});

const known = [
  { id: 'home', name: 'Casa', color: '#78B07A' },
  { id: 'transport', name: 'Transporte', color: '#5F86C2' },
  { id: 'leisure', name: 'Lazer', color: '#8E7FC2' },
];

describe('buildCategoryRows', () => {
  it('lists the categories with spending, the biggest first, with their limits', () => {
    const rows = buildCategoryRows(
      [total('home', 'Casa', 884.78), total('transport', 'Transporte', 255.24)],
      { transport: 250 },
      known
    );
    expect(rows.map((r) => [r.categoryId, r.spent, r.limit])).toEqual([
      ['home', 884.78, null],
      ['transport', 255.24, 250],
    ]);
  });

  it('keeps a category that has a limit and nothing spent, at the end', () => {
    const rows = buildCategoryRows([total('home', 'Casa', 100)], { leisure: 50 }, known);
    expect(rows.map((r) => [r.categoryId, r.spent, r.limit])).toEqual([
      ['home', 100, null],
      ['leisure', 0, 50],
    ]);
    expect(rows[1].name).toBe('Lazer');
  });

  it('leaves out a limit on a category that does not exist anymore', () => {
    expect(buildCategoryRows([], { gone: 80 }, known)).toEqual([]);
  });

  it('breaks a tie by name', () => {
    const rows = buildCategoryRows([total('b', 'Bravo', 10), total('a', 'Alfa', 10)], {}, []);
    expect(rows.map((r) => r.name)).toEqual(['Alfa', 'Bravo']);
  });
});

describe('legendOf', () => {
  const rows = buildCategoryRows(
    [
      total('home', 'Casa', 884.78),
      total('loan', 'empréstimo', 500),
      total('other', 'Outros', 271.99),
      total('transport', 'Transporte', 255.24),
      total('swim', 'Natação', 239.97),
      total('gift', 'Presente', 239.29),
      total('uber', 'Uber/99', 170.7),
      total('food', 'Alimentação', 138.19),
      total('subs', 'Assinaturas', 32),
      total('fun', 'Lazer', 15),
    ],
    {},
    []
  );

  it('names the three biggest and sums the other seven', () => {
    const legend = legendOf(rows, 2747.16);
    expect(legend.top.map((r) => [r.name, r.percent])).toEqual([
      ['Casa', 32],
      ['empréstimo', 18],
      ['Outros', 10],
    ]);
    expect(legend.restCount).toBe(7);
    expect(legend.restPercent).toBe(40);
  });

  it('names everything when only one more would be left out', () => {
    const legend = legendOf(rows.slice(0, 4), 1912.01);
    expect(legend.top).toHaveLength(4);
    expect(legend.restCount).toBe(0);
  });

  it('ignores the categories with nothing spent', () => {
    const withEmpty = buildCategoryRows([total('home', 'Casa', 10)], { leisure: 50 }, known);
    expect(legendOf(withEmpty, 10).top.map((r) => r.name)).toEqual(['Casa']);
  });

  it('has zero percent for an empty month', () => {
    expect(legendOf([], 0)).toEqual({ top: [], restCount: 0, restPercent: 0 });
  });
});

describe('overLimit', () => {
  it('finds the categories past their limit, and not the ones at it', () => {
    const rows = buildCategoryRows(
      [total('transport', 'Transporte', 255.24), total('home', 'Casa', 100)],
      { transport: 250, home: 100 },
      known
    );
    expect(overLimit(rows).map((r) => r.categoryId)).toEqual(['transport']);
  });
});
