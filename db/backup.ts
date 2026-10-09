import { type SQLiteDatabase } from 'expo-sqlite';

import { buildBackup } from '@/utils/backup';
import { BACKUP_TABLES, type BackupFile, type BackupRow, type BackupTableName, type ValidBackup } from '@/utils/backup-type';
import { seedIfEmpty } from './seed';

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

// Replaces everything in the database with what is in a backup that already passed `validateBackup`.
// It is one transaction: if anything fails, nothing is changed.
export async function restoreBackup(db: SQLiteDatabase, backup: ValidBackup): Promise<void> {
  await db.withTransactionAsync(async () => {
    // What points to others goes first.
    for (const spec of [...BACKUP_TABLES].reverse()) {
      await db.runAsync(`DELETE FROM ${spec.name}`);
    }
    for (const spec of BACKUP_TABLES) {
      const columns = spec.columns.map((c) => c.name);
      const placeholders = columns.map(() => '?').join(', ');
      for (const row of backup.data[spec.name]) {
        await db.runAsync(
          `INSERT INTO ${spec.name} (${columns.join(', ')}) VALUES (${placeholders})`,
          columns.map((name) => row[name])
        );
      }
    }
  });

  // A backup with no categories, cards or profile still leaves the app usable.
  await seedIfEmpty(db);
}
