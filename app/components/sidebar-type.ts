import { type ViewStyle } from 'react-native';

import { palette } from '@/constants/palette';

export interface NavItem {
  id: string;
  icon: string;
  label: string;
  route: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: 'home', label: 'Início', route: '/dashboard' },
  { id: 'myDetailing', icon: 'bar-chart', label: 'Detalhes', route: '/myDetailing' },
  { id: 'wallet', icon: 'account-balance-wallet', label: 'Carteira', route: '/wallet' },
  { id: 'editAcount', icon: 'person', label: 'Perfil', route: '/editAcount' },
];

// Bar height without the bottom safe-area inset: 12 top padding + item + 20 bottom padding.
export const SIDEBAR_ITEM_HEIGHT = 50;
export const SIDEBAR_HEIGHT = 12 + SIDEBAR_ITEM_HEIGHT + 20;

// Floating "nova transação" button, sitting above the bar at the right edge.
export const FAB_SIZE = 56;
export const FAB_GAP = 16;
export const FAB_RIGHT = 20;
export const FAB_LABEL = 'Nova transação';
export const FAB_ROUTE = '/registrationSpent';

// Scroll content of screens that show the button needs room to scroll past it.
export const SCROLL_PADDING_WITH_FAB = 180;
// Same for screens that only have the bar.
export const SCROLL_PADDING_WITH_SIDEBAR = 100;

export const FAB_STYLE: ViewStyle = {
  backgroundColor: palette.primary.DEFAULT,
  shadowColor: palette.primary.DEFAULT,
  shadowOpacity: 0.4,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
};
