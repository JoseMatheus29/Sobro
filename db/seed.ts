import { type SQLiteDatabase } from 'expo-sqlite';

const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Alimentação', icon: 'restaurant', color: '#E67E22', bg: 'rgba(230,126,34,0.12)' },
  { id: 'transport', name: 'Transporte', icon: 'directions-car', color: '#3161B2', bg: 'rgba(49,97,178,0.12)' },
  { id: 'leisure', name: 'Lazer', icon: 'sports-esports', color: '#7998CD', bg: 'rgba(121,152,205,0.12)' },
  { id: 'health', name: 'Saúde', icon: 'favorite', color: '#A83636', bg: 'rgba(168,54,54,0.12)' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#9B59B6', bg: 'rgba(155,89,182,0.12)' },
  { id: 'salary', name: 'Salário', icon: 'account-balance', color: '#277F2B', bg: 'rgba(39,127,43,0.12)' },
  { id: 'invest', name: 'Investimento', icon: 'trending-up', color: '#1ABC9C', bg: 'rgba(26,188,156,0.12)' },
  { id: 'other', name: 'Outros', icon: 'category', color: '#95A5A6', bg: 'rgba(149,165,166,0.12)' },
];

const DEFAULT_CARD = {
  name: 'Cartão Principal',
  number: '0001',
  color: '#3161B2',
  lightColor: '#4A74BB',
};

export async function seedIfEmpty(db: SQLiteDatabase) {
  const categoryCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (categoryCount?.count === 0) {
    for (const category of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT INTO categories (id, name, icon, color, bg) VALUES (?, ?, ?, ?, ?)',
        category.id,
        category.name,
        category.icon,
        category.color,
        category.bg
      );
    }
  }

  const cardCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  if (cardCount?.count === 0) {
    await db.runAsync(
      'INSERT INTO cards (name, number, color, light_color, balance) VALUES (?, ?, ?, ?, ?)',
      DEFAULT_CARD.name,
      DEFAULT_CARD.number,
      DEFAULT_CARD.color,
      DEFAULT_CARD.lightColor,
      0
    );
  }

  const profileCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM profile');
  if (profileCount?.count === 0) {
    await db.runAsync('INSERT INTO profile (id, name, currency) VALUES (1, ?, ?)', '', 'BRL');
  }
}
