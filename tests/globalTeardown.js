module.exports = async () => {
  // Clean up any test resources if needed
  delete process.env.NODE_ENV;
  delete process.env.JWT_SECRET;
  delete process.env.MONGODB_URI;
  delete process.env.PORT;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.REDIS_URL;
};
