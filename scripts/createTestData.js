const mongoose = require('mongoose');
const DirectContract = require('../server/models/DirectContract');
const User = require('../server/models/User');
require('dotenv').config();

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create test users if they don't exist
    const freelancer = await User.findOneAndUpdate(
      { email: 'freelancer@test.com' },
      {
        name: 'Test Freelancer',
        email: 'freelancer@test.com',
        password: '$2a$10$YourHashedPasswordHere',
        role: 'freelancer'
      },
      { upsert: true, new: true }
    );

    const client = await User.findOneAndUpdate(
      { email: 'client@test.com' },
      {
        name: 'Test Client',
        email: 'client@test.com',
        password: '$2a$10$YourHashedPasswordHere',
        role: 'client'
      },
      { upsert: true, new: true }
    );

    // Create test direct contract
    const contract = await DirectContract.create({
      freelancer: freelancer._id,
      client: client._id,
      contractDetails: 'Test Web Development Project',
      budget: 1000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'active',
      terms: 'Test contract terms'
    });

    console.log('Test data created successfully:', contract);
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestData();
