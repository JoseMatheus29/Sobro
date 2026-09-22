import React, { useState } from 'react';
import {
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import SideBar from '../components/sidebar';
import GradientButton from '../components/ui/GradientButton';
import ProfileHeader from './components/ProfileHeader';
import BasicInfoForm from './components/BasicInfoForm';

export default function EditAcount() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleSalvar = () => {
    Alert.alert('Salvo!', 'Suas informações foram atualizadas com sucesso.');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F7F9FC]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ProfileHeader name="João Silva Souza" email="joao@email.com" />

      <ScrollView
        className="flex-1 -mt-6"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BasicInfoForm
          nome={nome} setNome={setNome}
          email={email} setEmail={setEmail}
          telefone={telefone} setTelefone={setTelefone}
        />

        <GradientButton title="Salvar Alterações" onPress={handleSalvar} />
      </ScrollView>

      <SideBar />
    </KeyboardAvoidingView>
  );
}
