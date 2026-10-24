// The keys of the cache (api/queryClient.ts). `notifyDataChanged` invalidates everything, so a key only has to be
// right about what it names: the same key means the same data.

export const queryKeys = {
  cards: ['cards'] as const,
  card: (id: number) => ['card', id] as const,
  categories: ['categories'] as const,
  transactions: (filters: object) => ['transactions', filters] as const,
  invoice: (cardId: number, month: string, closingDay: number, dueDay: number) =>
    ['invoice', cardId, month, closingDay, dueDay] as const,
  transaction: (id: number) => ['transaction', id] as const,
  transferLegs: (transferId: number) => ['transferLegs', transferId] as const,
  recurrences: ['recurrences'] as const,
  recurrence: (id: number) => ['recurrence', id] as const,
  monthlyBudgets: ['budgets', 'monthly'] as const,
  categoryBudgets: ['budgets', 'categories'] as const,
  goals: ['goals'] as const,
  goal: (id: number) => ['goal', id] as const,
  goalEntries: (id: number) => ['goalEntries', id] as const,
  monthlyTotals: ['reports', 'monthly'] as const,
  categoryTotals: (month: string | undefined) => ['reports', 'categories', month ?? 'all'] as const,
  // The two reads of the account itself, the same whatever profile is open (see useScreenQuery's `account`).
  profile: ['profile'] as const,
  managedProfiles: ['profiles'] as const,
};
