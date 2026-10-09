import { palette } from '@/constants/palette';

export interface MonthContextValue {
  /** 'YYYY-MM' the screens are showing. */
  month: string;
  /** True while the screens show the current month. */
  isCurrent: boolean;
  /** True for a month that has not started: only what the recurring expenses plan is shown. */
  isFuture: boolean;
  /** Shows another month; picking the current one goes back to following the calendar. */
  setMonth: (month: string) => void;
}

export const MONTH_PILL_LABEL = 'Escolher o mês';
export const HISTORY_ROUTE = '/history';

// On the blue header the pill is a translucent white; once it shows a past month it turns solid
// white, so it is clear that this is not the current month.
export const MONTH_PILL_STYLES = {
  current: { backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFFFFF' },
  past: { backgroundColor: '#FFFFFF', color: palette.primary.dark },
} as const;
