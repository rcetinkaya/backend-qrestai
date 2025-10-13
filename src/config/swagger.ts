/**
 * Swagger/OpenAPI Configuration
 */

import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'QRestAI API Documentation',
    version: '1.0.0',
    description: 'QR Menu System REST API - Complete API documentation for customer and admin panels',
    contact: {
      name: 'API Support',
      email: 'support@qrestai.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:3001/api`,
      description: 'Development server',
    },
    {
      url: 'https://api.qrestai.com/api',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
    },
    schemas: {
      // Common schemas
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'ErrorType',
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          statusCode: {
            type: 'number',
            example: 400,
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'number',
            example: 1,
          },
          limit: {
            type: 'number',
            example: 10,
          },
          total: {
            type: 'number',
            example: 100,
          },
          totalPages: {
            type: 'number',
            example: 10,
          },
          hasNext: {
            type: 'boolean',
            example: true,
          },
          hasPrev: {
            type: 'boolean',
            example: false,
          },
        },
      },
      // Auth schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Password123!',
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name', 'organizationName', 'organizationSlug'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Password123!',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          organizationName: {
            type: 'string',
            example: 'My Restaurant',
          },
          organizationSlug: {
            type: 'string',
            example: 'my-restaurant',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User',
              },
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              refreshToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              organization: {
                $ref: '#/components/schemas/Organization',
              },
            },
          },
        },
      },
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'cuid123456',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      // Organization schemas
      Organization: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'cuid123456',
          },
          name: {
            type: 'string',
            example: 'My Restaurant',
          },
          slug: {
            type: 'string',
            example: 'my-restaurant',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'SUSPENDED', 'DELETED'],
            example: 'ACTIVE',
          },
          plan: {
            type: 'string',
            enum: ['FREE', 'PRO', 'BUSINESS'],
            example: 'FREE',
          },
          tokens: {
            type: 'number',
            example: 0,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      // Menu schemas
      Menu: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'cuid123456',
          },
          name: {
            type: 'string',
            example: 'Summer Menu',
          },
          locale: {
            type: 'string',
            example: 'tr',
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateMenuRequest: {
        type: 'object',
        required: ['name', 'locale'],
        properties: {
          name: {
            type: 'string',
            example: 'Summer Menu',
          },
          locale: {
            type: 'string',
            example: 'tr',
          },
        },
      },
      UpdateMenuRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Updated Menu Name',
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
        },
      },
      // Category schemas
      Category: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'cuid123456',
          },
          name: {
            type: 'string',
            example: 'Beverages',
          },
          description: {
            type: 'string',
            example: 'Hot and cold drinks',
          },
          sortOrder: {
            type: 'number',
            example: 0,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateCategoryRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            example: 'Beverages',
          },
          description: {
            type: 'string',
            example: 'Hot and cold drinks',
          },
          sortOrder: {
            type: 'number',
            example: 0,
          },
        },
      },
      // MenuItem schemas
      MenuItem: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'cuid123456',
          },
          name: {
            type: 'string',
            example: 'Cappuccino',
          },
          description: {
            type: 'string',
            example: 'Italian coffee with milk',
          },
          price: {
            type: 'number',
            format: 'float',
            example: 45.0,
          },
          imageUrl: {
            type: 'string',
            example: 'https://example.com/cappuccino.jpg',
          },
          isAvailable: {
            type: 'boolean',
            example: true,
          },
          sortOrder: {
            type: 'number',
            example: 0,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      CreateMenuItemRequest: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          name: {
            type: 'string',
            example: 'Cappuccino',
          },
          description: {
            type: 'string',
            example: 'Italian coffee with milk',
          },
          price: {
            type: 'number',
            format: 'float',
            example: 45.0,
          },
          imageUrl: {
            type: 'string',
            example: 'https://example.com/cappuccino.jpg',
          },
          isAvailable: {
            type: 'boolean',
            example: true,
          },
          sortOrder: {
            type: 'number',
            example: 0,
          },
        },
      },
      // QR Code schemas
      QrCode: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'cuid123456',
          },
          shortId: {
            type: 'string',
            example: 'abc123',
          },
          style: {
            type: 'object',
            properties: {
              foreground: {
                type: 'string',
                example: '#000000',
              },
              background: {
                type: 'string',
                example: '#FFFFFF',
              },
              errorCorrection: {
                type: 'string',
                example: 'M',
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      // Theme schemas
      Theme: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'cuid123456',
          },
          themeKey: {
            type: 'string',
            example: 'modern',
          },
          primary: {
            type: 'string',
            example: '#3B82F6',
          },
          accent: {
            type: 'string',
            example: '#10B981',
          },
          customCss: {
            type: 'string',
            example: '.menu { font-size: 16px; }',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'API health check endpoints',
    },
    {
      name: 'Authentication',
      description: 'User authentication and authorization',
    },
    {
      name: 'Menus',
      description: 'Menu management operations',
    },
    {
      name: 'Categories',
      description: 'Category management operations',
    },
    {
      name: 'Menu Items',
      description: 'Menu item management operations',
    },
    {
      name: 'QR Codes',
      description: 'QR code generation and management',
    },
    {
      name: 'Organization',
      description: 'Organization and member management',
    },
    {
      name: 'Theme',
      description: 'Theme customization',
    },
    {
      name: 'Admin - Organizations',
      description: 'Admin panel organization management',
    },
    {
      name: 'Admin - Statistics',
      description: 'Admin panel statistics and analytics',
    },
  ],
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: [
    './src/routes/**/*.ts',
    './src/routes/**/*.js',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
