import mongoose from 'mongoose';
import { 
  createTestUser, 
  getAuthToken, 
  clearDatabase, 
  testClientData,
  testUserData 
} from '../utils/testUtils.js';
import app from '../../server/index.js';
import Job from '../../server/models/Job.js';
import request from 'supertest';

describe('Job API Endpoints', () => {
  let client;
  let freelancer;
  let clientToken;
  let freelancerToken;

  beforeEach(async () => {
    await clearDatabase();

    const clientObj = await createTestUser({
      ...testClientData,
      email: 'client@test.com'
    });
    client = clientObj.user;
    clientToken = clientObj.token;

    const freelancerObj = await createTestUser({
      ...testUserData,
      email: 'freelancer@test.com'
    });
    freelancer = freelancerObj.user;
    freelancerToken = freelancerObj.token;
  });

  describe('POST /api/jobs', () => {
    it('should create a new job and trigger job alerts', async () => {
      const jobData = {
        title: 'Test Job',
        description: 'This is a test job with sufficient length for the description requirement.',
        requirements: 'Test job requirements',
        skills: ['JavaScript', 'React'],
        type: 'fixed',
        duration: '1_to_3_months',
        experienceLevel: 'intermediate',
        client: client._id,
        category: {
          main: 'web-development'
        },
        budget: {
          type: 'fixed',
          min: 500,
          currency: 'USD'
        },
        status: 'published'
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.title).toBe(jobData.title);
      expect(response.body.description).toBe(jobData.description);
      expect(response.body.budget.min).toBe(jobData.budget.min);
      expect(response.body.client).toBe(client._id.toString());
    });

    it('should not allow freelancers to create jobs', async () => {
      const jobData = {
        title: 'Test Job',
        description: 'This is a test job with sufficient length for the description requirement.',
        requirements: 'Test job requirements',
        skills: ['JavaScript', 'React'],
        type: 'fixed',
        duration: '1_to_3_months',
        experienceLevel: 'intermediate',
        client: freelancer._id,
        category: {
          main: 'web-development'
        },
        budget: {
          type: 'fixed',
          min: 500,
          currency: 'USD'
        },
        status: 'published'
      };

      await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(jobData)
        .expect(403);
    });
  });

  describe('GET /api/jobs/:id', () => {
    let job;

    beforeEach(async () => {
      job = await Job.create({
        title: 'Test Job',
        description: 'This is a test job with sufficient length for the description requirement.',
        requirements: 'Test job requirements',
        skills: ['JavaScript', 'React'],
        type: 'fixed',
        duration: '1_to_3_months',
        experienceLevel: 'intermediate',
        client: client._id,
        category: {
          main: 'web-development'
        },
        budget: {
          type: 'fixed',
          min: 500,
          currency: 'USD'
        },
        status: 'published'
      });
    });

    it('should retrieve a job by id', async () => {
      const response = await request(app)
        .get(`/api/jobs/${job._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.title).toBe(job.title);
      expect(response.body.description).toBe(job.description);
      expect(response.body.client._id).toBe(client._id.toString());
      expect(response.body.client.name).toBe(client.name);
      expect(response.body.client.email).toBe(client.email);
    });

    it('should return 404 for non-existent job', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);
    });
  });
});
