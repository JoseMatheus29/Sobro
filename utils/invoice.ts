import { type PaymentMethod, type TransactionRecord } from '@/db/transactions';
import { INVOICE_EPSILON, type Invoice, type InvoiceRules, type InvoiceStatus } from './invoice-type';
import { addMonths, MONTH_NAMES, monthKeyWithYear, monthNameOf } from './month';
import { lastMonthOf, occurrenceDate, occurrenceIn } from './recurrence';
import { PLANNED_ID_BASE, type RecurrenceRecord } from './recurrence-type';

// The credit card invoice is not stored: it is worked out from the purchases made on credit and from the payments.
// The rules are the ones of the API guide (docs/api-cartao-credito.md): the KEY of an invoice is the month it closes
// in; a purchase made up to the closing day goes into that month's invoice, a later one into the next. What the
// person SEES is the month it is due in (`invoiceName`...), the way the bank calls it, which is also the month what
// is bought on credit counts in (docs/api-mes-do-gasto.md).
// Days are calendar days ('YYYY-MM-DD'), so no time zone moves a purchase to another invoice.

const pad = (n: number) => String(n).padStart(2, '0');

function lastDayOf(month: string): number {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

// The calendar day of a Date on the phone, as 'YYYY-MM-DD'.
export function localDay(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Today on the phone's calendar.
export function todayKey(now: Date = new Date()): string {
  return localDay(now);
}

// "03 nov"
export function formatCalendarDay(day: string): string {
  return `${day.slice(8, 10)} ${MONTH_NAMES[Number(day.slice(5, 7)) - 1].slice(0, 3)}`;
}

// "nov", for the tag of the invoice on a list.
export function shortMonthName(month: string): string {
  return MONTH_NAMES[Number(month.slice(5, 7)) - 1].slice(0, 3);
}

// The calendar day of a transaction (its date is noon UTC of that day).
export function dayOf(occurredAt: string): string {
  return occurredAt.slice(0, 10);
}

export function closesOn(month: string, rules: InvoiceRules): string {
  return `${month}-${pad(Math.min(rules.closingDay, lastDayOf(month)))}`;
}

// The day after the previous invoice closed.
export function opensOn(month: string, rules: InvoiceRules): string {
  const [year, m, day] = closesOn(addMonths(month, -1), rules).split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, day + 1)).toISOString().slice(0, 10);
}

// On the due day of the month it closes in when that day comes after the closing day, otherwise on the next month's.
export function dueOn(month: string, rules: InvoiceRules): string {
  const base = rules.dueDay > rules.closingDay ? month : addMonths(month, 1);
  return `${base}-${pad(Math.min(rules.dueDay, lastDayOf(base)))}`;
}

// The invoice a purchase of that day falls in.
export function invoiceMonthOf(day: string, rules: InvoiceRules): string {
  const month = day.slice(0, 7);
  return Number(day.slice(8, 10)) <= Math.min(rules.closingDay, lastDayOf(month)) ? month : addMonths(month, 1);
}

// The invoice that is taking purchases today.
export function openInvoiceMonth(today: string, rules: InvoiceRules): string {
  return invoiceMonthOf(today, rules);
}

// The month an invoice is due in (the key of the invoice is the month it closes in). The invoice is called by this
// month, the way the bank calls it, and what is bought on credit counts in it: it is when the money leaves.
export function invoiceDueMonth(month: string, rules: InvoiceRules): string {
  return dueOn(month, rules).slice(0, 7);
}

// The name of an invoice, by the month it is due in: "dezembro" for the one that closes on 25/11 and is due on 05/12.
export function invoiceName(month: string, rules: InvoiceRules): string {
  return monthNameOf(invoiceDueMonth(month, rules));
}

// The same with the year: "dezembro 2026".
export function invoiceNameWithYear(month: string, rules: InvoiceRules): string {
  return monthKeyWithYear(invoiceDueMonth(month, rules));
}

// The name of the invoice a purchase of that day goes into.
export function invoiceNameOf(day: string, rules: InvoiceRules): string {
  return invoiceName(invoiceMonthOf(day, rules), rules);
}

// The short name ("dez") of the invoice a purchase of that day goes into, for the tag on a list.
export function invoiceShortNameOf(day: string, rules: InvoiceRules): string {
  return shortMonthName(invoiceDueMonth(invoiceMonthOf(day, rules), rules));
}

// The month an expense counts in, the same as the API's `spendingMonth`: on credit, the month the invoice that
// receives it is due in; anything else, the month of its day.
export function spendingMonthOf(
  day: string,
  paymentMethod: PaymentMethod | null | undefined,
  rules: InvoiceRules | null
): string {
  return paymentMethod === 'credit' && rules ? invoiceDueMonth(invoiceMonthOf(day, rules), rules) : day.slice(0, 7);
}

// The day of its spending month on which the money of an expense leaves: the due day on credit, its own day otherwise.
// It is what puts an expense "so far" in a month when two months are compared up to the same day.
export function spendingDayOf(
  day: string,
  paymentMethod: PaymentMethod | null | undefined,
  rules: InvoiceRules | null
): number {
  if (paymentMethod === 'credit' && rules) return Number(dueOn(invoiceMonthOf(day, rules), rules).slice(8, 10));
  return Number(day.slice(8, 10));
}

// The calendar months a cycle touches (one or two): where its purchases have to be read from.
export function cycleMonths(month: string, rules: InvoiceRules): string[] {
  const first = opensOn(month, rules).slice(0, 7);
  return first === month ? [month] : [first, month];
}

function statusOf(today: string, closes: string, due: string, remaining: number): InvoiceStatus {
  if (today <= closes) return 'open';
  if (remaining <= INVOICE_EPSILON) return 'paid';
  return today > due ? 'overdue' : 'closed';
}

const sumAbs = (list: TransactionRecord[]) => list.reduce((sum, t) => sum + Math.abs(t.amount), 0);
const newestFirst = (a: TransactionRecord, b: TransactionRecord) =>
  a.occurredAt === b.occurredAt ? b.id - a.id : a.occurredAt < b.occurredAt ? 1 : -1;

// What the recurring expenses paid on credit will put in the cycle but did not yet: the occurrences after the last
// month the server turned into a transaction. Marked `planned`, like the rows of a future month.
export function plannedPurchases(
  recurrences: RecurrenceRecord[],
  month: string,
  rules: InvoiceRules,
  cardId: number
): TransactionRecord[] {
  const planned: TransactionRecord[] = [];
  for (const r of recurrences) {
    if (r.cardId !== cardId || r.paymentMethod !== 'credit') continue;
    for (const m of cycleMonths(month, rules)) {
      if (m <= r.generatedUntil) continue;
      const occurrence = occurrenceIn(r, m);
      if (!occurrence || invoiceMonthOf(dayOf(occurrence.date), rules) !== month) continue;
      planned.push({
        id: -(r.id * PLANNED_ID_BASE + occurrence.installment),
        cardId: r.cardId,
        cardName: r.cardName,
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        categoryIcon: r.categoryIcon,
        categoryColor: r.categoryColor,
        name: r.name,
        description: r.description,
        amount: -r.amount,
        type: 'expense',
        occurredAt: occurrence.date,
        createdAt: occurrence.date,
        planned: true,
        recurrence: { id: r.id, installment: occurrence.installment, total: r.total },
        paymentMethod: 'credit',
      });
    }
  }
  return planned;
}

// The last invoice a plan on this card reaches: where the installments registered today stop. Null when there is
// no plan with an end (a monthly expense without end has no last invoice).
export function lastPlannedInvoice(recurrences: RecurrenceRecord[], rules: InvoiceRules, cardId: number): string | null {
  let last: string | null = null;
  for (const r of recurrences) {
    if (r.cardId !== cardId || r.paymentMethod !== 'credit') continue;
    const end = lastMonthOf(r);
    if (end === null) continue;
    const invoice = invoiceMonthOf(dayOf(occurrenceDate(end, r.day)), rules);
    if (last === null || invoice > last) last = invoice;
  }
  return last;
}

// One invoice of a card. `purchases` are the transactions made on credit (any month: the ones outside the cycle are
// ignored), `payments` the payments of invoices of this card, `planned` what `plannedPurchases` found.
export function buildInvoice(input: {
  month: string;
  rules: InvoiceRules;
  purchases: TransactionRecord[];
  payments: TransactionRecord[];
  planned?: TransactionRecord[];
  today: string;
}): Invoice {
  const { month, rules, today } = input;
  const real = input.purchases.filter(
    (t) =>
      t.type === 'expense' &&
      t.paymentMethod === 'credit' &&
      !t.planned &&
      invoiceMonthOf(dayOf(t.occurredAt), rules) === month
  );
  const planned = input.planned ?? [];
  const boughtTotal = sumAbs(real);
  const plannedTotal = sumAbs(planned);
  const payments = input.payments.filter((t) => t.invoiceMonth === month);
  const paid = sumAbs(payments);
  const remaining = Math.max(0, boughtTotal - paid);
  const closes = closesOn(month, rules);
  const due = dueOn(month, rules);

  return {
    month,
    opensOn: opensOn(month, rules),
    closesOn: closes,
    dueOn: due,
    total: boughtTotal + plannedTotal,
    paid,
    remaining,
    plannedTotal,
    status: statusOf(today, closes, due, remaining),
    purchases: [...real, ...planned].sort(newestFirst),
    payments: [...payments].sort(newestFirst),
  };
}

// Whole days from `from` to `to` (both 'YYYY-MM-DD'): positive when `to` is later.
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}
