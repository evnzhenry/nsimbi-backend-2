const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nsimbi Wallet API',
      version: '1.0.0',
      description: 'API documentation for Nsimbi School Wallet',
      contact: {
        name: 'API Support',
        email: 'dev@nsimbi.com',
      },
    },
    servers: [
      {
        url: 'https://nsimbi-server.onrender.com/api',
        description: 'Production server',
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
