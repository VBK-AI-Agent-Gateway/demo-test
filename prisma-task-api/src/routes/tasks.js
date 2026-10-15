/**
 * Task routes: CRUD + pagination + search + filters.
 *   GET    /api/tasks               list (page, pageSize, q, status, priority, projectId)
 *   GET    /api/tasks/:id           get one
 *   POST   /api/tasks               create
 *   PUT    /api/tasks/:id           update
 *   DELETE /api/tasks/:id           delete
 */
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { validate } = require('../middleware/validate');
const { ApiError } = require('../middleware/error');

const router = express.Router();

const idParams = z.object({ id: z.string().uuid() });

const createBody = z.object({
  title: z.string().min(1, 'title is required').max(300),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z.coerce.date().optional().nullable(),
  projectId: z.string().uuid('projectId must be a UUID'),
});

const updateBody = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  projectId: z.string().uuid().optional(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().max(200).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  projectId: z.string().uuid().optional(),
});

// GET /api/tasks
router.get('/', validate({ query: listQuery }), async (req, res, next) => {
  try {
    const { page, pageSize, q, status, priority, projectId } = req.query;
    const and = [];
    if (q) {
      and.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    if (status) and.push({ status });
    if (priority) and.push({ priority });
    if (projectId) and.push({ projectId });
    const where = and.length ? { AND: and } : {};

    const [total, items] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { project: { select: { id: true, name: true } } },
      }),
    ]);
    res.json({
      data: items,
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
router.get('/:id', validate({ params: idParams }), async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!task) throw ApiError.notFound('Task', req.params.id);
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post('/', validate({ body: createBody }), async (req, res, next) => {
  try {
    const task = await prisma.task.create({
      data: req.body,
      include: { project: { select: { id: true, name: true } } },
    });
    res.status(201).json({ data: task });
  } catch (err) {
    if (err.code === 'P2003') {
      return next(ApiError.badRequest('projectId does not reference an existing project'));
    }
    next(err);
  }
});

// PUT /api/tasks/:id
router.put('/:id', validate({ params: idParams, body: updateBody }), async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      throw ApiError.badRequest('No fields to update');
    }
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
      include: { project: { select: { id: true, name: true } } },
    });
    res.json({ data: task });
  } catch (err) {
    if (err.code === 'P2025') return next(ApiError.notFound('Task', req.params.id));
    if (err.code === 'P2003') return next(ApiError.badRequest('projectId does not reference an existing project'));
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', validate({ params: idParams }), async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return next(ApiError.notFound('Task', req.params.id));
    next(err);
  }
});

module.exports = router;