/**
 * Task routes with optimistic locking.
 *
 *   GET    /api/tasks          list (page, pageSize, q)
 *   GET    /api/tasks/:id      get one (returns version)
 *   POST   /api/tasks          create (version starts at 1)
 *   PUT    /api/tasks/:id      update — REQUIRES body.version (expected)
 *                              atomic: UPDATE ... WHERE id=? AND version=?
 *                              0 rows changed -> 409 CONFLICT
 *   DELETE /api/tasks/:id      delete (requires body/If-Match version? no —
 *                              guarded by optional ?version= query)
 */
const express = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { ApiError } = require('../middleware/error');

const router = express.Router();

const idParams = z.object({ id: z.string().min(1).max(64) });

const createBody = z.object({
  title: z.string().min(1, 'title is required').max(300),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
});

const updateBody = z.object({
  // Optimistic-lock token — required. The client echoes the version it read.
  version: z.number().int().min(1, 'version (expected) is required'),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
});

const deleteQuery = z.object({
  version: z.coerce.number().int().min(1).optional(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().max(200).optional(),
});

function rowToDto(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function makeApp(deps) {
  const { db } = deps;
  const router = express.Router();

  // GET /api/tasks
  router.get('/', validate({ query: listQuery }), (req, res, next) => {
    try {
      const { page, pageSize, q } = req.query;
      const where = q ? 'WHERE title LIKE ? OR IFNULL(description, \'\') LIKE ?' : '';
      const args = q ? [`%${q}%`, `%${q}%`] : [];
      const total = db.prepare(`SELECT COUNT(*) AS n FROM tasks ${where}`).get(...args).n;
      const rows = db
        .prepare(
          `SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
        )
        .all(...args, pageSize, (page - 1) * pageSize);
      res.json({
        data: rows.map(rowToDto),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/tasks/:id
  router.get('/:id', validate({ params: idParams }), (req, res, next) => {
    try {
      const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
      if (!row) throw ApiError.notFound(`Task ${req.params.id} not found`);
      res.json({ data: rowToDto(row) });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/tasks
  router.post('/', validate({ body: createBody }), (req, res, next) => {
    try {
      const id = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      db.prepare(
        `INSERT INTO tasks (id, title, description, status, version) VALUES (?, ?, ?, ?, 1)`
      ).run(id, req.body.title, req.body.description ?? null, req.body.status);
      const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      res.status(201).json({ data: rowToDto(row) });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/tasks/:id — optimistic-lock update
  router.put('/:id', validate({ params: idParams, body: updateBody }), (req, res, next) => {
    try {
      const { version: expectedVersion, ...changes } = req.body;

      const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
      if (!current) throw ApiError.notFound(`Task ${req.params.id} not found`);

      // Atomic compare-and-swap: only succeeds if nobody changed the row
      // since the client read `expectedVersion`.
      const sets = [];
      const args = [];
      if (changes.title !== undefined) {
        sets.push('title = ?');
        args.push(changes.title);
      }
      if (changes.description !== undefined) {
        sets.push('description = ?');
        args.push(changes.description);
      }
      if (changes.status !== undefined) {
        sets.push('status = ?');
        args.push(changes.status);
      }
      if (sets.length === 0) throw ApiError.badRequest('No fields to update');

      sets.push('version = version + 1');
      sets.push(`updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`);

      const info = db
        .prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND version = ?`)
        .run(...args, req.params.id, expectedVersion);

      if (info.changes === 0) {
        // Someone else updated the row first (or the task vanished).
        const fresh = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
        if (!fresh) throw ApiError.notFound(`Task ${req.params.id} not found`);
        throw ApiError.conflict(
          'Version conflict: this task was modified by another request. Refresh to get the latest version.',
          {
            expectedVersion,
            currentVersion: fresh.version,
            task: rowToDto(fresh),
          }
        );
      }

      const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
      res.json({ data: rowToDto(updated) });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/tasks/:id (optional ?version= for guarded delete)
  router.delete('/:id', validate({ params: idParams, query: deleteQuery }), (req, res, next) => {
    try {
      const { version } = req.query;
      let info;
      if (version !== undefined) {
        info = db
          .prepare('DELETE FROM tasks WHERE id = ? AND version = ?')
          .run(req.params.id, version);
        if (info.changes === 0) {
          const fresh = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
          if (!fresh) throw ApiError.notFound(`Task ${req.params.id} not found`);
          throw ApiError.conflict(
            'Version conflict: this task was modified by another request.',
            { expectedVersion: version, currentVersion: fresh.version }
          );
        }
      } else {
        info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
        if (info.changes === 0) throw ApiError.notFound(`Task ${req.params.id} not found`);
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { makeApp };