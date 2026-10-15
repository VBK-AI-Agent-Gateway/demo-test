/**
 * Server entry: loads .env (zero-dep), opens SQLite, migrates, seeds,
 * serves API + static board UI.
 */
const { createApp } = require('./app');
const { createDb, seed } = require('./db');

const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const db = createDb();
const seeded = seed(db);

const app = createApp({ db, serveStatic: true });
const port = Number(process.env.PORT || 3000);

app.listen(port, '0.0.0.0', () => {
  console.log(
    `task-optimistic-lock API on http://0.0.0.0:${port} (seeded ${seeded} rows, db=${process.env.DB_PATH || 'data/app.db'})`
  );
});