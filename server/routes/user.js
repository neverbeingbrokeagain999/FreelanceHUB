import express from 'express';
import { upload } from '../middleware/upload.js';
import { protect as auth } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';
import * as clientController from '../controllers/clientController.js';
import * as freelancerController from '../controllers/freelancerController.js';

const router = express.Router();

// Basic user routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.get('/:id', auth, userController.getUserById);
router.get('/', auth, userController.getAllUsers);
router.delete('/:id', auth, userController.deleteUser);

// Client routes
router.get('/client/profile/:id?', auth, clientController.getClientProfile);
router.put('/client/profile', auth, upload.single('profilePicture'), clientController.updateClientProfile);
router.get('/client/:id/history', auth, clientController.getClientHiringHistory);
router.get('/client/:id/stats', auth, clientController.getClientStats);

// Freelancer routes
router.get('/freelancer/:id?', auth, freelancerController.getFreelancerProfile);
router.put('/freelancer/profile', auth, upload.single('profilePicture'), freelancerController.updateFreelancerProfile);
router.post('/freelancer/:id/endorsements', auth, freelancerController.addSkillEndorsement);
router.get('/freelancer/:id/endorsements', auth, freelancerController.getSkillEndorsements);
router.post('/freelancer/:id/testimonials', auth, freelancerController.addTestimonial);
router.get('/freelancer/:id/testimonials', auth, freelancerController.getTestimonials);

export default router;
