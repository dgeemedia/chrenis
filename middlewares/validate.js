// File: middlewares/validate.js
// Validation middleware using Joi
// Usage: const validate = require('./middlewares/validate');
module.exports = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details.map(d => d.message).join(', ') });
  next();
};