/**
 * Supertest integration tests for the Project/Task CRUD API.
 *
 * Requires a reachable PostgreSQL (DATABASE_URL) with migrations applied.
 * Run via:  npm test            (local Postgres)
 *      or:  docker compose -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from api
 *
 * Covers: create, read, update, delete, pagination, search.
 */
const request = require('supertest');
const { createApp } = require('../src/app');
const prisma = require('../src/lib/prisma');

const app = createApp();

jest.setTimeout(30000);

beforeAll(async () => {
  // Clean slate for deterministic assertions
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('health & meta', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET unknown route returns unified 404 envelope', async () => {
    const res = await request(app).get('/nope').expect(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Projects: create', () => {
  test('POST /api/projects creates a project (201)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Alpha', description: 'first project' })
      .expect(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.name).toBe('Alpha');
    expect(res.body.data.description).toBe('first project');
  });

  test('POST /api/projects rejects missing name (400)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ description: 'no name' })
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.details).toBeDefined();
  });

  test('POST /api/projects rejects empty name (400)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: '' })
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('Projects: read', () => {
  let projectId;

  beforeAll(async () => {
    const p = await prisma.project.create({ data: { name: 'Beta', description: 'second' } });
    projectId = p.id;
  });

  test('GET /api/projects/:id returns the project', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`).expect(200);
    expect(res.body.data.id).toBe(projectId);
    expect(res.body.data.name).toBe('Beta');
  });

  test('GET /api/projects/:id with unknown id -> 404 envelope', async () => {
    const res = await request(app)
      .get('/api/projects/00000000-0000-4000-8000-000000000000')
      .expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('GET /api/projects/:id with invalid uuid -> 400', async () => {
    const res = await request(app).get('/api/projects/not-a-uuid').expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

describe('Projects: update', () => {
  test('PUT /api/projects/:id updates fields', async () => {
    const created = await request(app)
      .post('/api/projects')
      .send({ name: 'Gamma' })
      .expect(201);
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/projects/${id}`)
      .send({ name: 'Gamma Renamed', description: 'updated!' })
      .expect(200);
    expect(res.body.data.name).toBe('Gamma Renamed');
    expect(res.body.data.description).toBe('updated!');
  });

  test('PUT /api/projects/:id on unknown id -> 404', async () => {
    await request(app)
      .put('/api/projects/00000000-0000-4000-8000-000000000000')
      .send({ name: 'x' })
      .expect(404);
  });
});

describe('Projects: delete', () => {
  test('DELETE /api/projects/:id removes it (204 then 404)', async () => {
    const created = await request(app)
      .post('/api/projects')
      .send({ name: 'To Delete' })
      .expect(201);
    const id = created.body.data.id;

    await request(app).delete(`/api/projects/${id}`).expect(204);
    await request(app).get(`/api/projects/${id}`).expect(404);
  });
});

describe('Projects: pagination & search', () => {
  beforeAll(async () => {
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    // 25 projects for pagination, 5 of them contain "needle"
    for (let i = 1; i <= 25; i++) {
      const name = i <= 5 ? `needle-project-${i}` : `bulk-project-${i}`;
      await prisma.project.create({ data: { name, description: `desc ${i}` } });
    }
  });

  test('default pagination returns first page with meta', async () => {
    const res = await request(app).get('/api/projects').expect(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
  });

  test('page=2 pageSize=10 returns projects 11-20', async () => {
    const res = await request(app).get('/api/projects?page=2&pageSize=10').expect(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.total).toBe(25);
    expect(res.body.pagination.totalPages).toBe(3);
  });

  test('last page returns remainder (5 items)', async () => {
    const res = await request(app).get('/api/projects?page=3&pageSize=10').expect(200);
    expect(res.body.data).toHaveLength(5);
  });

  test('pageSize > 100 rejected (400)', async () => {
    await request(app).get('/api/projects?pageSize=1000').expect(400);
  });

  test('page=0 rejected (400)', async () => {
    await request(app).get('/api/projects?page=0').expect(400);
  });

  test('search q=needle matches only needle projects', async () => {
    const res = await request(app).get('/api/projects?q=needle').expect(200);
    expect(res.body.pagination.total).toBe(5);
    res.body.data.forEach((p) => expect(p.name).toContain('needle'));
  });

  test('search is case-insensitive', async () => {
    const res = await request(app).get('/api/projects?q=NEEDLE').expect(200);
    expect(res.body.pagination.total).toBe(5);
  });

  test('search with no match returns empty list', async () => {
    const res = await request(app).get('/api/projects?q=zzzz-nothing').expect(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });
});

describe('Tasks: full CRUD, pagination, search', () => {
  let projectId;

  beforeAll(async () => {
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    const p = await prisma.project.create({ data: { name: 'Task Host' } });
    projectId = p.id;
    // 15 tasks, first 4 contain "needle"
    for (let i = 1; i <= 15; i++) {
      const title = i <= 4 ? `needle-task-${i}` : `bulk-task-${i}`;
      await prisma.task.create({
        data: { title, projectId, status: i % 2 === 0 ? 'DONE' : 'TODO' },
      });
    }
  });

  test('POST /api/tasks creates a task (201)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Fresh task', projectId, priority: 'HIGH' })
      .expect(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.title).toBe('Fresh task');
    expect(res.body.data.status).toBe('TODO'); // default
    expect(res.body.data.project.id).toBe(projectId);
  });

  test('POST /api/tasks rejects missing title (400)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ projectId })
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  test('POST /api/tasks rejects invalid status enum (400)', async () => {
    await request(app)
      .post('/api/tasks')
      .send({ title: 'x', projectId, status: 'BOGUS' })
      .expect(400);
  });

  test('POST /api/tasks rejects unknown projectId (400)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'x', projectId: '00000000-0000-4000-8000-000000000000' })
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  test('GET /api/tasks/:id returns task with project', async () => {
    const list = await request(app).get('/api/tasks?pageSize=1').expect(200);
    const id = list.body.data[0].id;
    const res = await request(app).get(`/api/tasks/${id}`).expect(200);
    expect(res.body.data.project.name).toBe('Task Host');
  });

  test('PUT /api/tasks/:id updates title and status', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Before', projectId })
      .expect(201);
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ title: 'After', status: 'IN_PROGRESS' })
      .expect(200);
    expect(res.body.data.title).toBe('After');
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  test('PUT /api/tasks/:id unknown id -> 404', async () => {
    await request(app)
      .put('/api/tasks/00000000-0000-4000-8000-000000000000')
      .send({ title: 'x' })
      .expect(404);
  });

  test('DELETE /api/tasks/:id removes it (204 then 404)', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Doomed', projectId })
      .expect(201);
    const id = created.body.data.id;

    await request(app).delete(`/api/tasks/${id}`).expect(204);
    await request(app).get(`/api/tasks/${id}`).expect(404);
  });

  test('pagination: default page returns 10 of total', async () => {
    const res = await request(app).get('/api/tasks').expect(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(15);
    expect(res.body.pagination.page).toBe(1);
  });

  test('pagination: page=2 returns next slice without overlap', async () => {
    const p1 = await request(app).get('/api/tasks?page=1&pageSize=5').expect(200);
    const p2 = await request(app).get('/api/tasks?page=2&pageSize=5').expect(200);
    expect(p1.body.data).toHaveLength(5);
    expect(p2.body.data).toHaveLength(5);
    const ids1 = p1.body.data.map((t) => t.id);
    const ids2 = p2.body.data.map((t) => t.id);
    expect(ids1.some((id) => ids2.includes(id))).toBe(false);
  });

  test('search q=needle matches only needle tasks', async () => {
    const res = await request(app).get('/api/tasks?q=needle&pageSize=100').expect(200);
    expect(res.body.pagination.total).toBe(4);
    res.body.data.forEach((t) => expect(t.title).toContain('needle'));
  });

  test('filter by status works with pagination', async () => {
    const res = await request(app).get('/api/tasks?status=DONE&pageSize=100').expect(200);
    res.body.data.forEach((t) => expect(t.status).toBe('DONE'));
    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  test('filter by projectId works', async () => {
    const res = await request(app)
      .get(`/api/tasks?projectId=${projectId}&pageSize=100`)
      .expect(200);
    res.body.data.forEach((t) => expect(t.project.id).toBe(projectId));
  });
});