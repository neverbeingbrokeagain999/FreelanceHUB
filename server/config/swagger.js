import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FreelanceHub API Documentation',
      version: '1.0.0',
      description: 'API documentation for FreelanceHub platform',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: 'API Support',
        email: 'support@freelancehub.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.freelancehub.com/v1'
          : 'http://localhost:5000/api/v1',
        description: 'API v1 (Current)',
      },
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.freelancehub.com/v2'
          : '/api/v2',
        description: 'API v2 (Future)',
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
      schemas: {
        Job: {
          type: 'object',
          required: ['title', 'description', 'budget', 'category', 'skills'],
          properties: {
            title: {
              type: 'string',
              description: 'Job title',
            },
            description: {
              type: 'string',
              description: 'Detailed job description',
            },
            budget: {
              type: 'number',
              description: 'Job budget',
            },
            category: {
              type: 'string',
              description: 'Job category',
            },
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Required skills',
            },
            location: {
              type: 'string',
              description: 'Job location (optional)',
            },
            isHourly: {
              type: 'boolean',
              description: 'Whether the job is hourly or fixed price',
            },
          },
        },
        Proposal: {
          type: 'object',
          required: ['coverLetter', 'price'],
          properties: {
            coverLetter: {
              type: 'string',
              description: 'Proposal cover letter',
            },
            price: {
              type: 'number',
              description: 'Proposed price',
            },
          },
        },
        Review: {
          type: 'object',
          required: ['rating', 'comment'],
          properties: {
            rating: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Review rating (1-5)',
            },
            comment: {
              type: 'string',
              description: 'Review comment',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
            error: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./server/routes/*.js'], // Path to the API routes
};

export const specs = swaggerJsdoc(swaggerOptions);

// Example route documentation (to be added to respective route files):
/**
 * @swagger
 * /api/v1/jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for jobs
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
