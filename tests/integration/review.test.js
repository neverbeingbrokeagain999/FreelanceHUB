import mongoose from 'mongoose';
import app from '../../server/index.js';
import Review from '../../server/models/Review.js';
import { 
  createTestUser, 
  generateTestToken,
  clearDatabase, 
  testClientData,
  testUserData,
  mockCacheService
} from '../utils/testUtils.js';

// Mock the cache service
jest.mock('../../server/services/cacheService.js', () => mockCacheService);
import request from 'supertest';

describe('Review API Endpoints', () => {
  let token;
  let user;
  let freelancer;
  let freelancerToken;

  beforeEach(async () => {
    await clearDatabase();

    // Create test users
    const { user: createdUser, token: userToken } = await createTestUser({
      ...testClientData,
      email: 'client@test.com',
      role: 'client'
    });

    const { user: createdFreelancer, token: createdFreelancerToken } = await createTestUser({
      ...testUserData,
      email: 'freelancer@test.com',
      role: 'freelancer'
    });

    user = createdUser;
    freelancer = createdFreelancer;
    token = userToken;
    freelancerToken = createdFreelancerToken;
  });

  describe('POST /api/reviews', () => {
    it('should create a new review', async () => {
      const reviewData = {
        recipient: freelancer._id,
        recipientRole: 'freelancer',
        jobId: null,
        title: 'Excellent Freelancer',
        content: 'This is an excellent review comment that meets the minimum length requirement.',
        ratings: {
          communication: 5,
          quality: 5,
          expertise: 5,
          deadlines: 5,
          cooperation: 5
        },
        recommendations: {
          wouldHireAgain: true,
          recommendToOthers: true
        }
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.data.review).toBeDefined();
      expect(response.body.data.review.ratings.overall).toBe(5);
      expect(response.body.data.review.content).toBe(reviewData.content);
      expect(response.body.data.review.title).toBe(reviewData.title);
      expect(response.body.data.review.author.toString()).toBe(user._id.toString());
      expect(response.body.data.review.recipient.toString()).toBe(freelancer._id.toString());
      expect(response.body.data.review.authorRole).toBe('client');
      expect(response.body.data.review.recipientRole).toBe('freelancer');
      expect(response.body.data.review.recommendations.wouldHireAgain).toBe(true);
    });

    it('should not allow freelancers to create reviews without a job', async () => {
      const reviewData = {
        recipient: user._id,
        recipientRole: 'client',
        jobId: null,
        title: 'Great Client',
        content: 'This review should not be allowed as freelancers cannot review without a job context.',
        ratings: {
          communication: 5,
          quality: 5,
          expertise: 5,
          deadlines: 5,
          cooperation: 5
        },
        recommendations: {
          wouldWorkAgain: true,
          recommendToOthers: true
        }
      };

      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${freelancerToken}`)
        .send(reviewData)
        .expect(400); // Now expects 400 since validation happens before authorization
    });

    it('should validate review data', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: freelancer._id,
          recipientRole: 'freelancer',
          title: 'T', // Too short title
          content: 'Too short', // Too short content
          ratings: {
            communication: 6, // Invalid rating
            quality: 0, // Invalid rating
          }
        })
        .expect(400);
    });
  });

  describe('GET /api/reviews/user/:userId', () => {
    beforeEach(async () => {
      // Create some test reviews with unique project titles
      await Promise.all([
        new Review({
          author: user._id,
          authorRole: 'client',
          recipient: freelancer._id,
          recipientRole: 'freelancer',
          title: 'First Project Review',
          content: 'This is an excellent review for the first project.',
          ratings: {
            communication: 5,
            quality: 5,
            expertise: 5,
            deadlines: 5,
            cooperation: 5
          },
          status: 'published'
        }).save(),
        new Review({
          author: user._id,
          authorRole: 'client',
          recipient: freelancer._id,
          recipientRole: 'freelancer',
          title: 'Second Project Review',
          content: 'This is a good review for the second project.',
          ratings: {
            communication: 4,
            quality: 4,
            expertise: 4,
            deadlines: 4,
            cooperation: 4
          },
          status: 'published'
        }).save()
      ]);
    });

    it('should get all reviews for a user', async () => {
      const response = await request(app)
        .get(`/api/reviews/user/${freelancer._id}`)
        .expect(200);

      expect(response.body.reviews).toBeDefined();
      expect(response.body.reviews.length).toBe(2);
      expect(response.body.reviews[0].ratings.overall).toBeDefined();
      expect(response.body.reviews[0].content).toBeDefined();
      expect(response.body.reviews[0].title).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/reviews/user/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/reviews/:reviewId', () => {
    let review;

    beforeEach(async () => {
      review = await new Review({
        author: user._id,
        authorRole: 'client',
        recipient: freelancer._id,
        recipientRole: 'freelancer',
        title: 'Initial Review',
        content: 'This is the initial review comment for testing updates.',
        ratings: {
          communication: 4,
          quality: 4,
          expertise: 4,
          deadlines: 4,
          cooperation: 4
        },
        status: 'published'
      }).save();
    });

    it('should update a review', async () => {
      const response = await request(app)
        .put(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Review',
          content: 'This is the updated review comment with sufficient length.',
          ratings: {
            communication: 5,
            quality: 5,
            expertise: 5,
            deadlines: 5,
            cooperation: 5
          }
        })
        .expect(200);

      expect(response.body.data.review.ratings.overall).toBe(5);
      expect(response.body.data.review.content).toBe('This is the updated review comment with sufficient length.');
      expect(response.body.data.review.title).toBe('Updated Review');
    });

    it('should not allow updating review by non-owner', async () => {
      const { user: otherUser, token: otherToken } = await createTestUser({
        ...testClientData,
        email: 'other@test.com',
        name: 'Other Client'
      });

      await request(app)
        .put(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Unauthorized Update',
          content: 'This attempt to modify should not be allowed.',
          ratings: {
            communication: 1,
            quality: 1,
            expertise: 1,
            deadlines: 1,
            cooperation: 1
          }
        })
        .expect(403);
    });
  });

  describe('DELETE /api/reviews/:reviewId', () => {
    let review;

    beforeEach(async () => {
      review = await new Review({
        author: user._id,
        authorRole: 'client',
        recipient: freelancer._id,
        recipientRole: 'freelancer',
        title: 'Review to Delete',
        content: 'This is a review comment that will be deleted.',
        ratings: {
          communication: 4,
          quality: 4,
          expertise: 4,
          deadlines: 4,
          cooperation: 4
        },
        status: 'published'
      }).save();
    });

    it('should delete a review', async () => {
      await request(app)
        .delete(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deletedReview = await Review.findById(review._id);
      expect(deletedReview).toBeNull();
    });

    it('should not allow deleting review by non-owner', async () => {
      const { user: otherUser, token: otherToken } = await createTestUser({
        ...testClientData,
        email: 'other@test.com',
        name: 'Other Client'
      });

      await request(app)
        .delete(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });
});
