// How close a spending bar is to its ceiling, by the share already spent: green while there is room,
// yellow when 20% or less is left, red when 10% or less is left (and past the ceiling).
export type BudgetLevel = 'ok' | 'caution' | 'danger';

export const BUDGET_CAUTION_AT = 0.8;
export const BUDGET_DANGER_AT = 0.9;
