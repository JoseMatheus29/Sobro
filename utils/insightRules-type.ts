import { type TransactionRecord } from '@/db/transactions';

export type InsightTone = 'positive' | 'warning' | 'neutral';

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: string;
  title: string;
  tip: string;
}

export interface InsightInput {
  /** Transactions of the month being looked at. */
  current: TransactionRecord[];
  /** Transactions of the month before it. */
  previous: TransactionRecord[];
  now: Date;
  /** The spending limit of each category in force this month, by category id (see utils/categoryBudget.ts). */
  limits?: Record<string, number>;
}

interface InsightCopy {
  title: string;
  tip: string;
}

// Warnings first: they are the ones worth acting on.
export const TONE_ORDER: Record<InsightTone, number> = { warning: 0, positive: 1, neutral: 2 };

// Spending that moves less than this against the same stretch of last month counts as "the same".
export const TREND_STABLE_BELOW = 0.05;
// A category is flagged when it is this much above last month's same stretch, and by at least this many reais.
export const SPIKE_MIN_RATIO = 0.3;
export const SPIKE_MIN_INCREASE = 50;
// Share of the income kept that counts as healthy.
export const GOOD_SAVINGS_RATE = 0.2;
// A single expense is called out when it is this share of the month's spending.
export const BIG_EXPENSE_SHARE = 0.3;
// Breakdown insights (top category, big expense) need a few expenses to mean anything.
export const MIN_EXPENSES_FOR_BREAKDOWN = 3;
// The projection for the month needs a few days of data behind it.
export const PACE_MIN_DAY = 3;
// A category is flagged from this share of its own limit on.
export const LIMIT_WARN_AT = 0.8;

// Tips for the default categories (by id). Categories the user creates get the generic one.
export const CATEGORY_TIPS: Record<string, string> = {
  food: 'Planejar as compras da semana e cozinhar em casa costuma reduzir bem esse valor.',
  transport: 'Comparar rotas, caronas ou transporte público pode aliviar esse gasto.',
  leisure: 'Defina um teto mensal para o lazer e acompanhe aqui antes de passar dele.',
  health: 'Vale conferir se há plano, convênio ou desconto que reduza o custo.',
  shopping: 'Esperar 24 horas antes de uma compra não essencial ajuda a evitar impulsos.',
  other: 'Gastos em "Outros" escondem detalhes. Tente categorizá-los para entender melhor.',
};
export const DEFAULT_CATEGORY_TIP = 'Defina um limite mensal para essa categoria e acompanhe aqui.';

export const INSIGHT_COPY = {
  emptyMonth: (month: string): InsightCopy => ({
    title: `Você ainda não registrou nada em ${month}`,
    tip: 'Registrar as transações no dia a dia deixa os números e as dicas mais precisos.',
  }),

  trendStable: (previousMonth: string, day: number, spent: string): InsightCopy => ({
    title: `Seus gastos estão no mesmo ritmo de ${previousMonth}`,
    tip: `Até o dia ${day} você gastou ${spent}, quase o mesmo que no mesmo período do mês passado.`,
  }),
  trendDown: (percent: number, previousMonth: string, day: number, difference: string): InsightCopy => ({
    title: `Seus gastos estão ${percent}% abaixo de ${previousMonth}`,
    tip: `Até o dia ${day} você gastou ${difference} a menos que no mesmo período do mês passado. Continue assim!`,
  }),
  trendUp: (percent: number, previousMonth: string, day: number, difference: string): InsightCopy => ({
    title: `Seus gastos estão ${percent}% acima de ${previousMonth}`,
    tip: `Até o dia ${day} você gastou ${difference} a mais que no mesmo período do mês passado. Vale revisar o que pesou.`,
  }),

  saved: (percent: number, kept: string, month: string): InsightCopy => ({
    title: `Você guardou ${percent}% do que recebeu`,
    tip: `Sobraram ${kept} em ${month}. Que tal separar parte disso para uma reserva ou um investimento?`,
  }),
  savedLittle: (percent: number): InsightCopy => ({
    title: `Sobraram ${percent}% do que você recebeu`,
    tip: 'Uma boa meta é guardar ao menos 20% da renda. Veja onde dá para ajustar.',
  }),
  overspent: (difference: string): InsightCopy => ({
    title: `Suas saídas passaram das entradas em ${difference}`,
    tip: 'Revise os maiores gastos do mês para voltar ao azul.',
  }),
  noIncome: (month: string): InsightCopy => ({
    title: `Você ainda não registrou entradas em ${month}`,
    tip: 'Registre seu salário e outras entradas para o saldo refletir a realidade.',
  }),

  topCategory: (category: string, percent: number, tip: string): InsightCopy => ({
    title: `${category} é seu maior gasto: ${percent}% do mês`,
    tip,
  }),
  categorySpike: (category: string, percent: number, previousMonth: string, difference: string): InsightCopy => ({
    title: `${category} subiu ${percent}% em relação a ${previousMonth}`,
    tip: `Você gastou ${difference} a mais com essa categoria que no mesmo período do mês passado. Que tal definir um limite para ela?`,
  }),
  bigExpense: (name: string, percent: number, amount: string): InsightCopy => ({
    title: `${name} concentra ${percent}% dos seus gastos`,
    tip: `Uma única despesa de ${amount} pesa bastante no mês. Vale conferir se ela estava planejada.`,
  }),

  limitPassed: (category: string, limit: string, spent: string, over: string): InsightCopy => ({
    title: `${category} passou do limite de ${limit}`,
    tip: `Você gastou ${spent}, ${over} acima. Segurar essa categoria nos próximos dias evita que o mês estoure.`,
  }),
  limitNear: (category: string, percent: number, left: string): InsightCopy => ({
    title: `${category} chegou a ${percent}% do limite`,
    tip: `Restam ${left} até o fim do mês nessa categoria.`,
  }),

  paceNeutral: (month: string, projected: string, perDay: string): InsightCopy => ({
    title: `No ritmo atual, você fecha ${month} com ${projected} em saídas`,
    tip: `Sua média é ${perDay} por dia.`,
  }),
  paceOverIncome: (month: string, projected: string, received: string): InsightCopy => ({
    title: `No ritmo atual, você fecha ${month} com ${projected} em saídas`,
    tip: `Isso é mais do que você recebeu até agora (${received}). Segurar os gastos nos próximos dias ajuda.`,
  }),
};
