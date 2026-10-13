import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import {
  CATEGORY_HEADINGS,
  CategoryStepProps,
  NEW_CATEGORY_LABEL,
} from '@/types/registrationSpent/registrationSpent-type';
import NewCategoryModal from '@/app/registrationSpent/components/NewCategoryModal';

export default function CategoryStep({
  type, categories, selectedCat, amountText, typeColor, onPick, onCategoryCreated,
}: CategoryStepProps) {
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-5 pt-6 pb-8"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-[15px] font-bold" style={{ color: typeColor }}>R$ {amountText}</Text>
      <Text className="text-[26px] font-bold text-ink mt-1 mb-5 leading-8">{CATEGORY_HEADINGS[type]}</Text>

      {/* Three equal tiles per row. Picking one moves straight to the next step. */}
      <View className="flex-row flex-wrap -mx-1.5">
        {categories.map((cat) => {
          const active = selectedCat === cat.id;
          return (
            <View key={cat.id} className="w-1/3 p-1.5">
              <TouchableOpacity
                onPress={() => onPick(cat.id)}
                activeOpacity={0.8}
                accessibilityState={{ selected: active }}
                className="h-28 rounded-[20px] border-2 items-center justify-center gap-2.5 px-1 shadow-sm shadow-black/5 elevation-1"
                style={{
                  backgroundColor: active ? `${cat.color}0F` : colors.card,
                  borderColor: active ? cat.color : 'transparent',
                }}
              >
                {/* Same tinted rounded square used by the Dashboard and the transaction rows. */}
                <View
                  className="w-11 h-11 rounded-[14px] items-center justify-center"
                  style={{ backgroundColor: `${cat.color}1F` }}
                >
                  <Icon name={cat.icon} size={22} color={cat.color} />
                </View>
                <Text
                  numberOfLines={1}
                  className={`text-[13px] text-ink ${active ? 'font-bold' : 'font-medium'}`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        className="h-14 mt-4 rounded-2xl border-[1.5px] border-dashed border-subtle flex-row items-center justify-center gap-1.5"
      >
        <Icon name="add" size={20} color={colors.primary.DEFAULT} />
        <Text className="text-[15px] font-bold text-primary">{NEW_CATEGORY_LABEL}</Text>
      </TouchableOpacity>

      <NewCategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={(id) => {
          setModalVisible(false);
          onCategoryCreated();
          onPick(id);
        }}
      />
    </ScrollView>
  );
}
