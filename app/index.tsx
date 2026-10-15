import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/app/components/auth/AuthProvider';
import { useColors } from '@/hooks/useColors';
import { HOME_ROUTE, LOGIN_ROUTE } from '@/types/components/auth/auth-type';

// The first choice: the dashboard with a session, the login without one. While the tokens are being read the
// screen is just the background, so the login never flashes for a person who is already in.
export default function Index() {
  const colors = useColors();
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }
  return <Redirect href={(status === 'signedIn' ? HOME_ROUTE : LOGIN_ROUTE) as any} />;
}
