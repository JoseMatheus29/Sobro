import { type Palette } from '@/constants/palette';
import { type Insight, type InsightTone } from '@/utils/insightRules-type';

export interface InsightItemProps {
  insight: Insight;
}

export const INSIGHTS_TITLE = 'Dicas e insights';
export const INSIGHTS_SUBTITLE = (month: string) => `Com base nos seus gastos de ${month}`;
export const EMPTY_INSIGHTS_MESSAGE = 'Registre algumas transações para receber dicas';

// The sheet is as tall as its content, up to this share of the screen.
export const SHEET_MAX_HEIGHT = '85%';

// Green for what is going well, red for what deserves attention, blue for the rest.
export const insightToneColors = (colors: Palette): Record<InsightTone, string> => ({
  positive: colors.income,
  warning: colors.expense,
  neutral: colors.primary.DEFAULT,
});
