/**
 * Notification worker.
 *
 * Consumes the `notifications` queue and "delivers" the notification:
 *   - channel=email  -> simulated email send
 *   - channel=inapp  -> simulated in-app message store
 *
 * Failure simulation / real failure:
 *   - job.data.failTimes > 0  => fail the first N attempts, then succeed
 *     (used by tests to prove automatic retry works)
 *   - job.data.alwaysFail     => always fail (used to prove DLQ routing)
 *
 * On final failure (attempts exhausted) the job is re-published into the
 * dead-letter queue `notifications-dlq` so it can be listed/retried.
 */
const { Worker } = require('bullmq');
const { createConnection } = require('./redis');
const {
  QUEUE_NAME,
  DLQ_NAME,
  MAX_ATTEMPTS,
  createNotificationQueue,
  createDlq,
} = require('./queues');

// In-memory delivery log (dev/demo). Real impl would hit an SMTP provider.
const deliveryLog = [];

async function deliver(job) {
  const { channel, to, subject, body, failTimes, alwaysFail } = job.data || {};

  if (!channel || !to) {
    throw new Error('Invalid payload: channel and to are required');
  }

  // Failure simulation: fail the first `failTimes` attempts of this job.
  const attemptNo = job.attemptsMade + 1; // attemptsMade increments after each failure
  if (alwaysFail) {
    throw new Error(`Simulated permanent failure for ${channel} -> ${to}`);
  }
  if (typeof failTimes === 'number' && attemptNo <= failTimes) {
    throw new Error(`Simulated transient failure (attempt ${attemptNo}/${failTimes})`);
  }

  // "Deliver"
  const record = {
    jobId: job.id,
    channel,
    to,
    subject: subject || '(no subject)',
    body: body || '',
    deliveredAt: new Date().toISOString(),
    attempts: attemptNo,
  };
  if (channel === 'email') {
    // pretend to call an email provider
    deliveryLog.push({ ...record, kind: 'email' });
    console.log(`[email] to=${to} subject="${record.subject}" attempts=${attemptNo}`);
  } else if (channel === 'inapp') {
    deliveryLog.push({ ...record, kind: 'inapp' });
    console.log(`[inapp] to=${to} subject="${record.subject}" attempts=${attemptNo}`);
  } else {
    throw new Error(`Unknown channel: ${channel}`);
  }
  return record;
}

function createNotificationWorker(queueName = QUEUE_NAME) {
  const worker = new Worker(queueName, deliver, {
    connection: createConnection(true),
    // attempts/backoff come from job options set at add-time,
    // but we also set defaults here for programmatic safety:
    settings: {
      backoffStrategy: (attemptsMade) => Math.min(500 * 2 ** (attemptsMade - 1), 30000),
    },
  });

  worker.on('completed', (job) => {
    console.log(`[worker] job ${job.id} completed on attempt ${job.attemptsMade}`);
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || MAX_ATTEMPTS;
    console.log(
      `[worker] job ${job.id} failed attempt ${attemptsMade}/${maxAttempts}: ${err.message}`
    );
    if (attemptsMade >= maxAttempts) {
      // Route to dead-letter queue for inspection / manual retry.
      try {
        const dlq = createDlq();
        await dlq.add('dead-letter', {
          originalQueue: queueName,
          originalJobId: job.id,
          payload: job.data,
          error: err.message,
          failedAt: new Date().toISOString(),
          attemptsMade,
        });
        await dlq.close();
        console.log(`[worker] job ${job.id} moved to DLQ (${DLQ_NAME})`);
      } catch (dlqErr) {
        console.error('[worker] failed to enqueue dead letter:', dlqErr.message);
      }
    }
  });

  return worker;
}

async function startWorker() {
  const queueName = QUEUE_NAME;
  const worker = createNotificationWorker(queueName);
  console.log(`[worker] listening on queue "${queueName}" (max ${MAX_ATTEMPTS} attempts)`);

  // Keep a queue reference only for graceful shutdown bookkeeping.
  const shutdown = async () => {
    console.log('[worker] shutting down...');
    await worker.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return worker;
}

module.exports = { deliver, deliveryLog, createNotificationWorker, startWorker };

// Run standalone: `node src/worker.js`
if (require.main === module) {
  startWorker().catch((err) => {
    console.error('[worker] fatal:', err);
    process.exit(1);
  });
}