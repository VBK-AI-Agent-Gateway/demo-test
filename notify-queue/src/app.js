/**
 * Express app factory — management API for the notification queue.
 *
 * Endpoints:
 *   GET  /health                              liveness
 *   GET  /api                                 endpoint index
 *   POST /api/notifications                   enqueue a notification
 *   GET  /api/notifications                   queue stats (waiting/active/failed/completed)
 *   GET  /api/notifications/:id               job status
 *   GET  /api/dead-letters                    list dead-lettered jobs
 *   POST /api/dead-letters/:id/retry          re-enqueue a dead-lettered job
 *   GET  /api/deliveries                      in-memory delivery log (demo)
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { z } = require('zod');
const { notFoundHandler, errorHandler, ApiError } = require('./middleware/error');
const { createNotificationQueue, createDlq, QUEUE_NAME, DLQ_NAME, MAX_ATTEMPTS } = require('./queues');
const { deliveryLog } = require('./worker');

const notifySchema = z.object({
  channel: z.enum(['email', 'inapp']),
  to: z.string().min(1).max(320),
  subject: z.string().max(300).optional(),
  body: z.string().max(10000).optional(),
  // test hooks (ignored in production usage)
  failTimes: z.number().int().min(0).max(50).optional(),
  alwaysFail: z.boolean().optional(),
});

function createApp(overrides = {}) {
  const app = express();
  const queue = overrides.queue || createNotificationQueue();
  const dlq = overrides.dlq || createDlq();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', queue: QUEUE_NAME, dlq: DLQ_NAME, maxAttempts: MAX_ATTEMPTS });
  });

  app.get('/api', (req, res) => {
    res.json({
      name: 'notify-queue',
      version: '1.0.0',
      endpoints: {
        enqueue: 'POST /api/notifications',
        stats: 'GET /api/notifications',
        job: 'GET /api/notifications/:id',
        deadLetters: 'GET /api/dead-letters',
        retryDeadLetter: 'POST /api/dead-letters/:id/retry',
        deliveries: 'GET /api/deliveries',
        health: 'GET /health',
      },
    });
  });

  // Enqueue
  app.post('/api/notifications', async (req, res, next) => {
    try {
      const parsed = notifySchema.safeParse(req.body);
      if (!parsed.success) {
        throw ApiError.badRequest('Validation failed', parsed.error.flatten());
      }
      const job = await queue.add('notify', parsed.data);
      res.status(201).json({
        data: {
          id: job.id,
          state: await job.getState(),
          attempts: job.opts.attempts,
          queue: QUEUE_NAME,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // Queue stats
  app.get('/api/notifications', async (req, res, next) => {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);
      res.json({
        data: {
          queue: QUEUE_NAME,
          maxAttempts: MAX_ATTEMPTS,
          counts: { waiting, active, delayed, completed, failed },
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // Job status
  app.get('/api/notifications/:id', async (req, res, next) => {
    try {
      const job = await queue.getJob(req.params.id);
      if (!job) throw ApiError.notFound(`Job ${req.params.id} not found`);
      const state = await job.getState();
      const reason = job.failedReason || null;
      res.json({
        data: {
          id: job.id,
          state,
          attemptsMade: job.attemptsMade,
          maxAttempts: job.opts.attempts,
          data: job.data,
          reason,
          deadLettered: state === 'failed' && job.attemptsMade >= (job.opts.attempts || MAX_ATTEMPTS),
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // List dead letters
  app.get('/api/dead-letters', async (req, res, next) => {
    try {
      const jobs = await dlq.getJobs(['waiting', 'completed', 'failed']);
      const items = jobs.map((j) => ({
        id: j.id,
        originalQueue: j.data.originalQueue,
        originalJobId: j.data.originalJobId,
        payload: j.data.payload,
        error: j.data.error,
        failedAt: j.data.failedAt,
        attemptsMade: j.data.attemptsMade,
      }));
      // Also include jobs that exhausted attempts on the main queue but
      // have not (yet) been copied into the DLQ — belt and suspenders.
      const failedOnMain = await queue.getFailed();
      const fromMain = failedOnMain
        .filter((j) => j.attemptsMade >= (j.opts.attempts || MAX_ATTEMPTS))
        .map((j) => ({
          id: `main:${j.id}`,
          originalQueue: QUEUE_NAME,
          originalJobId: j.id,
          payload: j.data,
          error: j.failedReason,
          failedAt: j.finishedOn ? new Date(j.finishedOn * 1000).toISOString() : null,
          attemptsMade: j.attemptsMade,
        }));
      res.json({ data: { dlq: DLQ_NAME, items: [...items, ...fromMain] } });
    } catch (err) {
      next(err);
    }
  });

  // Retry a dead-lettered job (re-enqueue fresh copy on main queue)
  app.post('/api/dead-letters/:id/retry', async (req, res, next) => {
    try {
      let payload = null;
      if (req.params.id.startsWith('main:')) {
        const originalId = req.params.id.slice(5);
        const original = await queue.getJob(originalId);
        if (!original) throw ApiError.notFound(`Dead-lettered job ${req.params.id} not found`);
        payload = { ...original.data };
        delete payload.alwaysFail; // give the retry a chance
        delete payload.failTimes;
      } else {
        const dlqJob = await dlq.getJob(req.params.id);
        if (!dlqJob) throw ApiError.notFound(`Dead-lettered job ${req.params.id} not found`);
        payload = { ...dlqJob.data.payload };
        delete payload.alwaysFail;
        delete payload.failTimes;
      }
      const job = await queue.add('notify-retry', payload);
      res.status(201).json({ data: { id: job.id, state: await job.getState(), queue: QUEUE_NAME } });
    } catch (err) {
      next(err);
    }
  });

  // In-memory delivery log (demo inspection)
  app.get('/api/deliveries', (req, res) => {
    res.json({ data: deliveryLog });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  // Allow tests to close the shared connections
  app.locals.queue = queue;
  app.locals.dlq = dlq;

  return app;
}

module.exports = { createApp };