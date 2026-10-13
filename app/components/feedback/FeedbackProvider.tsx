import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import ConfirmDialog from '@/app/components/feedback/ConfirmDialog';
import Toast from '@/app/components/feedback/Toast';
import {
  ConfirmOptions,
  FEEDBACK_HOOK_ERROR,
  FeedbackContextValue,
  TOAST_DURATION_MS,
  TOAST_HIDE_MS,
  TOAST_SHOW_MS,
  ToastOptions,
} from '@/types/components/feedback/feedback-type';

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback(): FeedbackContextValue {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error(FEEDBACK_HOOK_ERROR);
  return value;
}

// Lives above the Stack, so a toast survives the navigation that follows an action
// (e.g. the sheet closing right after a transaction is saved).
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const hideToast = useCallback(() => {
    clearTimer();
    Animated.timing(progress, { toValue: 0, duration: TOAST_HIDE_MS, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [progress]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      clearTimer();
      setToast(options);
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: TOAST_SHOW_MS, useNativeDriver: true }).start();
      if (options.type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (options.type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      timer.current = setTimeout(hideToast, TOAST_DURATION_MS[options.type]);
    },
    [hideToast, progress]
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    // A new question replaces an unanswered one, which counts as "no".
    resolver.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setRequest(options);
    });
  }, []);

  const answer = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setRequest(null);
  }, []);

  useEffect(() => clearTimer, []);

  const value = useMemo(() => ({ showToast, confirm }), [showToast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      <View className="flex-1">
        {children}
        <Toast toast={toast} progress={progress} onPress={hideToast} />
      </View>
      <ConfirmDialog request={request} onAnswer={answer} />
    </FeedbackContext.Provider>
  );
}

// Everything under app/ is a route for Expo Router, which warns about a file with no default export.
export default FeedbackProvider;
