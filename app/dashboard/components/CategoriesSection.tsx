import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CategoryCard from '../CategoryCard';
import { type CategoryTotal } from '@/db/transactions';

interface CategoriesSectionProps {
  categories: CategoryTotal[];
  budgetOrTotal: number;
  onSeeAll: () => void;
}

export default function CategoriesSection({ categories, budgetOrTotal, onSeeAll }: CategoriesSectionProps) {
  const topCategories = categories.slice(0, 2);

  return (
    <View className="mb-3">
      <View className="flex-row justify-between items-center mb-3.5">
        <Text className="text-[17px] font-bold text-[#1A2B4A]">Categorias</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text className="text-[13px] text-[#3161B2] font-semibold">Ver detalhes</Text>
        </TouchableOpacity>
      </View>
      {topCategories.length > 0 ? (
        <View className="flex-row gap-3">
          {topCategories.map((cat) => (
            <CategoryCard
              key={cat.categoryId}
              name={cat.categoryName}
              value={cat.total}
              total={budgetOrTotal || cat.total}
              icon={cat.icon}
              color={cat.color}
              bg={cat.bg}
            />
          ))}
        </View>
      ) : (
        <Text className="text-sm text-[#A0AEC0]">Nenhum gasto registrado neste mês.</Text>
      )}
    </View>
  );
}
