import { type SQLiteDatabase } from 'expo-sqlite';

export interface ProfileRecord {
  name: string;
  currency: string;
  /** Reminders, the day before, of the recurring expenses about to fall due. */
  remindersEnabled: boolean;
}

interface ProfileRow {
  name: string;
  currency: string;
  reminders_enabled: number;
}

const DEFAULT_PROFILE: ProfileRecord = {
  name: '',
  currency: 'BRL',
  remindersEnabled: true,
};

function mapRow(row: ProfileRow): ProfileRecord {
  return {
    name: row.name,
    currency: row.currency,
    remindersEnabled: row.reminders_enabled === 1,
  };
}

export async function getProfile(db: SQLiteDatabase): Promise<ProfileRecord> {
  const row = await db.getFirstAsync<ProfileRow>(
    'SELECT name, currency, reminders_enabled FROM profile WHERE id = 1'
  );
  return row ? mapRow(row) : DEFAULT_PROFILE;
}

export async function updateProfile(
  db: SQLiteDatabase,
  patch: Partial<{ name: string; currency: string; remindersEnabled: boolean }>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (patch.name !== undefined) { fields.push('name = ?'); values.push(patch.name); }
  if (patch.currency !== undefined) { fields.push('currency = ?'); values.push(patch.currency); }
  if (patch.remindersEnabled !== undefined) { fields.push('reminders_enabled = ?'); values.push(patch.remindersEnabled ? 1 : 0); }
  if (fields.length === 0) return;

  await db.runAsync(`UPDATE profile SET ${fields.join(', ')} WHERE id = 1`, values);
}
