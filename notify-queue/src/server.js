/**
 * Server entry: loads .env (tiny zero-dependency loader) then starts the API.
 * Run the consumer separately: `npm run worker` (or via docker compose).
 */
const { createApp } = require('./app');

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

const app = createApp();
const port = Number(process.env.PORT || 3000);

app.listen(port, '0.0.0.0', () => {
  console.log(`notify-queue API listening on http://0.0.0.0:${port}`);
});