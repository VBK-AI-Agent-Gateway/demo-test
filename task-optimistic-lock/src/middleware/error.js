/**
 * Unified error handling with an explicit 409 CONFLICT for optimistic-lock
 * version mismatches. Envelope: { error: { code, message, details? } }
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

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  /**
   * Optimistic-lock conflict: the row's current version differs from the
   * client's expected version (someone else updated it concurrently).
   * details carries the authoritative server state so the client can
   * offer a "refresh" action.
   */
  static conflict(message, details) {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }
  if (err && err.type === 'entity.parse.failed') {
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