import React from 'react';
import { Image, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenScroll from '@/app/components/ui/ScreenScroll';
import { useColors } from '@/hooks/useColors';
import { AUTH_BOTTOM_PADDING, AUTH_LOGO_SIZE } from '@/types/components/auth/auth-type';

interface AuthScreenProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

// The frame of the screens without a session: the header band with the logo and a card for the form. The
// header scrolls with the content, like on the other screens.
export default function AuthScreen({ title, subtitle, children }: AuthScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView className="flex-1 bg-canvas" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenScroll bottomPadding={AUTH_BOTTOM_PADDING} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={colors.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pb-[52px] px-6 items-center"
          style={{ paddingTop: insets.top + 32 }}
        >
          <Image
            source={require('../../../assets/images/logo-app.png')}
            style={{ width: AUTH_LOGO_SIZE, height: AUTH_LOGO_SIZE, borderRadius: 20 }}
          />
          <Text className="text-headerInk text-2xl font-bold mt-4">{title}</Text>
          <Text className="text-headerInk/80 text-[14px] mt-1.5 text-center">{subtitle}</Text>
        </LinearGradient>

        <View className="px-5 -mt-7">
          <View className="bg-card rounded-[24px] p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">{children}</View>
        </View>
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}
