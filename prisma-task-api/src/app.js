/**
 * Express app factory — builds the app without listening,
 * so Supertest can drive it directly in integration tests.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health / meta
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });
  app.get('/api', (req, res) => {
    res.json({
      name: 'prisma-task-api',
      version: '1.0.0',
      endpoints: {
        projects: '/api/projects',
        tasks: '/api/tasks',
        health: '/health',
      },
    });
  });

  app.use('/api/projects', projectsRouter);
  app.use('/api/tasks', tasksRouter);

  // 404 + unified error envelope
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };