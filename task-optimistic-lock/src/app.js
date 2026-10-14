/**
 * Express app factory — testable (no listen), wires db + routes + static UI.
 * deps: { db }  (better-sqlite3 Database)
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const { makeApp: makeTasksRouter } = require('./routes/tasks');
const { seed } = require('./db');

function createApp(deps) {
  const { db, serveStatic = false, seedOnBoot = false } = deps;
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', db: 'sqlite', optimisticLocking: 'version' });
  });

  app.get('/api', (req, res) => {
    res.json({
      name: 'task-optimistic-lock',
      version: '1.0.0',
      locking: {
        strategy: 'optimistic',
        field: 'version',
        conflictStatus: 409,
        hint: 'PUT /api/tasks/:id requires body.version; mismatch returns 409 CONFLICT with current server state.',
      },
      endpoints: {
        list: 'GET /api/tasks',
        get: 'GET /api/tasks/:id',
        create: 'POST /api/tasks',
        update: 'PUT /api/tasks/:id  (requires version)',
        delete: 'DELETE /api/tasks/:id?version=N',
        health: 'GET /health',
      },
    });
  });

  app.use('/api/tasks', makeTasksRouter({ db }));

  if (seedOnBoot) seed(db);

  if (serveStatic) {
    app.use(express.static(path.join(__dirname, '..', 'public')));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.locals.db = db;
  return app;
}

module.exports = { createApp };