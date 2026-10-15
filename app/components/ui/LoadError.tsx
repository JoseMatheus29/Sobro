import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { isNetworkError } from '@/api/errors';
import { useColors } from '@/hooks/useColors';
import { LOAD_ERROR_TITLE, NO_CONNECTION_TITLE, RETRY_LABEL } from '@/types/components/ui/loadError-type';
import { errorMessage } from '@/utils/apiErrors';

interface LoadErrorProps {
  error: unknown;
  onRetry: () => void;
  /** Take the whole screen (a screen that has nothing else to show) instead of the space of a block. */
  fill?: boolean;
}

// What a screen shows when what it needed could not be read: no signal, or the server in trouble, with a way to
// try again. Nothing is shown as if it had loaded.
export default function LoadError({ error, onRetry, fill = false }: LoadErrorProps) {
  const colors = useColors();
  const offline = isNetworkError(error);

  return (
    <View className={`items-center justify-center px-8 ${fill ? 'flex-1 bg-canvas' : 'py-10'}`}>
      <View className="w-14 h-14 rounded-[18px] bg-surface items-center justify-center mb-4">
        <Icon name={offline ? 'wifi-off' : 'cloud-off'} size={26} color={colors.subtle} />
      </View>
      <Text className="text-base font-bold text-ink text-center">{offline ? NO_CONNECTION_TITLE : LOAD_ERROR_TITLE}</Text>
      <Text className="text-[13px] leading-[19px] text-muted text-center mt-1.5">{errorMessage(error)}</Text>
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.85}
        className="h-11 px-6 mt-5 rounded-2xl flex-row items-center justify-center gap-1.5"
        style={{ backgroundColor: colors.buttonGradient[0] }}
      >
        <Icon name="refresh" size={18} color="#FFFFFF" />
        <Text className="text-[14px] font-bold text-white">{RETRY_LABEL}</Text>
      </TouchableOpacity>
    </View>
  );
}
