import { type SQLiteDatabase } from 'expo-sqlite';

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
}
