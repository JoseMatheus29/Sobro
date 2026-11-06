import { useCallback } from 'react';

import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import { checkSpendingAlerts } from '@/db/spendingAlerts';
import { type TransactionRecord } from '@/db/transactions';
import { alertToast, changeOf } from '@/utils/spendingAlerts';
import { ALERT_DELAY_MS } from '@/utils/spendingAlerts-type';

// The month an expense counts in.
const monthOf = (t: TransactionRecord) => t.spendingMonth ?? t.occurredAt.slice(0, 7);

// After an expense was saved: tells, with a toast, when it took the month's budget or the limit of its category close to
// the ceiling (80%) or past it. Call it right after the confirmation toast; the warning comes up a moment later so that
// one can be read, and only when a step was crossed because of this expense (see utils/spendingAlerts.ts). `before` is
// the expense as it was, for an edit.
export function useSpendingAlertToast() {
  const { showToast } = useFeedback();

  return useCallback(
    (saved: TransactionRecord, before?: TransactionRecord) => {
      const added = changeOf(saved);
      if (!added) return;
      const month = monthOf(saved);
      // What it replaces counts only if it was in the same month.
      const removed = before && monthOf(before) === month ? changeOf(before) : null;

      void checkSpendingAlerts({ month, added, removed }).then((alerts) => {
        const toast = alertToast(alerts);
        if (toast) setTimeout(() => showToast(toast), ALERT_DELAY_MS);
      });
    },
    [showToast]
  );
}
