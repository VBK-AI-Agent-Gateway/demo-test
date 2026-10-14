/**
 * Shared Redis connections for BullMQ.
 * BullMQ requires two ioredis instances per connection role:
 * one for blocking commands (Worker) and one for normal commands.
 */
const { Redis } = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// maxRetriesPerRequest: null is required by BullMQ workers.
function createConnection(blocking = false) {
  const conn = new Redis(REDIS_URL, {
    maxRetriesPerRequest: blocking ? null : 20,
    enableReadyCheck: false,
    lazyConnect: false,
    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
  });
  conn.on('error', (err) => {
    // Don't crash the process on transient Redis errors; just log.
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[redis:${blocking ? 'block' : 'cmd'}]`, err.message);
    }
  });
  return conn;
}

module.exports = { REDIS_URL, createConnection };