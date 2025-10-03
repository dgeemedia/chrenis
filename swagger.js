// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const SWAGGER_HOST = process.env.SWAGGER_LOCAL || `http://localhost:${process.env.PORT || 8083}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Chrenis API', version: '1.0.0' },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        OAuth2Auth: {
          type: 'oauth2',
          flows: {
            // Using "implicit" flow so Swagger UI can accept the access_token in the fragment.
            implicit: {
              authorizationUrl: `${SWAGGER_HOST.replace(/\/$/, '')}/auth/start-oauth`,
              scopes: {}
            }
          }
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

// swagger UI options: set oauth2 redirect URL so auth flow returns there
const swaggerUiOptions = {
  swaggerOptions: {
    oauth2RedirectUrl: `${SWAGGER_HOST.replace(/\/$/, '')}/api-docs/oauth2-redirect.html`,
    persistAuthorization: true
  }
};

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, swaggerUiOptions)
};
