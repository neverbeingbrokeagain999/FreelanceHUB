import request from 'supertest';
import app from '../../server/index.js';
import {
  createTestUser,
  authenticatedRequest,
  testUserData,
  testClientData,
  validateErrorResponse,
  validateSuccessResponse,
  validatePaginationResponse,
  generateObjectId,
} from '../utils/testUtils.js';

describe('User Endpoints', () => {
  describe('GET /api/users/profile', () => {
    it('should get user profile', async () => {
      const { user } = await createTestUser();
      const response = await authenticatedRequest(user).get('/api/users/profile');
      validateSuccessResponse(response);
      expect(response.body.user).toMatchObject({
        name: user.name,
        email: user.email
      });
    });

    it('should not get profile without auth token', async () => {
      const response = await request(app).get('/api/users/profile');
      validateErrorResponse(response, 401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const { user } = await createTestUser();
      const updatedData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await authenticatedRequest(user)
        .put('/api/users/profile')
        .send(updatedData);

      validateSuccessResponse(response);
      expect(response.body.user).toMatchObject(updatedData);
    });

    it('should not update profile with invalid data', async () => {
      const { user } = await createTestUser();
      const response = await authenticatedRequest(user)
        .put('/api/users/profile')
        .send({ name: '', email: 'invalid' });

      validateErrorResponse(response, 400);
    });

    it('should not update profile with existing email', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser({
        ...testUserData,
        email: 'existingemail@test.com'
      });

      const response = await authenticatedRequest(user1)
        .put('/api/users/profile')
        .send({
          name: 'Test Name',
          email: user2.email
        });

      validateErrorResponse(response, 400);
      expect(response.body.message).toBe('Email already in use');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const { user } = await createTestUser();
      const response = await authenticatedRequest(user).get(`/api/users/${user._id}`);
      validateSuccessResponse(response);
      expect(response.body.user).toMatchObject({
        name: user.name,
        email: user.email
      });
    });

    it('should return 404 for non-existent user', async () => {
      const { user } = await createTestUser();
      const response = await authenticatedRequest(user).get(`/api/users/${generateObjectId()}`);
      validateErrorResponse(response, 404);
    });
  });

  describe('GET /api/users', () => {
    it('should get paginated list of users', async () => {
      const { user: admin } = await createTestUser({ ...testUserData, role: 'admin' });
      const response = await authenticatedRequest(admin).get('/api/users');
      validateSuccessResponse(response);
      validatePaginationResponse(response);
    });

    it('should filter users by role', async () => {
      const { user: admin } = await createTestUser({ ...testUserData, role: 'admin' });
      await createTestUser(testClientData);
      const response = await authenticatedRequest(admin).get('/api/users?role=client');
      validateSuccessResponse(response);
      validatePaginationResponse(response);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: 'client' })
        ])
      );
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user account', async () => {
      const { user } = await createTestUser();
      const response = await authenticatedRequest(user).delete(`/api/users/${user._id}`);
      validateSuccessResponse(response);
      expect(response.body.message).toBe('User account deleted successfully');
    });

    it('should not delete other user accounts (non-admin)', async () => {
      const { user: user1 } = await createTestUser();
      const { user: user2 } = await createTestUser({ ...testUserData, email: 'other@example.com' });
      const response = await authenticatedRequest(user1).delete(`/api/users/${user2._id}`);
      validateErrorResponse(response, 403);
    });
  });

  describe('Freelancer Profile Operations', () => {
    describe('GET /api/users/freelancer/:id', () => {
      it('should get freelancer profile', async () => {
        const { user } = await createTestUser();
        const response = await authenticatedRequest(user).get(`/api/users/freelancer/${user._id}`);
        validateSuccessResponse(response);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user._id.toString()).toBe(user._id.toString());
      });

      it('should create new profile if none exists', async () => {
        const { user } = await createTestUser();
        const response = await authenticatedRequest(user).get(`/api/users/freelancer/${user._id}`);
        validateSuccessResponse(response);
        expect(response.body).toHaveProperty('skills', []);
        expect(response.body).toHaveProperty('education', []);
        expect(response.body).toHaveProperty('experience', []);
        expect(response.body).toHaveProperty('languages', []);
      });
    });

    describe('PUT /api/users/freelancer/profile', () => {
      it('should update freelancer profile', async () => {
        const { user } = await createTestUser();
        // First create a profile
        await authenticatedRequest(user).get(`/api/users/freelancer/${user._id}`);
        
        const profileData = {
          title: 'Senior Developer',
          bio: 'Experienced full-stack developer',
          skills: ['JavaScript', 'React', 'Node.js'],
          hourlyRate: 50,
          languages: ['English', 'Spanish']
        };

        const response = await authenticatedRequest(user)
          .put('/api/users/freelancer/profile')
          .send(profileData);

        validateSuccessResponse(response);
        expect(response.body.profile).toMatchObject({
          title: profileData.title,
          bio: profileData.bio,
          hourlyRate: profileData.hourlyRate
        });
        expect(response.body.profile.skills.map(s => s.name)).toEqual(expect.arrayContaining(profileData.skills));
        expect(response.body.profile.languages).toEqual(expect.arrayContaining(profileData.languages));
      });

      it('should handle JSON string fields', async () => {
        const { user } = await createTestUser();
        // First create a profile
        await authenticatedRequest(user).get(`/api/users/freelancer/${user._id}`);
        
        const profileData = {
          title: 'Senior Developer',
          skills: JSON.stringify(['JavaScript', 'React']),
          languages: JSON.stringify(['English', 'Spanish'])
        };

        const response = await authenticatedRequest(user)
          .put('/api/users/freelancer/profile')
          .send(profileData);

        validateSuccessResponse(response);
        expect(Array.isArray(response.body.profile.skills)).toBeTruthy();
        expect(Array.isArray(response.body.profile.languages)).toBeTruthy();
        expect(response.body.profile.skills.map(s => s.name)).toEqual(expect.arrayContaining(['JavaScript', 'React']));
        expect(response.body.profile.languages).toEqual(expect.arrayContaining(['English', 'Spanish']));
      });
    });

    describe('POST /api/users/freelancer/:id/endorsements', () => {
      it('should add skill endorsement', async () => {
        const { user: freelancer } = await createTestUser();
        const { user: endorser } = await createTestUser(testClientData);
        
        // First create a profile
        await authenticatedRequest(freelancer).get(`/api/users/freelancer/${freelancer._id}`);
        
        const response = await authenticatedRequest(endorser)
          .post(`/api/users/freelancer/${freelancer._id}/endorsements`)
          .send({ skill: 'JavaScript' });

        validateSuccessResponse(response);
        expect(response.body.message).toBe('Skill endorsed successfully');
      });

      it('should not allow duplicate endorsements', async () => {
        const { user: freelancer } = await createTestUser();
        const { user: endorser } = await createTestUser(testClientData);
        
        // First create a profile
        await authenticatedRequest(freelancer).get(`/api/users/freelancer/${freelancer._id}`);
        
        await authenticatedRequest(endorser)
          .post(`/api/users/freelancer/${freelancer._id}/endorsements`)
          .send({ skill: 'JavaScript' });

        const response = await authenticatedRequest(endorser)
          .post(`/api/users/freelancer/${freelancer._id}/endorsements`)
          .send({ skill: 'JavaScript' });

        validateErrorResponse(response, 400);
        expect(response.body.message).toBe('Already endorsed this skill');
      });
    });

    describe('POST /api/users/freelancer/:id/testimonials', () => {
      it('should add testimonial', async () => {
        const { user: freelancer } = await createTestUser();
        const { user: client } = await createTestUser(testClientData);
        
        // First create a profile
        await authenticatedRequest(freelancer).get(`/api/users/freelancer/${freelancer._id}`);
        
        const response = await authenticatedRequest(client)
          .post(`/api/users/freelancer/${freelancer._id}/testimonials`)
          .send({ text: 'Excellent work and communication!' });

        validateSuccessResponse(response);
        expect(response.body.message).toBe('Testimonial added successfully');
      });

      it('should validate testimonial text length', async () => {
        const { user: freelancer } = await createTestUser();
        const { user: client } = await createTestUser(testClientData);
        
        // First create a profile
        await authenticatedRequest(freelancer).get(`/api/users/freelancer/${freelancer._id}`);
        
        const response = await authenticatedRequest(client)
          .post(`/api/users/freelancer/${freelancer._id}/testimonials`)
          .send({ text: 'Too short' });

        validateErrorResponse(response, 400);
        expect(response.body.message).toBe('Testimonial text must be at least 10 characters');
      });
    });
  });
});
