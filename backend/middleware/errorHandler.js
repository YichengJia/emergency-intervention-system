/**
 * Centralized error-handling middleware for the Express application.
 * Any error thrown in route handlers or middleware should be passed
 * to next(err) to be caught here. Responds with appropriate status code
 * and a structured JSON error object.
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);
  // If the error has a statusCode, use it; otherwise default to 500
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return res.status(status).json({ error: message });
}

module.exports = {
  errorHandler
};