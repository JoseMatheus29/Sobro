import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';

import SideBar from '../components/sidebar';
import { SCROLL_PADDING_WITH_SIDEBAR } from '../components/sidebar-type';
import GradientButton from '../components/ui/GradientButton';
import ScreenScroll from '../components/ui/ScreenScroll';
import ProfileHeader from './components/ProfileHeader';
import BasicInfoForm from './components/BasicInfoForm';
import PreferencesForm from './components/PreferencesForm';
import { useFeedback } from '../components/feedback/FeedbackProvider';
import { PHOTO_PERMISSION_TOAST, PROFILE_SAVED_TOAST } from './editAcount-type';
import { useProfile } from '@/db/hooks';
import { updateProfile } from '@/db/profile';

export default function EditAcount() {
  const db = useSQLiteContext();
  const { showToast } = useFeedback();
  const { profile, loading, refetch } = useProfile();

  const [nome, setNome] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setNome(profile.name);
    setCurrency(profile.currency);
    setMonthlyBudget(profile.monthlyBudget != null ? String(profile.monthlyBudget) : '');
    setAvatarUri(profile.avatarUri);
  }, [profile]);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast(PHOTO_PERMISSION_TOAST);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSalvar = async () => {
    await updateProfile(db, {
      name: nome.trim(),
      currency,
      avatarUri,
      monthlyBudget: monthlyBudget ? Number(monthlyBudget.replace(',', '.')) : null,
    });
    await refetch();
    showToast(PROFILE_SAVED_TOAST);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F9FC]">
        <ActivityIndicator size="large" color="#3161B2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F7F9FC]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* The header scrolls with the content: a fixed one, with the content pulled up over it,
          cut the content off at its edge while scrolling. */}
      <ScreenScroll bottomPadding={SCROLL_PADDING_WITH_SIDEBAR} keyboardShouldPersistTaps="handled">
        <ProfileHeader name={nome} avatarUri={avatarUri} onPickAvatar={handlePickAvatar} />

        <View className="px-5 -mt-7">
          <BasicInfoForm nome={nome} setNome={setNome} />

          <PreferencesForm
            currency={currency} setCurrency={setCurrency}
            monthlyBudget={monthlyBudget} setMonthlyBudget={setMonthlyBudget}
          />

          <GradientButton title="Salvar Alterações" onPress={handleSalvar} />
        </View>
      </ScreenScroll>

      <SideBar />
    </KeyboardAvoidingView>
  );
}
