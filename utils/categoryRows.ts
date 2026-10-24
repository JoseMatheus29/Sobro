import { type CategoryTotal } from '@/db/transactions';
import { LEGEND_SHOWN, type CategoryRow } from '@/types/myDetailing/myDetailing-type';

// One row for every category with spending in the month, plus the ones that have a limit but nothing spent yet (so
// the limit can still be seen and changed), the biggest spending first. `known` names the categories of the person:
// a limit on one that no longer exists is left out.
export function buildCategoryRows(
  totals: CategoryTotal[],
  limits: Record<string, number>,
  known: { id: string; name: string; color: string }[]
): CategoryRow[] {
  const rows: CategoryRow[] = totals.map((t) => ({
    categoryId: t.categoryId,
    name: t.categoryName,
    color: t.color,
    spent: t.total,
    limit: limits[t.categoryId] ?? null,
  }));

  const present = new Set(rows.map((r) => r.categoryId));
  for (const category of known) {
    const limit = limits[category.id];
    if (limit === undefined || present.has(category.id)) continue;
    rows.push({ categoryId: category.id, name: category.name, color: category.color, spent: 0, limit });
  }

  return rows.sort((a, b) => b.spent - a.spent || a.name.localeCompare(b.name, 'pt-BR'));
}

export interface LegendSummary {
  /** The biggest categories, each with its share of the total in whole percent. */
  top: (CategoryRow & { percent: number })[];
  /** How many more there are, and the share they make together; 0 when everything is named. */
  restCount: number;
  restPercent: number;
}

const percentOf = (amount: number, total: number) => (total > 0 ? Math.round((amount / total) * 100) : 0);

// What the legend of the donut names: the biggest `shown` categories and "mais N" for the others. When only one more
// would be left out, it is named instead (a "mais 1" says nothing).
export function legendOf(rows: CategoryRow[], total: number, shown: number = LEGEND_SHOWN): LegendSummary {
  const spending = rows.filter((r) => r.spent > 0);
  const nameAll = spending.length <= shown + 1;
  const named = nameAll ? spending : spending.slice(0, shown);
  const rest = nameAll ? [] : spending.slice(shown);
  return {
    top: named.map((r) => ({ ...r, percent: percentOf(r.spent, total) })),
    restCount: rest.length,
    restPercent: percentOf(
      rest.reduce((sum, r) => sum + r.spent, 0),
      total
    ),
  };
}

// The categories that went past their limit.
export function overLimit(rows: CategoryRow[]): CategoryRow[] {
  return rows.filter((r) => r.limit !== null && r.spent > r.limit);
}
