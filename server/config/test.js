export default {
  // Database settings
  database: {
    // Override with in-memory MongoDB settings from testDb.js
  },

  // JWT settings
  jwt: {
    secret: 'test-jwt-secret',
    expiresIn: '1h'
  },

  // Auth settings
  auth: {
    // Disable rate limiting in test environment
    rateLimit: false,
    
    // Use faster bcrypt rounds in test
    saltRounds: 1,
    
    // Token settings
    tokenExpiry: '15m',
    refreshTokenExpiry: '7d'
  },

  // Logging settings
  logging: {
    // Suppress detailed logging in tests
    level: 'error',
    silent: true
  },

  // Server settings 
  server: {
    port: 5001,
    host: 'localhost'
  },

  // Cache settings
  cache: {
    // Disable caching in tests
    enabled: false
  },

  // Monitoring settings
  monitoring: {
    // Disable monitoring in tests
    enabled: false,
    sentry: {
      enabled: false
    }
  },

  // Email settings
  email: {
    // Disable actual email sending in tests
    enabled: false
  }
};