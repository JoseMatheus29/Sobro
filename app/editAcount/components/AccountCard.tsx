import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '@/app/components/auth/AuthProvider';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import DeleteAccountModal from '@/app/editAcount/components/DeleteAccountModal';
import { useColors } from '@/hooks/useColors';
import {
  ACCOUNT_TEXT,
  ACCOUNT_TITLE,
  DELETE_ACCOUNT_CONFIRM,
  DELETE_ACCOUNT_LABEL,
  SIGN_OUT_CONFIRM,
  SIGN_OUT_LABEL,
} from '@/types/editAcount/editAcount-type';
import { tint } from '@/utils/color';

// Leave the account on this phone, or delete it for good (which asks for the password).
export default function AccountCard() {
  const colors = useColors();
  const { signOut } = useAuth();
  const { confirm } = useFeedback();
  const [askingPassword, setAskingPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    if (busy || !(await confirm(SIGN_OUT_CONFIRM))) return;
    setBusy(true);
    try {
      // The gate of the layout takes the person to the login once the session is gone.
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (await confirm(DELETE_ACCOUNT_CONFIRM)) setAskingPassword(true);
  };

  return (
    <View className="bg-card rounded-[24px] p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
          <Icon name="manage-accounts" size={16} color={colors.primary.DEFAULT} />
        </View>
        <Text className="text-[15px] font-bold text-ink">{ACCOUNT_TITLE}</Text>
      </View>

      <Text className="text-[13px] leading-[19px] text-muted">{ACCOUNT_TEXT}</Text>

      <View className="gap-2.5 mt-4">
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={busy}
          activeOpacity={0.85}
          className="h-12 rounded-2xl flex-row items-center justify-center gap-1.5 border-[1.5px]"
          style={{ backgroundColor: colors.canvas, borderColor: colors.surface.dark, opacity: busy ? 0.5 : 1 }}
        >
          <Icon name="logout" size={18} color={colors.primary.DEFAULT} />
          <Text className="text-[14px] font-bold text-primary">{SIGN_OUT_LABEL}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={busy}
          activeOpacity={0.85}
          className="h-12 rounded-2xl flex-row items-center justify-center gap-1.5"
          style={{ backgroundColor: tint(colors.expense) }}
        >
          <Icon name="delete-outline" size={18} color={colors.expense} />
          <Text className="text-[14px] font-bold" style={{ color: colors.expense }}>
            {DELETE_ACCOUNT_LABEL}
          </Text>
        </TouchableOpacity>
      </View>

      <DeleteAccountModal visible={askingPassword} onClose={() => setAskingPassword(false)} />
    </View>
  );
}
