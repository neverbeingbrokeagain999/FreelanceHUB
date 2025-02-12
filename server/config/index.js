import testConfig from './test.js';

/**
 * Production configuration
 */
const productionConfig = {
  app: {
    name: 'Freelance Platform',
    environment: 'production',
    port: process.env.PORT || 5000,
    apiPrefix: '/api'
  },
  
  database: {
    url: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h'
  },

  auth: {
    allowAdminRegistration: false,
    passwordMinLength: 8,
    loginAttempts: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000
    },
    verification: {
      tokenExpiry: '24h',
      emailResendDelay: 60 * 1000
    }
  },

  email: {
    enabled: true,
    from: process.env.EMAIL_FROM,
    templates: {
      verifyEmail: 'verify-email',
      resetPassword: 'reset-password',
      welcomeEmail: 'welcome-email'
    }
  },

  security: {
    bcryptRounds: 10,
    rateLimiting: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 100
    },
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  },

  audit: {
    enabled: true,
    retention: { days: 90 },
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
    enabled: true,
    ttl: 60 * 60
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    silent: false
  },

  server: {
    shutdownTimeout: 30000,
    connectionTimeout: 10000,
    drainTimeout: 5000,
    databaseTimeout: 5000
  }
};

const developmentConfig = {
  ...productionConfig,
  app: {
    ...productionConfig.app,
    environment: 'development'
  },
  database: {
    url: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000
    }
  },
  auth: {
    ...productionConfig.auth,
    allowAdminRegistration: true
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'development_secret_key_123456789',
    expiresIn: '24h'
  },
  logging: {
    level: 'debug',
    silent: false
  },
  cache: {
    enabled: true,
    ttl: 60
  }
};

const validateConfig = (config) => {
  const requiredVars = {
    'JWT_SECRET': config.jwt.secret,
    'MONGODB_URI': config.database.url
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([name]) => name);

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    if (process.env.NODE_ENV === 'development') {
      console.warn('Development mode: Using fallback values for missing variables');
      return config;
    }
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return config;
};

// Cache the config to ensure consistent values
let cachedConfig = null;

export const getConfig = (env = process.env.NODE_ENV) => {
  if (cachedConfig) {
    return cachedConfig;
  }

  console.log('Loading configuration for environment:', env);
  
  let config;
  switch (env) {
    case 'test':
      config = testConfig;
      break;
    case 'production':
      config = productionConfig;
      break;
    default:
      config = developmentConfig;
  }

  cachedConfig = validateConfig(config);
  console.log('Using JWT secret:', cachedConfig.jwt.secret);
  return cachedConfig;
};

export default getConfig();
