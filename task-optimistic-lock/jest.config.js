/** Jest config — SQLite in-process DB, tests run serially against temp files. */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  forceExit: true,
  maxWorkers: 1,
  testTimeout: 30000,
  verbose: true,
};