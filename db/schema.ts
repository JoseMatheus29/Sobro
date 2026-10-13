import { type SQLiteDatabase } from 'expo-sqlite';

import { materializeDueRecurrences } from './recurrences';
import { seedIfEmpty } from './seed';

const MIGRATIONS: string[] = [
  // v1: initial schema
  `
  CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    bg TEXT NOT NULL
  );
  CREATE TABLE cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    color TEXT NOT NULL,
    light_color TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0
  );
  CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    category_id TEXT NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    occurred_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '',
    currency TEXT NOT NULL DEFAULT 'BRL',
    avatar_uri TEXT,
    monthly_budget REAL
  );
  `,
  // v2: "Salário" moves to the darker income green (see constants/palette.ts)
  `
  UPDATE categories SET color = '#277F2B', bg = 'rgba(39,127,43,0.12)'
  WHERE id = 'salary' AND color = '#36A83A';
  `,
  // v3: the monthly budget is kept per month (the month it starts to apply from), so changing it
  // does not rewrite how past months are judged. The single value the profile had so far applies to
  // everything up to now ('0000-00'); profile.monthly_budget is not used anymore.
  `
  CREATE TABLE monthly_budgets (
    month TEXT PRIMARY KEY,
    amount REAL
  );
  INSERT INTO monthly_budgets (month, amount)
  SELECT '0000-00', monthly_budget FROM profile WHERE id = 1 AND monthly_budget IS NOT NULL;
  `,
  // v4: recurring expenses and installment plans. A transaction made by one points back to it.
  `
  CREATE TABLE recurrences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    category_id TEXT NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    day INTEGER NOT NULL,
    start_month TEXT NOT NULL,
    first_installment INTEGER NOT NULL DEFAULT 1,
    total INTEGER,
    end_month TEXT,
    generated_until TEXT NOT NULL
  );
  ALTER TABLE transactions ADD COLUMN recurrence_id INTEGER REFERENCES recurrences(id);
  ALTER TABLE transactions ADD COLUMN installment INTEGER;
  `,
  // v5: a spending limit per category (kept per month like the monthly budget), and the switch for
  // the reminders of what is about to fall due.
  `
  CREATE TABLE category_budgets (
    category_id TEXT NOT NULL REFERENCES categories(id),
    month TEXT NOT NULL,
    amount REAL,
    PRIMARY KEY (category_id, month)
  );
  ALTER TABLE profile ADD COLUMN reminders_enabled INTEGER NOT NULL DEFAULT 1;
  `,
  // v6: transfers between accounts. The two legs of a transfer (an expense in one account, an income
  // in the other) share a `transfer_id`, move the balances, and are left out of the month's income and
  // expense. Their category is "Transferência"; databases that already have categories get it here
  // (a new one gets it from the seed, which only runs on an empty table).
  `
  ALTER TABLE transactions ADD COLUMN transfer_id INTEGER;
  INSERT INTO categories (id, name, icon, color, bg)
  SELECT 'transfer', 'Transferência', 'swap-horiz', '#718096', 'rgba(113,128,150,0.12)'
  WHERE EXISTS (SELECT 1 FROM categories) AND NOT EXISTS (SELECT 1 FROM categories WHERE id = 'transfer');
  `,
  // v7: how the app is drawn: 'system' follows the phone, or 'light' / 'dark' to force one.
  `
  ALTER TABLE profile ADD COLUMN theme TEXT NOT NULL DEFAULT 'system';
  `,
  // v8: caixinhas (savings goals). The money stays in the accounts: an entry only says how much of it is
  // set aside for the goal (positive: put in, negative: taken out), so no balance and no month's total moves.
  `
  CREATE TABLE goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    target_month TEXT,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE goal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL REFERENCES goals(id),
    amount REAL NOT NULL,
    occurred_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `,
];

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const { user_version: currentVersion } = (await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  ))!;

  let version = currentVersion;
  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    await db.execAsync(MIGRATIONS[i]);
    version = i + 1;
  }

  if (version !== currentVersion) {
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }

  await seedIfEmpty(db);
  // Recurring expenses that fell due since the app last ran become transactions.
  await materializeDueRecurrences(db);
}
