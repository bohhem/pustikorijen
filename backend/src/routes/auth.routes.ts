import { Router } from 'express';
import {
  register,
  login,
  refresh,
  getProfile,
  updateProfile,
  changePassword,
  socialLogin,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/social', socialLogin);

// Protected routes (require authentication)
router.get('/me', authenticateToken, getProfile);
router.patch('/me', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);

export default router;
