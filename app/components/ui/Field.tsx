import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useColors } from '@/hooks/useColors';
import { FieldProps } from '@/types/editAcount/editAcount-type';

export default function Field({
  label, placeholder, value, onChangeText,
  icon, keyboardType = 'default', secure = false, autoCapitalize = 'none',
}: FieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [showSecure, setShowSecure] = useState(false);

  return (
    <View className="mb-3.5">
      <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">
        {label}
      </Text>
      <View className={`flex-row items-center bg-canvas rounded-2xl border-[1.5px] px-3.5 h-[52px] ${focused ? 'border-primary' : 'border-line'}`}>
        <Icon name={icon} size={18} color={focused ? colors.primary.DEFAULT : colors.subtle} />
        <TextInput
          className="flex-1 ml-2.5 text-[15px] text-ink"
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
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
            <Icon name={showSecure ? 'visibility' : 'visibility-off'} size={18} color={colors.subtle} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
