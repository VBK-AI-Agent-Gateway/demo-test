/**
 * Project routes: CRUD + pagination + search.
 *   GET    /api/projects          list (page, pageSize, q)
 *   GET    /api/projects/:id      get one (includes tasks)
 *   POST   /api/projects          create
 *   PUT    /api/projects/:id      update
 *   DELETE /api/projects/:id      delete
 */
const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { validate } = require('../middleware/validate');
const { ApiError } = require('../middleware/error');

const router = express.Router();

const idParams = z.object({ id: z.string().uuid() });

const createBody = z.object({
  name: z.string().min(1, 'name is required').max(200),
  description: z.string().max(2000).optional().nullable(),
});

const updateBody = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().max(200).optional(),
});

// GET /api/projects
router.get('/', validate({ query: listQuery }), async (req, res, next) => {
  try {
    const { page, pageSize, q } = req.query;
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { tasks: true } } },
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

// GET /api/projects/:id
router.get('/:id', validate({ params: idParams }), async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { tasks: { orderBy: { createdAt: 'desc' } } },
    });
    if (!project) throw ApiError.notFound('Project', req.params.id);
    res.json({ data: project });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects
router.post('/', validate({ body: createBody }), async (req, res, next) => {
  try {
    const project = await prisma.project.create({ data: req.body });
    res.status(201).json({ data: project });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id
router.put('/:id', validate({ params: idParams, body: updateBody }), async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      throw ApiError.badRequest('No fields to update');
    }
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ data: project });
  } catch (err) {
    if (err.code === 'P2025') return next(ApiError.notFound('Project', req.params.id));
    next(err);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', validate({ params: idParams }), async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return next(ApiError.notFound('Project', req.params.id));
    next(err);
  }
});

module.exports = router;