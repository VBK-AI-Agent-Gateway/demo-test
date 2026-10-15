/** Jest config for Supertest integration tests */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // Prisma client may still hold open connections; force exit after run.
  forceExit: true,
  // Integration tests must run serially (shared database).
  maxWorkers: 1,
  testTimeout: 30000,
  verbose: true,
};