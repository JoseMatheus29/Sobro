import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { isApiError, isNetworkError } from '@/api/errors';
import { useColors } from '@/hooks/useColors';
import { BACKUP_SCHEMA_VERSION, exportBackup, restoreBackup } from '@/db/backup';
import { pickBackupText, shareBackup } from '@/db/backupFile';
import { resetAllData } from '@/db/events';
import { refreshReminders } from '@/db/reminders';
import { summarizeBackup, validateBackup } from '@/utils/backup';
import { BACKUP_REASONS } from '@/utils/backup-type';
import { formatShortDate } from '@/utils/format';
import { errorToast } from '@/utils/apiErrors';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import { useProfiles } from '@/hooks/useProfiles';
import {
  BACKUP_TEXT,
  BACKUP_TEXT_OF,
  BACKUP_TITLE,
  BACKUP_TITLE_OF,
  EXPORT_FAILED_TOAST,
  EXPORT_LABEL,
  EXPORT_UNAVAILABLE_TOAST,
  IMPORT_CONFIRM,
  IMPORT_DONE_TOAST,
  IMPORT_FAILED_TOAST,
  IMPORT_LABEL,
  IMPORT_REFUSED_TITLE,
} from '@/types/editAcount/editAcount-type';

// Save everything in the account to a file, or bring it back from one. Restoring replaces all the data, so the file
// is checked first and the person confirms with what is in it. With a profile of someone else open it is that profile's
// data (the server reads the profile from the header of the call).
export default function BackupCard() {
  const colors = useColors();
  const { showToast, confirm } = useFeedback();
  const { active } = useProfiles();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const handleExport = async () => {
    setBusy('export');
    try {
      const result = await shareBackup(await exportBackup());
      if (result === 'unavailable') showToast(EXPORT_UNAVAILABLE_TOAST);
    } catch (error) {
      showToast(isNetworkError(error) || isApiError(error) ? errorToast(error, EXPORT_FAILED_TOAST.title) : EXPORT_FAILED_TOAST);
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

      // The shape is checked here to say what is in the file; the server checks it all again.
      const result = validateBackup(parsed, BACKUP_SCHEMA_VERSION);
      if (!result.ok) {
        showToast({ type: 'error', title: IMPORT_REFUSED_TITLE, message: result.reason });
        return;
      }

      const summary = summarizeBackup(result.backup);
      const date = summary.exportedAt ? formatShortDate(summary.exportedAt) : '—';
      if (!(await confirm(IMPORT_CONFIRM(summary, date, active?.name)))) return;

      try {
        await restoreBackup(parsed);
      } catch (error) {
        // A refusal (400 `invalid_backup`) says what is wrong with the file; nothing was changed.
        showToast(isNetworkError(error) || isApiError(error) ? errorToast(error, IMPORT_REFUSED_TITLE) : IMPORT_FAILED_TOAST);
        return;
      }
      // The ids are others now: whatever was read is thrown away and what is on screen is read again.
      await resetAllData();
      await refreshReminders();
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
        <Text className="text-[15px] font-bold text-ink">{active ? BACKUP_TITLE_OF(active.name) : BACKUP_TITLE}</Text>
      </View>

      <Text className="text-[13px] leading-[19px] text-muted">{active ? BACKUP_TEXT_OF(active.name) : BACKUP_TEXT}</Text>

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
