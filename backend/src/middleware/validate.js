const { apiError } = require('../utils/response');

function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      if (error.errors) {
        const formatted = error.errors.map((e) => ({
          field: e.path.slice(1).join('.'),
          message: e.message,
        }));
        return apiError(res, 'Validation failed', 422, formatted);
      }
      return apiError(res, 'Invalid input parameters', 400);
    }
  };
}

module.exports = validate;
