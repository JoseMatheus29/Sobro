import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Category } from '../registrationSpent-type';
import NewCategoryModal from './NewCategoryModal';

interface CategorySelectorProps {
  categories: Category[];
  selectedCat: string | null;
  setSelectedCat: (id: string) => void;
  onCategoryCreated: () => void;
}

export default function CategorySelector({
  categories, selectedCat, setSelectedCat, onCategoryCreated
}: CategorySelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View className="bg-white rounded-[24px] p-5 mb-4 shadow-lg shadow-black/5 elevation-4">
      <Text className="text-[13px] font-bold text-[#1A2B4A] mb-3.5">Categoria</Text>
      <View className="flex-row flex-wrap gap-2.5">
        {categories.map((cat) => {
          const active = selectedCat === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCat(cat.id)}
              activeOpacity={0.8}
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border-[1.5px] ${active ? '' : 'bg-[#F7F9FC] border-transparent'}`}
              style={{ backgroundColor: active ? cat.bg : undefined, borderColor: active ? cat.color : undefined }}
            >
              <Icon name={cat.icon} size={16} color={active ? cat.color : '#A0AEC0'} />
              <Text className={`text-xs ${active ? 'font-bold' : 'font-medium'}`} style={{ color: active ? cat.color : '#718096' }}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border-[1.5px] border-dashed border-[#C0CCDA] bg-[#F7F9FC]"
        >
          <Icon name="add" size={16} color="#718096" />
          <Text className="text-xs font-medium text-[#718096]">Nova</Text>
        </TouchableOpacity>
      </View>

      <NewCategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={(id) => {
          setModalVisible(false);
          onCategoryCreated();
          setSelectedCat(id);
        }}
      />
    </View>
  );
}
