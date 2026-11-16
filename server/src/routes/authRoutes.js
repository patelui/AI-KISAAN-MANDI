import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { profilePhotoUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', requireAuth, getProfile);
router.put(
  '/profile',
  requireAuth,
  profilePhotoUpload('profilePhoto'),
  updateProfile
);

export default router;
