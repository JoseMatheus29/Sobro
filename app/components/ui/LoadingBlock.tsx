import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

// What takes the place of a block of a screen while its data has not come yet (the server is far, so a first read
// takes a moment): a spinner, instead of figures that would be zeros and say something false.
export default function LoadingBlock({ fill = false }: { fill?: boolean }) {
  const colors = useColors();
  return (
    <View className={`items-center justify-center ${fill ? 'flex-1 bg-canvas' : 'py-12'}`}>
      <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
    </View>
  );
}
