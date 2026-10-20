// Centralized Error Handling Middleware
const { apiError } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Prisma specific known errors
  if (err.code === 'P2002') {
    const target = err.meta?.target || 'field';
    return apiError(res, `A record with this ${target} already exists.`, 409);
  }

  if (err.code === 'P2025') {
    return apiError(res, 'Record not found.', 404);
  }

  // Zod validation error handled in validate middleware, but in case:
  if (err.name === 'ZodError') {
    return apiError(res, 'Validation error', 400, err.errors);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return apiError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
}

module.exports = errorHandler;
