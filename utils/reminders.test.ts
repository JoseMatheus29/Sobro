import { buildReminders } from './reminders';
import { MAX_REMINDERS } from './reminders-type';
import { type RecurrenceRecord } from './recurrence-type';

// Friday, 9 October 2026, 08:00 local.
const NOW = new Date(2026, 9, 9, 8, 0, 0);

function recurrence(overrides: Partial<RecurrenceRecord> = {}): RecurrenceRecord {
  return {
    id: 1,
    cardId: 1,
    cardName: 'Cartão Principal',
    categoryId: 'housing',
    categoryName: 'Moradia',
    categoryIcon: 'home',
    categoryColor: '#3161B2',
    name: 'Aluguel',
    description: null,
    amount: 1200,
    day: 10,
    startMonth: '2026-09',
    firstInstallment: 1,
    total: null,
    endMonth: null,
    generatedUntil: '2026-09',
    ...overrides,
  };
}

describe('buildReminders', () => {
  it('goes off the morning before the due day, at 9h', () => {
    const [first] = buildReminders([recurrence()], NOW);
    expect(first.fireAt).toEqual(new Date(2026, 9, 9, 9, 0, 0));
    expect(first.title).toBe('Aluguel vence amanhã');
    expect(first.body).toBe('R$ 1.200,00');
  });

  it('says which installment it is', () => {
    const [first] = buildReminders(
      [recurrence({ name: 'Parcela do celular', amount: 150, day: 20, firstInstallment: 3, total: 10 })],
      NOW
    );
    expect(first.body).toBe('Parcela 4/10 · R$ 150,00');
  });

  it('skips a reminder whose time already passed', () => {
    const late = new Date(2026, 9, 9, 10, 0, 0);
    const reminders = buildReminders([recurrence()], late);
    expect(reminders[0].fireAt).toEqual(new Date(2026, 10, 9, 9, 0, 0));
  });

  it('schedules the next months too, within the window, nearest first', () => {
    const reminders = buildReminders([recurrence(), recurrence({ id: 2, name: 'Internet', day: 15 })], NOW);
    expect(reminders.map((r) => r.title)).toEqual([
      'Aluguel vence amanhã',
      'Internet vence amanhã',
      'Aluguel vence amanhã',
      'Internet vence amanhã',
    ]);
    expect(new Set(reminders.map((r) => r.key)).size).toBe(reminders.length);
  });

  it('stops at the last payment of a plan', () => {
    const plan = recurrence({ name: 'IPVA', day: 28, startMonth: '2026-09', firstInstallment: 2, total: 3 });
    // payment 2 was in September; only payment 3 (October) is left
    expect(buildReminders([plan], NOW).map((r) => r.body)).toEqual(['Parcela 3/3 · R$ 1.200,00']);
  });

  it('has none for a recurrence that was ended', () => {
    expect(buildReminders([recurrence({ endMonth: '2026-09' })], NOW)).toEqual([]);
  });

  it('never goes over the limit of scheduled notifications', () => {
    const many = Array.from({ length: 60 }, (_, i) => recurrence({ id: i + 1, name: `Conta ${i}`, day: 1 + (i % 28) }));
    expect(buildReminders(many, NOW).length).toBeLessThanOrEqual(MAX_REMINDERS);
  });
});
