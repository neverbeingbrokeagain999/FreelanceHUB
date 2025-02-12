export default {
  app: {
    name: 'Freelance Platform',
    environment: 'test',
    port: 5001,
    apiPrefix: '/api'
  },
  
  database: {
    url: 'mongodb://localhost:27017/flb61_test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  jwt: {
    secret: 'test_jwt_secret_key_123456789',
    expiresIn: '24h'
  },

  auth: {
    allowAdminRegistration: true,
    passwordMinLength: 8,
    loginAttempts: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    verification: {
      tokenExpiry: '24h',
      emailResendDelay: 60 * 1000 // 1 minute
    }
  },

  email: {
    enabled: false,
    from: 'test@example.com',
    templates: {
      verifyEmail: 'verify-email',
      resetPassword: 'reset-password',
      welcomeEmail: 'welcome-email'
    }
  },

  security: {
    bcryptRounds: 4, // Faster for tests
    rateLimiting: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 100
    },
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  },

  audit: {
    enabled: true,
    retention: {
      days: 1
    },
    criticalActions: [
      'USER_ROLE_CHANGE',
      'SYSTEM_CONFIG_UPDATE',
      'SECURITY_SETTING_CHANGE'
    ]
  },

  upload: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
  },

  cache: {
    enabled: false,
    ttl: 60 // 1 minute
  },

  logging: {
    level: 'error',
    silent: true
  }
};
