/**
 * Integration tests for the notification queue.
 *
 * Requires a reachable Redis (REDIS_URL, default redis://localhost:6379)
 * but does NOT require the API server — tests drive BullMQ directly and
 * also exercise the Express endpoints via supertest.
 *
 * Acceptance coverage:
 *   1. normal consumption   -> job completes, delivery recorded
 *   2. failed retry          -> transient failures retried, eventually succeeds
 *   3. dead letter           -> permanent failure exhausts attempts -> DLQ
 */
const request = require('supertest');
const { createApp } = require('../src/app');
const {
  createNotificationQueue,
  createDlq,
  createQueueEvents,
  QUEUE_NAME,
  DLQ_NAME,
  MAX_ATTEMPTS,
} = require('../src/queues');
const { createNotificationWorker, deliveryLog } = require('../src/worker');

jest.setTimeout(60000);

let app;
let queue;
let dlq;
let worker;
let queueEvents;

function waitForCompletion(events, jobId, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for job ${jobId}`)), timeoutMs);
    const onCompleted = ({ jobId: id }) => {
      if (id === jobId) {
        cleanup();
        resolve('completed');
      }
    };
    const onFailed = ({ jobId: id }) => {
      if (id === jobId) {
        // keep listening; final failure state is checked by callers
      }
    };
    function cleanup() {
      clearTimeout(timer);
      events.off('completed', onCompleted);
      events.off('failed', onFailed);
    }
    events.on('completed', onCompleted);
    events.on('failed', onFailed);
  });
}

async function waitForFailedFinal(jobId, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await queue.getJob(jobId);
    if (job) {
      const state = await job.getState();
      if (state === 'failed' && job.attemptsMade >= (job.opts.attempts || MAX_ATTEMPTS)) {
        return job;
      }
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`timeout waiting for job ${jobId} to fail permanently`);
}

beforeAll(async () => {
  queue = createNotificationQueue();
  dlq = createDlq();
  queueEvents = createQueueEvents();
  app = createApp({ queue, dlq });

  // clean slate
  await queue.obliterate({ force: true });
  await dlq.obliterate({ force: true });
  deliveryLog.length = 0;

  worker = createNotificationWorker(QUEUE_NAME);
  await worker.waitUntilReady();
  await queueEvents.waitUntilReady();
});

afterAll(async () => {
  if (worker) await worker.close();
  if (queueEvents) await queueEvents.close();
  if (queue) await queue.close();
  if (dlq) await dlq.close();
});

describe('acceptance 1: normal consumption', () => {
  test('email notification is consumed and delivered', async () => {
    const before = deliveryLog.length;
    const job = await queue.add('notify', {
      channel: 'email',
      to: 'alice@example.com',
      subject: 'Welcome',
      body: 'Hello Alice',
    });

    await waitForCompletion(queueEvents, job.id, 20000);

    const stored = await queue.getJob(job.id);
    expect(await stored.getState()).toBe('completed');
    expect(stored.attemptsMade).toBe(0); // succeeded first try — no failures

    // delivery recorded
    expect(deliveryLog.length).toBeGreaterThan(before);
    const last = deliveryLog[deliveryLog.length - 1];
    expect(last.to).toBe('alice@example.com');
    expect(last.kind).toBe('email');
  });

  test('in-app notification is consumed', async () => {
    const job = await queue.add('notify', {
      channel: 'inapp',
      to: 'user-42',
      subject: 'You have a new message',
    });
    await waitForCompletion(queueEvents, job.id, 20000);
    const stored = await queue.getJob(job.id);
    expect(await stored.getState()).toBe('completed');
  });

  test('API endpoint enqueues a job (201) and reports job status', async () => {
    const created = await request(app)
      .post('/api/notifications')
      .send({ channel: 'email', to: 'bob@example.com', subject: 'Hi Bob' })
      .expect(201);
    expect(created.body.data.id).toBeDefined();
    expect(created.body.data.attempts).toBe(MAX_ATTEMPTS);

    await waitForCompletion(queueEvents, created.body.data.id, 20000);

    const status = await request(app)
      .get(`/api/notifications/${created.body.data.id}`)
      .expect(200);
    expect(status.body.data.state).toBe('completed');
    expect(status.body.data.deadLettered).toBe(false);
  });

  test('API rejects invalid payload with unified 400 envelope', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .send({ channel: 'sms', to: '' })
      .expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.details).toBeDefined();
  });
});

describe('acceptance 2: failure retries', () => {
  test('transient failure is retried and eventually succeeds', async () => {
    const before = deliveryLog.length;
    // Fail the first MAX_ATTEMPTS-1 attempts, then succeed.
    const job = await queue.add('notify', {
      channel: 'email',
      to: 'carol@example.com',
      subject: 'Flaky provider',
      failTimes: MAX_ATTEMPTS - 1, // 2 failures, 3rd attempt succeeds
    });

    await waitForCompletion(queueEvents, job.id, 30000);

    const stored = await queue.getJob(job.id);
    expect(await stored.getState()).toBe('completed');
    expect(stored.attemptsMade).toBeGreaterThanOrEqual(MAX_ATTEMPTS - 1);

    const last = deliveryLog[deliveryLog.length - 1];
    expect(deliveryLog.length).toBeGreaterThan(before);
    expect(last.to).toBe('carol@example.com');
    expect(last.attempts).toBeGreaterThanOrEqual(MAX_ATTEMPTS); // succeeded on a later attempt
  });

  test('job opts carry exponential backoff and max attempts', async () => {
    const job = await queue.add('notify', {
      channel: 'email',
      to: 'dave@example.com',
      subject: 'opts check',
    });
    expect(job.opts.attempts).toBe(MAX_ATTEMPTS);
    expect(job.opts.backoff).toEqual({ type: 'exponential', delay: 500 });
    await waitForCompletion(queueEvents, job.id, 20000);
  });

  test('API job status shows attemptsMade after retries', async () => {
    const created = await request(app)
      .post('/api/notifications')
      .send({ channel: 'inapp', to: 'erin', subject: 'retry me', failTimes: 1 })
      .expect(201);
    await waitForCompletion(queueEvents, created.body.data.id, 30000);
    const status = await request(app)
      .get(`/api/notifications/${created.body.data.id}`)
      .expect(200);
    expect(status.body.data.state).toBe('completed');
    expect(status.body.data.attemptsMade).toBeGreaterThanOrEqual(1);
  });
});

describe('acceptance 3: dead letter queue', () => {
  test('permanently failing job exhausts attempts and is marked failed', async () => {
    const job = await queue.add('notify', {
      channel: 'email',
      to: 'mallory@example.com',
      subject: 'Never succeeds',
      alwaysFail: true,
    });

    const failed = await waitForFailedFinal(job.id, 40000);
    expect(failed.attemptsMade).toBeGreaterThanOrEqual(MAX_ATTEMPTS);
    expect(await failed.getState()).toBe('failed');
    expect(failed.failedReason).toMatch(/Simulated permanent failure/);
  });

  test('exhausted job appears in dead-letter listing via API', async () => {
    const res = await request(app).get('/api/dead-letters').expect(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    const item = res.body.data.items.find(
      (i) => i.payload && i.payload.to === 'mallory@example.com'
    );
    expect(item).toBeDefined();
    expect(item.attemptsMade).toBeGreaterThanOrEqual(MAX_ATTEMPTS);
    expect(item.error).toMatch(/Simulated permanent failure/);
  });

  test('exhausted job is copied into the dedicated DLQ queue', async () => {
    // wait briefly for the worker's failed handler to publish into DLQ
    const start = Date.now();
    let dlqJobs = [];
    while (Date.now() - start < 15000) {
      dlqJobs = await dlq.getJobs(['waiting', 'completed', 'failed']);
      if (dlqJobs.length > 0) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    expect(dlqJobs.length).toBeGreaterThan(0);
    const entry = dlqJobs.find((j) => j.data.payload && j.data.payload.to === 'mallory@example.com');
    expect(entry).toBeDefined();
    expect(entry.data.attemptsMade).toBeGreaterThanOrEqual(MAX_ATTEMPTS);
    expect(entry.data.error).toMatch(/Simulated permanent failure/);
  });

  test('API can retry a dead-lettered job and it completes after fault clears', async () => {
    const list = await request(app).get('/api/dead-letters').expect(200);
    const item = list.body.data.items.find(
      (i) => i.payload && i.payload.to === 'mallory@example.com'
    );
    expect(item).toBeDefined();

    const retry = await request(app)
      .post(`/api/dead-letters/${item.id}/retry`)
      .expect(201);
    expect(retry.body.data.id).toBeDefined();

    // retry clears alwaysFail so it should complete
    await waitForCompletion(queueEvents, retry.body.data.id, 30000);
    const status = await request(app)
      .get(`/api/notifications/${retry.body.data.id}`)
      .expect(200);
    expect(status.body.data.state).toBe('completed');
  });

  test('API job status marks deadLettered=true for exhausted job', async () => {
    const list = await queue.getFailed();
    expect(list.length).toBeGreaterThan(0);
    const job = list.find((j) => j.data && j.data.alwaysFail);
    expect(job).toBeDefined();
    const res = await request(app).get(`/api/notifications/${job.id}`).expect(200);
    expect(res.body.data.state).toBe('failed');
    expect(res.body.data.deadLettered).toBe(true);
  });
});

describe('queue stats', () => {
  test('GET /api/notifications returns counts', async () => {
    const res = await request(app).get('/api/notifications').expect(200);
    expect(res.body.data.queue).toBe(QUEUE_NAME);
    expect(res.body.data.maxAttempts).toBe(MAX_ATTEMPTS);
    expect(typeof res.body.data.counts.completed).toBe('number');
    expect(typeof res.body.data.counts.failed).toBe('number');
  });
});