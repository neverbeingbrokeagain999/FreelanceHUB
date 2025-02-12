import express from 'express';
import { body, param, query } from 'express-validator';
import { upload } from '../middleware/upload.js';
import { protect as auth } from '../middleware/auth.js';
import { validate } from '../middleware/validation/validator.js';
import * as userController from '../controllers/userController.js';
import * as clientController from '../controllers/clientController.js';
import * as freelancerController from '../controllers/freelancerController.js';

const router = express.Router();

// Basic user routes
router.get('/profile', auth, userController.getProfile);

router.put('/profile',
  auth,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('phone').optional().matches(/^\+?[\d\s-]{8,20}$/).withMessage('Invalid phone number format'),
    body('bio').optional().trim().isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),
    validate
  ],
  userController.updateProfile
);

router.get('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    validate
  ],
  userController.getUserById
);

router.get('/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('role').optional().isIn(['client', 'freelancer', 'admin']).withMessage('Invalid role'),
    validate
  ],
  userController.getAllUsers
);

router.delete('/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    validate
  ],
  userController.deleteUser
);

// Client routes
router.get('/client/profile/:id?',
  auth,
  [
    param('id').optional().isMongoId().withMessage('Invalid client ID'),
    validate
  ],
  clientController.getClientProfile
);

router.put('/client/profile',
  auth,
  upload.single('profilePicture'),
  [
    body('companyName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters'),
    body('industry').optional().trim().notEmpty().withMessage('Industry is required'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    body('website').optional().isURL().withMessage('Must be a valid URL'),
    validate
  ],
  clientController.updateClientProfile
);

router.get('/client/:id/history',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid client ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validate
  ],
  clientController.getClientHiringHistory
);

router.get('/client/:id/stats',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid client ID'),
    validate
  ],
  clientController.getClientStats
);

// Freelancer routes
router.get('/freelancer/:id?',
  auth,
  [
    param('id').optional().isMongoId().withMessage('Invalid freelancer ID'),
    validate
  ],
  freelancerController.getFreelancerProfile
);

router.put('/freelancer/profile',
  auth,
  upload.single('profilePicture'),
  [
    body('title').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters'),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('skills.*').isString().trim().notEmpty().withMessage('Each skill must be a non-empty string'),
    body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
    body('availability').optional().isIn(['full-time', 'part-time', 'contract']).withMessage('Invalid availability'),
    validate
  ],
  freelancerController.updateFreelancerProfile
);

router.post('/freelancer/:id/endorsements',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid freelancer ID'),
    body('skill').trim().notEmpty().withMessage('Skill is required'),
    validate
  ],
  freelancerController.addSkillEndorsement
);

router.get('/freelancer/:id/endorsements',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid freelancer ID'),
    validate
  ],
  freelancerController.getSkillEndorsements
);

router.post('/freelancer/:id/testimonials',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid freelancer ID'),
    body('content').trim().isLength({ min: 10, max: 1000 }).withMessage('Testimonial must be between 10 and 1000 characters'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    validate
  ],
  freelancerController.addTestimonial
);

router.get('/freelancer/:id/testimonials',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid freelancer ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    validate
  ],
  freelancerController.getTestimonials
);

export default router;
