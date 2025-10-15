// File: utils/validators.js
const Joi = require('joi');

exports.createUser = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).required(),
  password: Joi.string().min(8).required()
});

exports.createInvestment = Joi.object({
  projectId: Joi.string().required(),
  amount: Joi.number().min(1).required(),
  term: Joi.string().valid('4mo','12mo').required()
});

exports.createProject = Joi.object({
  slug: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  minInvestment: Joi.number().default(10000)
});