/**
 * Unified error handling: ApiError class, notFound handler and error middleware.
 * Error envelope: { error: { code, message, details? } }
 */

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static validationError(message, details) {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }

  static notFound(resource, id) {
    return new ApiError(404, 'NOT_FOUND', `${resource} ${id} not found`);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}

// 404 for unknown routes
function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}

// Central error middleware (must be registered last, with 4 args)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Prisma known request errors
  if (err && err.code && err.name && err.name.startsWith('PrismaClient')) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: err.meta?.cause || 'Resource not found' },
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Foreign key constraint failed', details: err.meta },
      });
    }
    console.error('[prisma-error]', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Database error' },
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }

  // JSON parse errors from express.json
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Malformed JSON body' },
    });
  }

  console.error('[unhandled-error]', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
}

module.exports = { ApiError, notFoundHandler, errorHandler };