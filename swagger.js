//swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Chrenis API', version: '1.0.0' },
    servers: [{ url: '/api' }]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs)
};