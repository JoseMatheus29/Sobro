import { dayLabel, groupByDay } from '@/utils/dayGroups';

describe('groupByDay', () => {
  it('puts the items of the same day together and keeps the order', () => {
    const items = [
      { id: 1, day: '2026-10-23' },
      { id: 2, day: '2026-10-23' },
      { id: 3, day: '2026-10-12' },
      { id: 4, day: '2026-09-27' },
    ];
    expect(groupByDay(items)).toEqual([
      { day: '2026-10-23', items: [items[0], items[1]] },
      { day: '2026-10-12', items: [items[2]] },
      { day: '2026-09-27', items: [items[3]] },
    ]);
  });

  it('does not join the same day when another came between: the order is not rearranged', () => {
    const groups = groupByDay([
      { id: 1, day: '2026-10-23' },
      { id: 2, day: '2026-10-12' },
      { id: 3, day: '2026-10-23' },
    ]);
    expect(groups.map((g) => g.day)).toEqual(['2026-10-23', '2026-10-12', '2026-10-23']);
  });

  it('is empty for an empty list', () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe('dayLabel', () => {
  it('names the day and the month', () => {
    expect(dayLabel('2026-10-23', 2026)).toBe('23 DE OUTUBRO');
    expect(dayLabel('2026-03-05', 2026)).toBe('5 DE MARÇO');
  });

  it('adds the year when it is not the current one', () => {
    expect(dayLabel('2025-12-31', 2026)).toBe('31 DE DEZEMBRO DE 2025');
  });
});
