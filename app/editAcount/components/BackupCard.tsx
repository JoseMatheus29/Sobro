import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { exportBackup, getSchemaVersion, restoreBackup } from '@/db/backup';
import { pickBackupText, shareBackup } from '@/db/backupFile';
import { notifyDataChanged } from '@/db/events';
import { getProfile } from '@/db/profile';
import { materializeDueRecurrences } from '@/db/recurrences';
import { refreshReminders } from '@/db/reminders';
import { summarizeBackup, validateBackup } from '@/utils/backup';
import { BACKUP_REASONS } from '@/utils/backup-type';
import { formatShortDate } from '@/utils/format';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import { applyTheme } from '@/utils/applyTheme';
import {
  BACKUP_TEXT,
  BACKUP_TITLE,
  EXPORT_FAILED_TOAST,
  EXPORT_LABEL,
  EXPORT_UNAVAILABLE_TOAST,
  IMPORT_CONFIRM,
  IMPORT_DONE_TOAST,
  IMPORT_FAILED_TOAST,
  IMPORT_LABEL,
  IMPORT_REFUSED_TITLE,
} from '@/types/editAcount/editAcount-type';

// Save everything to a file, or bring it back from one. Restoring replaces all the data, so the file
// is checked first and the person confirms with what is in it.
export default function BackupCard() {
  const colors = useColors();
  const db = useSQLiteContext();
  const { showToast, confirm } = useFeedback();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const handleExport = async () => {
    setBusy('export');
    try {
      const result = await shareBackup(await exportBackup(db));
      if (result === 'unavailable') showToast(EXPORT_UNAVAILABLE_TOAST);
    } catch {
      showToast(EXPORT_FAILED_TOAST);
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    setBusy('import');
    try {
      const text = await pickBackupText();
      if (text === null) return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        showToast({ type: 'error', title: IMPORT_REFUSED_TITLE, message: BACKUP_REASONS.notJson });
        return;
      }

      const result = validateBackup(parsed, await getSchemaVersion(db));
      if (!result.ok) {
        showToast({ type: 'error', title: IMPORT_REFUSED_TITLE, message: result.reason });
        return;
      }

      const summary = summarizeBackup(result.backup);
      const date = summary.exportedAt ? formatShortDate(summary.exportedAt) : '—';
      if (!(await confirm(IMPORT_CONFIRM(summary, date)))) return;

      await restoreBackup(db, result.backup);
      // What fell due since the backup was made becomes transactions now.
      await materializeDueRecurrences(db);
      // The backup brings its own light/dark choice.
      applyTheme((await getProfile(db)).theme);
      notifyDataChanged();
      await refreshReminders(db);
      showToast(IMPORT_DONE_TOAST);
    } catch {
      showToast(IMPORT_FAILED_TOAST);
    } finally {
      setBusy(null);
    }
  };

  const options = [
    { label: EXPORT_LABEL, icon: 'file-upload', kind: 'export' as const, onPress: handleExport, filled: true },
    { label: IMPORT_LABEL, icon: 'file-download', kind: 'import' as const, onPress: handleImport, filled: false },
  ];

  return (
    <View className="bg-card rounded-[24px] p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
          <Icon name="backup" size={16} color={colors.primary.DEFAULT} />
        </View>
        <Text className="text-[15px] font-bold text-ink">{BACKUP_TITLE}</Text>
      </View>

      <Text className="text-[13px] leading-[19px] text-muted">{BACKUP_TEXT}</Text>

      <View className="flex-row gap-2.5 mt-4">
        {options.map((option) => (
          <TouchableOpacity
            key={option.kind}
            onPress={option.onPress}
            disabled={busy !== null}
            activeOpacity={0.85}
            className="flex-1 h-12 rounded-2xl flex-row items-center justify-center gap-1.5 border-[1.5px]"
            style={{
              opacity: busy !== null && busy !== option.kind ? 0.5 : 1,
              backgroundColor: option.filled ? colors.buttonGradient[0] : colors.canvas,
              borderColor: option.filled ? colors.buttonGradient[0] : colors.surface.dark,
            }}
          >
            <Icon name={option.icon} size={18} color={option.filled ? '#FFFFFF' : colors.primary.DEFAULT} />
            <Text className="text-[14px] font-bold" style={{ color: option.filled ? '#FFFFFF' : colors.primary.DEFAULT }}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
