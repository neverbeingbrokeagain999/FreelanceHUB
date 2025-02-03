module.exports = async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

  // Mock any other required environment variables for tests
  process.env.PORT = 5000;
  process.env.STRIPE_SECRET_KEY = 'test_stripe_key';
  process.env.REDIS_URL = 'redis://localhost:6379';
};
