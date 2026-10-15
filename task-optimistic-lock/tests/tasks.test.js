/**
 * Integration tests: optimistic locking on task updates.
 *
 * Acceptance:
 *   - concurrent updates carrying the SAME expected version:
 *     exactly one succeeds (200, version incremented), the other gets 409
 *     CONFLICT with the authoritative current version in details.
 *   - stale version -> 409; correct version -> 200 + version+1
 *   - missing version -> 400 validation error
 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createDb, seed } = require('../src/db');
const { createApp } = require('../src/app');

let db;
let app;
let tmpDir;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tlock-'));
  db = createDb(path.join(tmpDir, 'test.db'));
  seed(db);
  app = createApp({ db });
});

afterAll(() => {
  if (db) db.close();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
});

async function createTask(overrides = {}) {
  const res = await request(app)
    .post('/api/tasks')
    .send({ title: 'concurrent target', ...overrides })
    .expect(201);
  return res.body.data;
}

describe('happy path', () => {
  test('GET /api/tasks lists seeded tasks with version', async () => {
    const res = await request(app).get('/api/tasks').expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((t) => expect(typeof t.version).toBe('number'));
  });

  test('POST creates a task at version 1', async () => {
    const task = await createTask({ title: 'fresh' });
    expect(task.version).toBe(1);
  });

  test('PUT with correct version succeeds and increments version', async () => {
    const task = await createTask({ title: 'will update' });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ version: task.version, title: 'updated title' })
      .expect(200);
    expect(res.body.data.title).toBe('updated title');
    expect(res.body.data.version).toBe(task.version + 1);
  });

  test('PUT with stale version -> 409 CONFLICT with current state', async () => {
    const task = await createTask({ title: 'stale' });
    // bump server-side
    await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ version: task.version, title: 'first write' })
      .expect(200);

    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ version: task.version /* stale */, title: 'second write' })
      .expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.details.currentVersion).toBe(task.version + 1);
    expect(res.body.error.details.task.title).toBe('first write');
  });

  test('PUT without version -> 400 validation error', async () => {
    const task = await createTask({ title: 'no version' });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ title: 'nope' })
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.details).toBeDefined();
  });

  test('PUT on unknown id -> 404', async () => {
    await request(app)
      .put('/api/tasks/does-not-exist')
      .send({ version: 1, title: 'x' })
      .expect(404);
  });
});

describe('concurrency: two simultaneous updates with the same version', () => {
  test('exactly one succeeds (200), the other gets 409 CONFLICT', async () => {
    const task = await createTask({ title: 'race target', status: 'TODO' });
    const sharedVersion = task.version; // both clients read version=1

    // Fire both requests at once.
    const [a, b] = await Promise.all([
      request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ version: sharedVersion, title: 'writer A', status: 'IN_PROGRESS' }),
      request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ version: sharedVersion, title: 'writer B', status: 'DONE' }),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);

    const winner = a.status === 200 ? a : b;
    const loser = a.status === 409 ? a : b;

    // Winner: applied and version bumped exactly once.
    expect(winner.body.data.version).toBe(sharedVersion + 1);

    // Loser: unified 409 envelope + authoritative current version for refresh.
    expect(loser.body.error.code).toBe('CONFLICT');
    expect(loser.body.error.message).toMatch(/modified by another request|conflict/i);
    expect(loser.body.error.details.expectedVersion).toBe(sharedVersion);
    expect(loser.body.error.details.currentVersion).toBe(sharedVersion + 1);
    expect(loser.body.error.details.task.version).toBe(sharedVersion + 1);

    // DB final state matches the winner's write; version bumped only once.
    const res = await request(app).get(`/api/tasks/${task.id}`).expect(200);
    expect(res.body.data.version).toBe(sharedVersion + 1);
    expect(res.body.data.title).toBe(winner.body.data.title);
  });

  test('N=5 simultaneous writers: exactly one wins', async () => {
    const task = await createTask({ title: 'stampede', status: 'TODO' });
    const v = task.version;

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        request(app)
          .put(`/api/tasks/${task.id}`)
          .send({ version: v, title: `writer-${i}` })
      )
    );

    const okCount = results.filter((r) => r.status === 200).length;
    const conflictCount = results.filter((r) => r.status === 409).length;
    expect(okCount).toBe(1);
    expect(conflictCount).toBe(4);

    const res = await request(app).get(`/api/tasks/${task.id}`).expect(200);
    expect(res.body.data.version).toBe(v + 1); // only the single winner bumped it
  });

  test('delete with stale version -> 409; with correct version -> 204', async () => {
    const task = await createTask({ title: 'deletable' });
    await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ version: task.version, title: 'bumped' })
      .expect(200);

    const conflict = await request(app)
      .delete(`/api/tasks/${task.id}?version=${task.version}`)
      .expect(409);
    expect(conflict.body.error.code).toBe('CONFLICT');

    await request(app).delete(`/api/tasks/${task.id}?version=${task.version + 1}`).expect(204);
    await request(app).get(`/api/tasks/${task.id}`).expect(404);
  });
});