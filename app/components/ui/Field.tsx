import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { palette } from '@/constants/palette';
import { FieldProps } from '../../editAcount/editAcount-type';

export default function Field({
  label, placeholder, value, onChangeText,
  icon, keyboardType = 'default', secure = false, autoCapitalize = 'none',
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [showSecure, setShowSecure] = useState(false);

  return (
    <View className="mb-3.5">
      <Text className="text-[11px] font-bold text-[#7998CD] tracking-[0.8px] uppercase mb-1.5">
        {label}
      </Text>
      <View className={`flex-row items-center bg-[#F7F9FC] rounded-2xl border-[1.5px] px-3.5 h-[52px] ${focused ? 'border-[#3161B2]' : 'border-[#E8EEF5]'}`}>
        <Icon name={icon} size={18} color={focused ? palette.primary.DEFAULT : palette.subtle} />
        <TextInput
          className="flex-1 ml-2.5 text-[15px] text-ink"
          placeholder={placeholder}
          placeholderTextColor="#C0CCDA"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secure && !showSecure}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowSecure(!showSecure)}>
            <Icon name={showSecure ? 'visibility' : 'visibility-off'} size={18} color={palette.subtle} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
