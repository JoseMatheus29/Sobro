import { type Palette } from '@/constants/palette';

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

export interface MonthPillLook {
  backgroundColor: string;
  color: string;
  borderColor: string;
}

// On the blue header the pill is a translucent white; once it shows a past month it turns solid
// white, so it is clear that this is not the current month. On the dark canvas it is a chip with a
// hairline border, and a past month turns it brand blue.
export const monthPillStyles = (colors: Palette): { current: MonthPillLook; past: MonthPillLook } =>
  colors.scheme === 'dark'
    ? {
        current: { backgroundColor: colors.surface.DEFAULT, color: colors.ink, borderColor: colors.surface.dark },
        past: { backgroundColor: colors.buttonGradient[0], color: '#FFFFFF', borderColor: colors.buttonGradient[0] },
      }
    : {
        current: { backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFFFFF', borderColor: 'transparent' },
        past: { backgroundColor: '#FFFFFF', color: colors.primary.dark, borderColor: 'transparent' },
      };
