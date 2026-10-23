import { type ReactNode } from 'react';
import { View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { WEB_COLUMN_MAX_WIDTH } from '@/types/components/ui/webFrame-type';

// The screens are laid out for a phone, so on a wide window they stay one phone-wide column in the middle
// instead of stretching across it. What is fixed to the bottom or the top (tab bar, floating button, sheets,
// toasts) is positioned against this column, because a View is the reference of its absolute children.
// A real desktop layout is a later phase (docs/projeto-web-desktop.md).
export default function WebFrame({ children }: { children: ReactNode }) {
  const colors = useColors();

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: WEB_COLUMN_MAX_WIDTH,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.line,
        }}>
        {children}
      </View>
    </View>
  );
}
