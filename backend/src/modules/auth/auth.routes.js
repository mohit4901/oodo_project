import { Router } from 'express';
import {
  login,
  register,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword,
  updateProfile,
} from './auth.controller.js';
import {
  validateLogin,
  validateRegister,
  validateChangePassword,
  validateUpdateProfile,
} from './auth.validation.js';
import { handleValidationErrors } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { rateLimiter } from '../../middlewares/rate-limiter.js';

const router = Router();

// Public routes (rate limited to prevent brute forcing)
router.post('/login', rateLimiter, validateLogin, handleValidationErrors, login);
router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/refresh', rateLimiter, refreshToken);

// Authenticated routes
router.use(authenticate);

router.post('/logout', logout);
router.get('/me', getCurrentUser);
router.put('/change-password', validateChangePassword, handleValidationErrors, changePassword);
router.put('/profile', validateUpdateProfile, handleValidationErrors, updateProfile);

export default router;
