import request from 'supertest';
import { app } from '../../server/index.js';
import { User } from '../../server/models/User.js';
import { Transaction } from '../../server/models/Transaction.js';
import { createTestDispute, createTestNotification } from '../utils/testUtils.js';
import {
  createTestUser,
  createTestTransaction,
  authenticatedRequest,
  testUserData,
  testClientData,
  testAdminData,
  validateErrorResponse,
  validateSuccessResponse,
  validatePaginationResponse,
  clearDatabase,
} from '../utils/testUtils.js';

describe('Admin Endpoints', () => {
  let admin, testClient, testFreelancer;
  
  beforeEach(async () => {
    await clearDatabase();
    
    // Create test users
    admin = await createTestUser(testAdminData);
    testClient = await createTestUser({ ...testClientData, email: 'client1@test.com' });
    testFreelancer = await createTestUser({ ...testUserData, email: 'freelancer1@test.com' });
    
    // Create test data for stats
    await Promise.all([
      createTestUser({ ...testUserData, email: 'new1@test.com' }),
      createTestUser({ ...testUserData, email: 'new2@test.com' }),
      createTestTransaction(testClient._id, testFreelancer._id),
      createTestTransaction(testClient._id, testFreelancer._id),
      createTestDispute(testClient._id, testFreelancer._id),
      createTestNotification(testClient._id),
      createTestNotification(testFreelancer._id)
    ]);
  });

  describe('GET /api/admin/dashboard/stats', () => {
    it('should get dashboard stats', async () => {
      const response = await authenticatedRequest(admin)
        .get('/api/admin/dashboard/stats');
      
      validateSuccessResponse(response);
      expect(response.body).toHaveProperty('userStats');
      expect(response.body).toHaveProperty('jobStats');
      expect(response.body).toHaveProperty('financialStats');
    });

    it('should not allow non-admin access', async () => {
      const user = await createTestUser(testUserData);
      const response = await authenticatedRequest(user)
        .get('/api/admin/dashboard/stats');
      
      validateErrorResponse(response, 403);
    });
  });

  describe('GET /api/admin/users', () => {
    beforeEach(async () => {
      // Create some test users
      await Promise.all([
        createTestUser({ ...testUserData, email: 'user1@test.com' }),
        createTestUser({ ...testUserData, email: 'user2@test.com' }),
        createTestUser({ ...testUserData, email: 'user3@test.com' })
      ]);
    });

    it('should list users with pagination', async () => {
      const response = await authenticatedRequest(admin)
        .get('/api/admin/users');
      
      validateSuccessResponse(response);
      validatePaginationResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      const response = await authenticatedRequest(admin)
        .get('/api/admin/users?role=freelancer');
      
      validateSuccessResponse(response);
      validatePaginationResponse(response);
      response.body.data.forEach(user => {
        expect(user.role).toBe('freelancer');
      });
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get user by id', async () => {
      const user = await createTestUser(testUserData);
      const response = await authenticatedRequest(admin)
        .get(`/api/admin/users/${user._id}`);
      
      validateSuccessResponse(response);
      expect(response.body.user).toMatchObject({
        _id: user._id.toString(),
        email: user.email
      });
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await authenticatedRequest(admin)
        .get(`/api/admin/users/${fakeId}`);
      
      validateErrorResponse(response, 404);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user', async () => {
      const user = await createTestUser(testUserData);
      const updateData = {
        name: 'Updated Name',
        role: 'freelancer'
      };

      const response = await authenticatedRequest(admin)
        .put(`/api/admin/users/${user._id}`)
        .send(updateData);
      
      validateSuccessResponse(response);
      expect(response.body.user).toMatchObject(updateData);
    });

    it('should not update to invalid role', async () => {
      const user = await createTestUser(testUserData);
      const response = await authenticatedRequest(admin)
        .put(`/api/admin/users/${user._id}`)
        .send({ role: 'invalid_role' });
      
      validateErrorResponse(response, 400);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user', async () => {
      const user = await createTestUser(testUserData);
      const response = await authenticatedRequest(admin)
        .delete(`/api/admin/users/${user._id}`);
      
      validateSuccessResponse(response);
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await authenticatedRequest(admin)
        .delete(`/api/admin/users/${fakeId}`);
      
      validateErrorResponse(response, 404);
    });
  });

  describe('GET /api/admin/transactions', () => {
    it('should list transactions with pagination', async () => {
      const response = await authenticatedRequest(admin)
        .get('/api/admin/transactions');
      
      validateSuccessResponse(response);
      validatePaginationResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2); // We created 2 transactions in beforeEach

      response.body.data.forEach(transaction => {
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('type');
        expect(transaction).toHaveProperty('status');
        expect(transaction).toHaveProperty('sender');
        expect(transaction).toHaveProperty('recipient');
        expect(transaction.sender).toHaveProperty('user');
        expect(transaction.recipient).toHaveProperty('user');
      });
    });

    it('should not allow non-admin access', async () => {
      const user = await createTestUser(testUserData);
      const response = await authenticatedRequest(user)
        .get('/api/admin/transactions');
      
      validateErrorResponse(response, 403);
    });
  });

  describe('GET /api/admin/disputes', () => {
    it('should list disputes with pagination', async () => {
      const response = await authenticatedRequest(admin)
        .get('/api/admin/disputes');
      
      validateSuccessResponse(response);
      validatePaginationResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/admin/disputes/:id/resolve', () => {
    it('should resolve dispute', async () => {
      const dispute = await createTestDispute(testClient._id, testFreelancer._id);
      const response = await authenticatedRequest(admin)
        .post(`/api/admin/disputes/${dispute._id}/resolve`)
        .send({ resolution: 'Resolution by admin' });
      
      validateSuccessResponse(response);
      expect(response.body.status).toBe('resolved');
      expect(response.body.resolution.description).toBe('Resolution by admin');
      expect(response.body.resolution.outcome).toBe('resolved_mutually');
      expect(response.body.resolution.resolvedBy.toString()).toBe(admin._id.toString());
    });
  });

  describe('GET /api/admin/notifications', () => {
    it('should list notifications with pagination', async () => {
      const response = await authenticatedRequest(admin)
        .get('/api/admin/notifications');
      
      validateSuccessResponse(response);
      validatePaginationResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('PUT /api/admin/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notification = await createTestNotification(admin._id);
      const response = await authenticatedRequest(admin)
        .put(`/api/admin/notifications/${notification._id}/read`);
      
      validateSuccessResponse(response);
      expect(response.body.status.isRead).toBe(true);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('should list audit logs with pagination', async () => {
      const response = await authenticatedRequest(admin)
        .get('/api/admin/audit-logs');
      
      validateSuccessResponse(response);
      validatePaginationResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});
