import { invoiceDueMonth, invoiceMonthOf, openInvoiceMonth } from './invoice';
import { type InstallmentPlan, type InstallmentPlanInput } from './installments-type';
import { addMonths, monthKeyWithYear, monthNameOf } from './month';
import { occurrenceDate } from './recurrence';

// A purchase in installments is registered from the installment the person is paying now, not from the first: the
// ones that came before are over, were paid in invoices the app never saw and would only show up as unpaid. So the
// person gives the day of the purchase, how many installments there are and which one is current, and the
// transaction made is that installment, on its own day (the same day of each month, the last of a shorter one: the
// rule of the recurrences); the server makes the following ones when they fall due.

// The day of installment `number` (1 is the purchase itself) of a purchase made on `purchaseDay`.
export function installmentDay(purchaseDay: string, number: number): string {
  const month = addMonths(purchaseDay.slice(0, 7), number - 1);
  return occurrenceDate(month, Number(purchaseDay.slice(8, 10))).slice(0, 10);
}

// Where the plan lands: the day of the installment registered and of the last one, the invoice (or month) of each,
// and whether the installment registered has not arrived yet.
export function installmentPlan(input: InstallmentPlanInput): InstallmentPlan {
  const { purchaseDay, total, current, rules, today } = input;
  // On credit the period is the month the invoice is due in, which is how it is called and where it counts.
  const periodOf = (day: string) => (rules ? invoiceDueMonth(invoiceMonthOf(day, rules), rules) : day.slice(0, 7));
  const firstDay = installmentDay(purchaseDay, current);
  const lastDay = installmentDay(purchaseDay, total);
  const firstPeriod = periodOf(firstDay);
  const openPeriod = rules ? invoiceDueMonth(openInvoiceMonth(today, rules), rules) : today.slice(0, 7);
  return {
    current,
    total,
    firstDay,
    lastDay,
    firstPeriod,
    lastPeriod: periodOf(lastDay),
    skipped: Math.max(0, current - 1),
    onCredit: rules !== null,
    notYet: firstPeriod > openPeriod,
  };
}

// The names of the first and last period for the copy: "novembro" and "dezembro", with the year on the last one when
// the plan crosses into another year.
export function installmentLabels(plan: InstallmentPlan): { first: string; last: string } {
  const sameYear = plan.lastPeriod.slice(0, 4) === plan.firstPeriod.slice(0, 4);
  return {
    first: monthNameOf(plan.firstPeriod),
    last: sameYear ? monthNameOf(plan.lastPeriod) : monthKeyWithYear(plan.lastPeriod),
  };
}
