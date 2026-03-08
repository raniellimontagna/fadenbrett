import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import * as schema from './schema/index.js';

const DB_PATH = process.env.DB_PATH ?? 'data/sqlite/fadenbrett.db';

// Ensure directory exists
mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

/**
 * Run migrations by creating tables if they don't exist.
 * We use raw SQL here to avoid needing drizzle-kit at runtime.
 */
export function runMigrations(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      snapshot TEXT
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      era_label TEXT DEFAULT '',
      group_color TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      position_x REAL NOT NULL DEFAULT 0,
      position_y REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      content TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#fde68a',
      rotation REAL NOT NULL DEFAULT 0,
      position_x REAL NOT NULL DEFAULT 0,
      position_y REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      label TEXT DEFAULT '',
      style TEXT NOT NULL DEFAULT 'solid',
      color TEXT NOT NULL DEFAULT '#a78bfa',
      route_type TEXT NOT NULL DEFAULT 'bezier',
      curvature REAL NOT NULL DEFAULT 0.3,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS card_tags (
      card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (card_id, tag_id)
    );
  `);

  // Incremental migrations for existing databases
  const cols = sqlite.prepare("PRAGMA table_info('connections')").all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has('route_type')) {
    sqlite.exec("ALTER TABLE connections ADD COLUMN route_type TEXT NOT NULL DEFAULT 'bezier'");
  }
  if (!colNames.has('curvature')) {
    sqlite.exec('ALTER TABLE connections ADD COLUMN curvature REAL NOT NULL DEFAULT 0.3');
  }

  // S038: Add description and color columns to boards
  const boardCols = sqlite.prepare("PRAGMA table_info('boards')").all() as { name: string }[];
  const boardColNames = new Set(boardCols.map((c) => c.name));
  if (!boardColNames.has('description')) {
    sqlite.exec("ALTER TABLE boards ADD COLUMN description TEXT DEFAULT ''");
  }
  if (!boardColNames.has('color')) {
    sqlite.exec("ALTER TABLE boards ADD COLUMN color TEXT DEFAULT ''");
  }
}
