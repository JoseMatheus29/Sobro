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
    <View>
      <Text className="text-[13.5px] font-semibold text-ink mb-3">Categoria</Text>
      <View className="flex-row flex-wrap gap-2">
        {categories.map((cat) => {
          const active = selectedCat === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCat(cat.id)}
              activeOpacity={0.8}
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${active ? '' : 'bg-surface'}`}
              style={active ? { backgroundColor: cat.bg } : undefined}
            >
              <Icon name={cat.icon} size={15} color={active ? cat.color : '#718096'} />
              <Text className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`} style={{ color: active ? cat.color : '#718096' }}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-subtle"
        >
          <Icon name="add" size={15} color="#718096" />
          <Text className="text-xs text-muted">Nova</Text>
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
