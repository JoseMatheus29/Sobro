import { api } from '@/api/client';
import { type BackupFile } from '@/utils/backup-type';

// The newest format of backup the server takes (it takes files of any version from 1 to this one).
export const BACKUP_SCHEMA_VERSION = 8;

// Everything in the account, as the file of a backup (the same format the first version of the app saved).
export function exportBackup(): Promise<BackupFile> {
  return api<BackupFile>('GET', '/v1/backup');
}

// Replaces everything in the account with what is in a backup file, in one step: if the server refuses the file
// (400 `invalid_backup`, with the reason) nothing changes. The ids are made again, so every screen has to read again.
// What is sent is the file as it was read, because the server checks it again.
export async function restoreBackup(file: unknown): Promise<void> {
  await api('PUT', '/v1/backup', { body: file });
}
