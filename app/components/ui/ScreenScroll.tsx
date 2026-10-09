import React, { useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent, type ScrollViewProps } from 'react-native';

import { SCROLL_PADDING_WITH_FAB } from '../sidebar-type';

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
  const [viewportHeight, setViewportHeight] = useState(0);
  // Measured without the bottom padding, so adding it never changes whether it is needed.
  const [contentHeight, setContentHeight] = useState(0);

  const needsScroll = viewportHeight > 0 && contentHeight > viewportHeight - bottomPadding;

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
      contentContainerStyle={[contentContainerStyle, { paddingBottom: needsScroll ? bottomPadding : 0 }]}
    >
      <View onLayout={(e: LayoutChangeEvent) => setContentHeight(e.nativeEvent.layout.height)}>{children}</View>
    </ScrollView>
  );
}
