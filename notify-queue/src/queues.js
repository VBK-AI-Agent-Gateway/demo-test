/**
 * Queue factory: notification queue with automatic retries, max attempts
 * and a dead-letter queue.
 *
 * Retry policy:
 *   - attempts: MAX_ATTEMPTS (default 3)
 *   - backoff:  exponential, 500ms base (500ms, 1000ms, 2000ms, ...)
 *
 * Dead-letter strategy (both belts & suspenders):
 *   1. BullMQ built-in: when attempts are exhausted the job moves to the
 *      `failed` set of the main queue (inspectable via getFailed()).
 *   2. Worker's `failed` event re-publishes the job into a dedicated
 *      `notifications-dlq` queue so it can be inspected/retried via API.
 */
const { Queue, QueueEvents } = require('bullmq');
const { createConnection } = require('./redis');

const QUEUE_NAME = process.env.QUEUE_NAME || 'notifications';
const DLQ_NAME = process.env.DLQ_NAME || 'notifications-dlq';
const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS || 3);

const defaultJobOptions = {
  attempts: MAX_ATTEMPTS,
  backoff: {
    type: 'exponential',
    delay: 500,
  },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: false, // keep failed jobs for dead-letter inspection
};

function createNotificationQueue(name = QUEUE_NAME) {
  return new Queue(name, {
    connection: createConnection(false),
    defaultJobOptions,
  });
}

function createDlq(name = DLQ_NAME) {
  return new Queue(name, {
    connection: createConnection(false),
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false,
    },
  });
}

function createQueueEvents(name = QUEUE_NAME) {
  return new QueueEvents(name, {
    connection: createConnection(true),
  });
}

module.exports = {
  QUEUE_NAME,
  DLQ_NAME,
  MAX_ATTEMPTS,
  defaultJobOptions,
  createNotificationQueue,
  createDlq,
  createQueueEvents,
};