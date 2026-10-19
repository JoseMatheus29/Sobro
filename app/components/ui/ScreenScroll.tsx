import React, { useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCROLL_PADDING_WITH_FAB } from '@/types/components/sidebar-type';

interface ScreenScrollProps extends Omit<ScrollViewProps, 'children'> {
  /** What the bottom of the screen takes up (tab bar, floating button) and the content has to clear. */
  bottomPadding?: number;
  children: React.ReactNode;
}

// The scroll view of a whole screen. It only scrolls when the content does not fit above the tab bar
// (and the floating button), and only then keeps room under it: a short screen stays still, with no
// empty stretch to scroll into.
export default function ScreenScroll({
  bottomPadding = SCROLL_PADDING_WITH_FAB,
  children,
  onLayout,
  contentContainerStyle,
  ...rest
}: ScreenScrollProps) {
  const insets = useSafeAreaInsets();
  const [viewportHeight, setViewportHeight] = useState(0);
  // Measured without the bottom padding, so adding it never changes whether it is needed.
  const [contentHeight, setContentHeight] = useState(0);

  // The tab bar (and the floating button over it) is as tall as its own padding plus the inset of the system's
  // navigation bar, which is taller with three buttons than with gestures: without it the end of the content
  // (the save button of Perfil) stayed under the bar on phones with buttons.
  const clearance = bottomPadding + insets.bottom;
  const needsScroll = viewportHeight > 0 && contentHeight > viewportHeight - clearance;

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      {...rest}
      scrollEnabled={needsScroll}
      onLayout={(e: LayoutChangeEvent) => {
        setViewportHeight(e.nativeEvent.layout.height);
        onLayout?.(e);
      }}
      contentContainerStyle={[contentContainerStyle, { paddingBottom: needsScroll ? clearance : 0 }]}
    >
      <View onLayout={(e: LayoutChangeEvent) => setContentHeight(e.nativeEvent.layout.height)}>{children}</View>
    </ScrollView>
  );
}
