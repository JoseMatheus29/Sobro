import React from 'react';
import { Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { type ProfileAvatarProps } from '@/types/profiles/profiles-type';
import { tint } from '@/utils/color';
import { initialOf } from '@/utils/profiles';

// The round badge of a profile with the first letter of its name: the brand blue for the person's own, the purple
// of "someone else's finances" for a profile they care for.
export default function ProfileAvatar({ name, size, managed }: ProfileAvatarProps) {
  const colors = useColors();
  const accent = managed ? colors.managed : colors.primary.DEFAULT;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: managed ? tint(colors.managed) : colors.surface.DEFAULT,
        borderWidth: managed ? 0 : 1.5,
        borderColor: colors.buttonGradient[0],
      }}
    >
      <Text style={{ color: accent, fontWeight: '700', fontSize: Math.round(size * 0.42) }}>{initialOf(name)}</Text>
    </View>
  );
}
