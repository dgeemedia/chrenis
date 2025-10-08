const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const SWAGGER_HOST = process.env.SWAGGER_LOCAL || `http://localhost:${process.env.PORT || 8083}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chrenis API',
      version: '1.0.0',
      description: 'API documentation for the Chrenis investment platform'
    },
<<<<<<< HEAD
    servers: [{ url: '/' }],
=======
    servers: [{ url:  'http://localhost:5000/api' }],
>>>>>>> feb960b082230f3369e41326b3268f40c6b30638
    components: {
      securitySchemes: {
        OAuth2Auth: {
          type: 'oauth2',
          flows: {
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
      },
      schemas: {
        // ———— Error ————
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },

        // ———— Auth ————
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT token' },
            user: { $ref: '#/components/schemas/User' }
          }
        },

        // ———— User ————
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64a1f0e0b4c3a1d2e3f45678' },
            email: { type: 'string', format: 'email', example: 'george@chrenis.com' },
            name: { type: 'string', example: 'George Olumah' },
            role: { type: 'string', enum: ['user','admin'], example: 'user' },
            walletBalance: { type: 'number', example: 5000 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        UserCreate: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' }
          }
        },

        // ———— Project ————
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64b2f0e0b4c3a1d2e3f45670' },
            slug: { type: 'string', example: 'mango-orchard-2025' },
            title: { type: 'string', example: 'Mango Orchard - 4mo' },
            description: { type: 'string' },
            minInvestment: { type: 'number', example: 10000 },
            roi4moPercent: { type: 'number', example: 12 },
            roi12moPercent: { type: 'number', example: 35 },
            durationMonths: { type: 'number', example: 4 },
            status: { type: 'string', enum: ['active','paused','archived'], example: 'active' },
            images: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ProjectCreate: {
          type: 'object',
          required: ['slug', 'title'],
          properties: {
            slug: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            minInvestment: { type: 'number' },
            roi4moPercent: { type: 'number' },
            roi12moPercent: { type: 'number' },
            durationMonths: { type: 'number' },
            status: { type: 'string' }
          }
        },

        // ———— Transaction ————
        Transaction: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            investmentId: { type: 'string' },
            type: { type: 'string', enum: ['deposit','withdrawal','roi_credit','fee'] },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['pending','success','failed'] },
            provider: { type: 'string' },
            providerRef: { type: 'string' },
            meta: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },

        // ———— Investment ————
        Investment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            projectId: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string', example: 'NGN' },
            startDate: { type: 'string', format: 'date-time' },
            maturityDate: { type: 'string', format: 'date-time' },
            roiPercent: { type: 'number' },
            expectedPayout: { type: 'number' },
            status: { type: 'string', enum: ['active','matured','withdrawn','reinvested'] },
            paymentRef: { type: 'string' },
            transactions: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        InvestmentCreate: {
          type: 'object',
          required: ['projectId', 'amount', 'term'],
          properties: {
            projectId: { type: 'string', description: 'MongoDB ObjectId string of the project' },
            amount: { type: 'number', description: 'Amount in NGN' },
            term: { type: 'string', enum: ['4mo','12mo'] }
          }
        }
      }
    },

    // ———— Paths start here (Users, then Investments) ————
    paths: {
      // ——— USERS ———
      '/users': {
        get: {
          summary: 'Get all users',
          tags: ['Users'],
          responses: {
            '200': {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new user',
          security: [{ bearerAuth: [] }],
          tags: ['Users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserCreate' }
              }
            }
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '400': { description: 'Bad request' }
          }
        }
      },
      '/users/{id}': {
        get: {
          summary: 'Get a user by ID',
          tags: ['Users'],
          parameters: [{
            in: 'path', name: 'id', required: true, schema: { type: 'string' }
          }],
          responses: {
            '200': {
              description: 'User found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '404': { description: 'User not found' }
          }
        },
        put: {
          summary: 'Update a user by ID',
          security: [{ bearerAuth: [] }],
          tags: ['Users'],
          parameters: [{
            in: 'path', name: 'id', required: true, schema: { type: 'string' }
          }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserCreate' }
              }
            }
          },
          responses: {
            '200': {
              description: 'User updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            '400': { description: 'Bad request' },
            '404': { description: 'User not found' }
          }
        },
        delete: {
          summary: 'Delete a user by ID',
          security: [{ bearerAuth: [] }],
          tags: ['Users'],
          parameters: [{
            in: 'path', name: 'id', required: true, schema: { type: 'string' }
          }],
          responses: {
            '204': { description: 'User deleted successfully' },
            '404': { description: 'User not found' }
          }
        }
      },

      // ——— INVESTMENTS ———
      '/investments': {
        get: {
          summary: 'Get all investments',
          tags: ['Investments'],
          responses: {
            '200': {
              description: 'List of investments',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Investment' }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Create a new investment',
          security: [{ bearerAuth: [] }],
          tags: ['Investments'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InvestmentCreate' }
              }
            }
          },
          responses: {
            '201': {
              description: 'Investment created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Investment' }
                }
              }
            },
            '400': { description: 'Bad request' }
          }
        }
      },
      '/investments/{id}': {
        get: {
          summary: 'Get an investment by ID',
          tags: ['Investments'],
          parameters: [{
            in: 'path', name: 'id', required: true, schema: { type: 'string' }
          }],
          responses: {
            '200': {
              description: 'Investment found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Investment' }
                }
              }
            },
            '404': { description: 'Investment not found' }
          }
        },
        put: {
          summary: 'Update an investment by ID',
          security: [{ bearerAuth: [] }],
          tags: ['Investments'],
          parameters: [{
            in: 'path', name: 'id', required: true, schema: { type: 'string' }
          }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/InvestmentCreate' },
                    {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          enum: ['active','matured','withdrawn','reinvested']
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Investment updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Investment' }
                }
              }
            },
            '400': { description: 'Bad request' },
            '404': { description: 'Investment not found' }
          }
        },
        delete: {
          summary: 'Delete an investment by ID',
          security: [{ bearerAuth: [] }],
          tags: ['Investments'],
          parameters: [{
            in: 'path', name: 'id', required: true, schema: { type: 'string' }
          }],
          responses: {
            '204': { description: 'Investment deleted successfully' },
            '404': { description: 'Investment not found' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

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
