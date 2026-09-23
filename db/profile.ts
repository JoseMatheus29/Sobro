import { type SQLiteDatabase } from 'expo-sqlite';

export interface ProfileRecord {
  name: string;
  currency: string;
  avatarUri: string | null;
  monthlyBudget: number | null;
}

interface ProfileRow {
  name: string;
  currency: string;
  avatar_uri: string | null;
  monthly_budget: number | null;
}

const DEFAULT_PROFILE: ProfileRecord = { name: '', currency: 'BRL', avatarUri: null, monthlyBudget: null };

function mapRow(row: ProfileRow): ProfileRecord {
  return { name: row.name, currency: row.currency, avatarUri: row.avatar_uri, monthlyBudget: row.monthly_budget };
}

export async function getProfile(db: SQLiteDatabase): Promise<ProfileRecord> {
  const row = await db.getFirstAsync<ProfileRow>(
    'SELECT name, currency, avatar_uri, monthly_budget FROM profile WHERE id = 1'
  );
  return row ? mapRow(row) : DEFAULT_PROFILE;
}

export async function updateProfile(
  db: SQLiteDatabase,
  patch: Partial<{ name: string; currency: string; avatarUri: string | null; monthlyBudget: number | null }>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (patch.name !== undefined) { fields.push('name = ?'); values.push(patch.name); }
  if (patch.currency !== undefined) { fields.push('currency = ?'); values.push(patch.currency); }
  if (patch.avatarUri !== undefined) { fields.push('avatar_uri = ?'); values.push(patch.avatarUri); }
  if (patch.monthlyBudget !== undefined) { fields.push('monthly_budget = ?'); values.push(patch.monthlyBudget); }
  if (fields.length === 0) return;

  await db.runAsync(`UPDATE profile SET ${fields.join(', ')} WHERE id = 1`, values);
}
