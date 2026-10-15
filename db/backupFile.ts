import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { backupFileName } from '@/utils/backup';
import { BACKUP_FILE_PREFIX, type BackupFile } from '@/utils/backup-type';

export type ShareResult = 'shared' | 'unavailable';

// Writes the backup to a file and opens the system's share sheet, where the person chooses where it
// goes: Drive, e-mail, the Files app. The copy in the cache is only a stop on the way.
export async function shareBackup(backup: BackupFile): Promise<ShareResult> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';

  const file = new File(Paths.cache, backupFileName(new Date(), BACKUP_FILE_PREFIX));
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Salvar backup', UTI: 'public.json' });
  return 'shared';
}

// Lets the person choose a file and returns its text; null when they back out. Any type is accepted
// because some phones label a .json as plain text: what is inside is what gets checked.
export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled || result.assets.length === 0) return null;
  return new File(result.assets[0].uri).text();
}
