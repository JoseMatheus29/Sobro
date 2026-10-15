import { type SQLiteDatabase } from 'expo-sqlite';

import { buildBackup } from '@/utils/backup';
import { BACKUP_TABLES, type BackupFile, type BackupRow, type BackupTableName } from '@/utils/backup-type';

// The old local database (sobro.db, from the version that kept everything on the phone), read only. It is
// never written to: its only use now is to send what is in it to the account (see db/legacy/migration.ts).

export async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

// The whole database as the file of a backup. Table and column names come from BACKUP_TABLES, never
// from outside, so they are safe to put in the statements.
export async function exportBackup(db: SQLiteDatabase): Promise<BackupFile> {
  const schemaVersion = await getSchemaVersion(db);

  const tables: Partial<Record<BackupTableName, BackupRow[]>> = {};
  for (const spec of BACKUP_TABLES) {
    const columns = spec.columns.map((c) => c.name).join(', ');
    tables[spec.name] = await db.getAllAsync<BackupRow>(`SELECT ${columns} FROM ${spec.name}`);
  }
  return buildBackup(tables, schemaVersion, new Date());
}
