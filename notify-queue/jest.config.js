/** Jest config for queue integration tests (require a reachable Redis). */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // Redis connections may stay open; force exit after the run.
  forceExit: true,
  // Queue tests share a Redis instance — run serially.
  maxWorkers: 1,
  testTimeout: 60000,
  verbose: true,
};