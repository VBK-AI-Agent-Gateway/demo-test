/**
 * Validation middleware: parses req.body / req.query / req.params with zod.
 * On failure -> next(ApiError(400)).
 */
const { ApiError } = require('./error');

function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        const parsed = body.safeParse(req.body);
        if (!parsed.success) {
          return next(ApiError.badRequest('Validation failed', parsed.error.flatten()));
        }
        req.body = parsed.data;
      }
      if (query) {
        const parsed = query.safeParse(req.query);
        if (!parsed.success) {
          return next(ApiError.badRequest('Invalid query parameters', parsed.error.flatten()));
        }
        req.query = parsed.data;
      }
      if (params) {
        const parsed = params.safeParse(req.params);
        if (!parsed.success) {
          return next(ApiError.badRequest('Invalid path parameters', parsed.error.flatten()));
        }
        req.params = parsed.data;
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { validate };