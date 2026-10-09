import { type SQLiteDatabase } from 'expo-sqlite';

export interface CategoryRecord {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
}

export async function getCategories(db: SQLiteDatabase): Promise<CategoryRecord[]> {
  return db.getAllAsync<CategoryRecord>('SELECT id, name, icon, color, bg FROM categories ORDER BY rowid ASC');
}

export async function createCategory(
  db: SQLiteDatabase,
  input: { name: string; icon: string; color: string; bg: string }
): Promise<string> {
  const id = `custom-${Date.now()}`;
  await db.runAsync(
    'INSERT INTO categories (id, name, icon, color, bg) VALUES (?, ?, ?, ?, ?)',
    id,
    input.name,
    input.icon,
    input.color,
    input.bg
  );
  return id;
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  patch: Partial<{ name: string; icon: string; color: string; bg: string }>
): Promise<void> {
  const fields: string[] = [];
  const values: string[] = [];
  if (patch.name !== undefined) { fields.push('name = ?'); values.push(patch.name); }
  if (patch.icon !== undefined) { fields.push('icon = ?'); values.push(patch.icon); }
  if (patch.color !== undefined) { fields.push('color = ?'); values.push(patch.color); }
  if (patch.bg !== undefined) { fields.push('bg = ?'); values.push(patch.bg); }
  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
}

/** Throws if the category still has transactions, instead of silently deleting expense history. */
export async function deleteCategory(db: SQLiteDatabase, id: string): Promise<void> {
  const usage = await db.getFirstAsync<{ count: number }>(
    `SELECT (SELECT COUNT(*) FROM transactions WHERE category_id = ?)
          + (SELECT COUNT(*) FROM recurrences WHERE category_id = ?) as count`,
    id,
    id
  );
  if (usage && usage.count > 0) {
    throw new Error('Não é possível excluir uma categoria com transações registradas.');
  }
  await db.runAsync('DELETE FROM category_budgets WHERE category_id = ?', id);
  await db.runAsync('DELETE FROM categories WHERE id = ?', id);
}
