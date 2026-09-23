import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from 'expo-sqlite';

import SideBar from '../components/sidebar';
import GradientButton from '../components/ui/GradientButton';
import ProfileHeader from './components/ProfileHeader';
import BasicInfoForm from './components/BasicInfoForm';
import PreferencesForm from './components/PreferencesForm';
import { useProfile } from '@/db/hooks';
import { updateProfile } from '@/db/profile';

export default function EditAcount() {
  const db = useSQLiteContext();
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
      Alert.alert('Permissão necessária', 'Permita o acesso às fotos para escolher um avatar.');
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
    Alert.alert('Salvo!', 'Suas informações foram atualizadas com sucesso.');
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
      <ProfileHeader name={nome} avatarUri={avatarUri} onPickAvatar={handlePickAvatar} />

      <ScrollView
        className="flex-1 -mt-6"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BasicInfoForm nome={nome} setNome={setNome} />

        <PreferencesForm
          currency={currency} setCurrency={setCurrency}
          monthlyBudget={monthlyBudget} setMonthlyBudget={setMonthlyBudget}
        />

        <GradientButton title="Salvar Alterações" onPress={handleSalvar} />
      </ScrollView>

      <SideBar />
    </KeyboardAvoidingView>
  );
}
