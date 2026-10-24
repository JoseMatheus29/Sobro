import { MONTH_NAMES } from './month';

export interface DayGroup<T> {
  /** 'YYYY-MM-DD' */
  day: string;
  items: T[];
}

// The items of the same day together, in the order they came: a list that is already sorted by day stays so, and
// one that is not (what is registered first, then what is only planned) is not rearranged.
export function groupByDay<T extends { day: string }>(items: T[]): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.day === item.day) last.items.push(item);
    else groups.push({ day: item.day, items: [item] });
  }
  return groups;
}

// "23 DE OUTUBRO", with the year ("23 DE OUTUBRO DE 2025") when it is not the current one.
export function dayLabel(day: string, currentYear: number): string {
  const [year, month, date] = day.split('-').map(Number);
  const label = `${date} DE ${MONTH_NAMES[month - 1].toUpperCase()}`;
  return year === currentYear ? label : `${label} DE ${year}`;
}
