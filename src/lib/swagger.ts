// @ts-ignore
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'iTransfr API',
      version: '1.0.0',
      description:
        'iTransfr API Documentation - Remittance Platform\n\n## Authentication\n\n### Client Authentication\n- Uses Supabase session cookies (clientAuth)\n- Login handled by frontend Supabase client\n- Automatic cookie validation\n\n### Admin Authentication\n- Uses Supabase session cookies + admin role check (adminAuth)\n- Additional verification against admin_profiles table\n\n## API Organization\n- Client APIs: User operations (transactions, KYC)\n- Admin APIs: Administrative operations (dashboard, management)',
      contact: {
        name: 'iTransfr Support',
        email: 'support@itransfr.com',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        clientAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sb-access-token',
          description:
            'Supabase session cookie for client authentication. Login happens through the client portal UI.',
        },
        adminAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sb-access-token',
          description:
            'Supabase session cookie for admin authentication. Requires both valid session and admin role verification.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            firstName: {
              type: 'string',
              description: 'First name',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
            },
            companyName: {
              type: 'string',
              description: 'Company name',
            },
            mobile: {
              type: 'string',
              description: 'Mobile number',
            },
            countryCode: {
              type: 'string',
              description: 'Country code',
            },
            status: {
              type: 'string',
              enum: ['pending_kyc', 'kyc_submitted', 'kyc_approved', 'kyc_rejected'],
              description: 'User status',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Transaction ID',
            },
            userId: {
              type: 'string',
              description: 'User ID',
            },
            type: {
              type: 'string',
              enum: ['deposit', 'payout'],
              description: 'Transaction type',
            },
            amount: {
              type: 'number',
              description: 'Transaction amount',
            },
            currencyFrom: {
              type: 'string',
              description: 'Source currency',
            },
            currencyTo: {
              type: 'string',
              description: 'Target currency',
            },
            status: {
              type: 'string',
              enum: ['DEPOSIT_REQUESTED', 'DEPOSIT_RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED'],
              description: 'Transaction status',
            },
            reference: {
              type: 'string',
              description: 'Transaction reference',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        KYCRecord: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'KYC record ID',
            },
            userId: {
              type: 'string',
              description: 'User ID',
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              description: 'KYC status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        SignupRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password',
            },
            firstName: {
              type: 'string',
              description: 'First name',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
            },
            companyName: {
              type: 'string',
              description: 'Company name',
            },
            mobile: {
              type: 'string',
              description: 'Mobile number',
            },
            countryCode: {
              type: 'string',
              description: 'Country code',
            },
          },
        },
        DepositRequest: {
          type: 'object',
          required: ['amount', 'currency'],
          properties: {
            amount: {
              type: 'number',
              minimum: 0.01,
              description: 'Deposit amount',
            },
            currency: {
              type: 'string',
              description: 'Currency code (e.g., USD, EUR)',
            },
          },
        },
        DepositResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Operation success status',
            },
            transactionId: {
              type: 'string',
              description: 'Transaction ID',
            },
            reference: {
              type: 'string',
              description: 'Transaction reference',
            },
            status: {
              type: 'string',
              description: 'Transaction status',
            },
            amount: {
              type: 'number',
              description: 'Deposit amount',
            },
            currency: {
              type: 'string',
              description: 'Currency code',
            },
            amlCheck: {
              type: 'object',
              properties: {
                passed: {
                  type: 'boolean',
                  description: 'AML check result',
                },
                riskScore: {
                  type: 'number',
                  description: 'Risk score',
                },
                riskLevel: {
                  type: 'string',
                  description: 'Risk level',
                },
              },
            },
            bankDetails: {
              type: 'object',
              properties: {
                bankName: {
                  type: 'string',
                  description: 'Bank name',
                },
                accountNumber: {
                  type: 'string',
                  description: 'Account number',
                },
                routingNumber: {
                  type: 'string',
                  description: 'Routing number',
                },
                accountName: {
                  type: 'string',
                  description: 'Account name',
                },
                swiftCode: {
                  type: 'string',
                  description: 'SWIFT code',
                },
                reference: {
                  type: 'string',
                  description: 'Reference for transfer',
                },
                instructions: {
                  type: 'string',
                  description: 'Transfer instructions',
                },
              },
            },
            message: {
              type: 'string',
              description: 'Response message',
            },
          },
        },
      },
    },
    security: [
      {
        clientAuth: [],
      },
    ],
    tags: [
      {
        name: 'Client Authentication',
        description: 'User signup, login, OTP verification, and profile management',
      },
      {
        name: 'Client Transactions',
        description: 'Deposit and payout operations for authenticated clients',
      },
      {
        name: 'Client KYC',
        description: 'KYC document upload and client-side KYC operations',
      },
      {
        name: 'Admin Authentication',
        description: 'Admin verification and access control',
      },
      {
        name: 'Admin Dashboard',
        description: 'Platform statistics and administrative overview',
      },
      {
        name: 'Admin KYC Management',
        description: 'Review, approve, and reject KYC applications',
      },
      {
        name: 'Admin Transaction Management',
        description: 'Monitor and update transaction statuses',
      },
      {
        name: 'Admin Payout Management',
        description: 'Process and send payout transactions',
      },
      {
        name: 'Admin Integrations',
        description:
          'Test and manage external service integrations (Bitso, Infinitus, AMLBot, Turnkey)',
      },
      {
        name: 'Admin Webhooks',
        description: 'Handle callbacks from external services',
      },
    ],
  },
  apis: ['./src/lib/swagger-definitions.ts'], // Path to the API definitions file
};

export const swaggerSpec = swaggerJSDoc(options);
