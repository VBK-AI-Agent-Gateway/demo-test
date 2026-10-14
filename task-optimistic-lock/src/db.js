/**
 * SQLite database module: schema creation, lightweight migration for
 * existing rows missing the `version` column, and seed data.
 *
 * Optimistic locking lives in the `version` column:
 *   - every task row starts at version = 1
 *   - an UPDATE must match the expected version atomically:
 *       UPDATE tasks SET ..., version = version + 1
 *       WHERE id = ? AND version = ?
 *   - if changes === 0 -> a concurrent writer won -> 409 CONFLICT
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function resolveDbPath(override) {
  const raw = override || process.env.DB_PATH || path.join('data', 'app.db');
  const abs = path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  return abs;
}

function createDb(dbPath) {
  const abs = resolveDbPath(dbPath);
  const db = new Database(abs);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'TODO'
                    CHECK (status IN ('TODO','IN_PROGRESS','DONE')),
      version     INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version);
  `);

  // Migration: add version column to pre-existing tables that lack it.
  const cols = db.prepare(`PRAGMA table_info(tasks)`).all();
  if (!cols.some((c) => c.name === 'version')) {
    db.exec(`ALTER TABLE tasks ADD COLUMN version INTEGER NOT NULL DEFAULT 1`);
  }
}

function seed(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n;
  if (count > 0) return 0;
  const insert = db.prepare(
    `INSERT INTO tasks (id, title, description, status, version) VALUES (?, ?, ?, ?, 1)`
  );
  const rows = [
    ['t-1', 'Design review', 'Review the optimistic-lock UX copy', 'TODO'],
    ['t-2', 'Write concurrency test', 'Two requests, same version -> one 409', 'IN_PROGRESS'],
    ['t-3', 'Ship changelog', 'Announce 409 handling', 'TODO'],
    ['t-4', 'Update API docs', 'Document version field semantics', 'DONE'],
    ['t-5', 'Load test updates', 'Check atomic UPDATE under concurrency', 'TODO'],
  ];
  const tx = db.transaction((items) => {
    for (const r of items) insert.run(...r);
  });
  tx(rows);
  return rows.length;
}

module.exports = { createDb, migrate, seed, resolveDbPath };