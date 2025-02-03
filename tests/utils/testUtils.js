import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import mongoose from 'mongoose';
import { User } from '../../server/models/User.js';
import { Profile } from '../../server/models/Profile.js';
import Job from '../../server/models/Job.js';
import Transaction from '../../server/models/Transaction.js';
import Dispute from '../../server/models/Dispute.js';
import Notification from '../../server/models/Notification.js';
import expressApp from '../../server/index.js';

// Test user data
export const testUserData = {
  name: 'Test Freelancer',
  email: 'freelancer@test.com',
  password: 'password123',
  role: 'freelancer'
};

export const testClientData = {
  name: 'Test Client',
  email: 'client@test.com',
  password: 'password123',
  role: 'client'
};

export const testAdminData = {
  name: 'Test Admin',
  email: 'admin@test.com',
  password: 'password123',
  role: 'admin'
};

/**
 * Generate a valid MongoDB ObjectId
 */
export const generateObjectId = () => new mongoose.Types.ObjectId().toString();

/**
 * Create a test user with optional custom fields
 */
export const createTestUser = async (customFields = {}) => {
  // Create user with raw password (will be hashed by User model)
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'freelancer',
    emailVerified: true
  };
  
  const userData = { ...defaultUser, ...customFields };
  const user = await User.create(userData);

  // Create associated profile
  const profile = await Profile.create({
    user: user._id,
    name: userData.name,
    title: 'Software Developer',
    bio: 'Test user bio'
  });

  user.profile = profile._id;
  await user.save();

  const token = generateTestToken(user);
  return { user, token };
};

/**
 * Create a test transaction
 */
export const createTestTransaction = async (senderId, recipientId) => {
  return Transaction.create({
    transactionId: `TEST${Date.now()}${Math.floor(Math.random() * 10000)}`,
    sender: {
      user: new mongoose.Types.ObjectId(senderId),
      type: 'client'
    },
    recipient: {
      user: new mongoose.Types.ObjectId(recipientId),
      type: 'freelancer'
    },
    type: 'payment',
    subType: 'milestone_payment',
    description: 'Test transaction',
    amount: {
      value: 100,
      currency: 'USD'
    },
    total: {
      value: 100,
      currency: 'USD'
    },
    paymentMethod: {
      type: 'credit_card',
      details: {
        card: {
          last4: '4242'
        }
      }
    },
    status: 'completed'
  });
};

/**
 * Create a test dispute
 */
export const createTestDispute = async (clientId, freelancerId) => {
  return Dispute.create({
    initiator: {
      user: new mongoose.Types.ObjectId(clientId),
      role: 'client'
    },
    respondent: {
      user: new mongoose.Types.ObjectId(freelancerId),
      role: 'freelancer'
    },
    title: 'Test Dispute',
    description: 'Test dispute description',
    status: 'opened',
    amount: {
      disputed: 100,
      currency: 'USD'
    },
    type: 'payment',
    evidence: [{
      type: 'message',
      description: 'Test evidence',
      uploadedBy: new mongoose.Types.ObjectId(clientId)
    }],
    desiredOutcome: 'Full refund of disputed amount'
  });
};

/**
 * Create a test notification
 */
export const createTestNotification = async (userId, title = 'Test Notification') => {
  return Notification.create({
    recipient: userId,
    title,
    message: 'Test notification message',
    type: 'system',
    category: 'info',
    status: {
      isRead: false
    },
    delivery: {
      channels: [{
        type: 'in_app'
      }]
    }
  });
};

/**
 * Generate a valid JWT token for a user
 */
export const generateTestToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion || 0
    },
    process.env.JWT_SECRET || 'test-jwt-secret-key-123',
    { expiresIn: '24h' }
  );
};

/**
 * Make authenticated request helper
 */
export const authenticatedRequest = (user) => {
  const token = generateTestToken(user);
  return {
    get: (url) => request(expressApp).get(url).set('Authorization', `Bearer ${token}`),
    post: (url, data) => request(expressApp).post(url).send(data).set('Authorization', `Bearer ${token}`),
    put: (url, data) => request(expressApp).put(url).send(data).set('Authorization', `Bearer ${token}`),
    delete: (url) => request(expressApp).delete(url).set('Authorization', `Bearer ${token}`)
  };
};

/**
 * Clear database helper
 */
export const clearDatabase = async () => {
  await Promise.all([
    User.deleteMany({}),
    Profile.deleteMany({}),
    Transaction.deleteMany({}),
    Dispute.deleteMany({}),
    Notification.deleteMany({}),
    Job.deleteMany({})
  ]);
};

/**
 * Response validation helpers
 */
export const validateSuccessResponse = (response) => {
  expect(response.status).toBe(200);
  expect(response.body).toBeTruthy();
};

export const validateErrorResponse = (response, status = 400) => {
  expect(response.status).toBe(status);
  expect(response.body).toHaveProperty('message');
};

export const validatePaginationResponse = (response) => {
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('pagination');
  expect(response.body.pagination).toHaveProperty('total');
  expect(response.body.pagination).toHaveProperty('page');
  expect(response.body.pagination).toHaveProperty('pages');
};

/**
 * Mock cache service for testing
 */
export const mockCacheService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  delete: jest.fn().mockResolvedValue(true),
  clear: jest.fn().mockResolvedValue(true),
  invalidateUserCaches: jest.fn().mockResolvedValue(true)
};
