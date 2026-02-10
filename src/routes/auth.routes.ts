import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { registerLimiter, loginLimiter } from '../middlewares/rateLimiter';
import { verifyCaptcha } from '../middlewares/captcha.middleware';

const router = Router();

// Register
router.post(
  '/register',
  registerLimiter,
  verifyCaptcha,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['customer', 'mechanic']).withMessage('Role must be customer or mechanic'),
    body('phone')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^0[0-9]{10}$/).withMessage('Phone must be 11 digits starting with 0 (e.g., 05551234567)'),
    body('phone_visible').optional().isBoolean().withMessage('Phone visible must be boolean'),
    // Mechanic-specific validation
    body('shop_name').if(body('role').equals('mechanic')).notEmpty().withMessage('Shop name required for mechanics'),
    body('address').if(body('role').equals('mechanic')).notEmpty().withMessage('Address required for mechanics'),
    body('latitude').if(body('role').equals('mechanic')).isFloat().withMessage('Valid latitude required'),
    body('longitude').if(body('role').equals('mechanic')).isFloat().withMessage('Valid longitude required'),
    body('categories').if(body('role').equals('mechanic')).isArray().withMessage('Categories must be an array'),
    body('working_hours').if(body('role').equals('mechanic')).optional().isObject().withMessage('Working hours must be an object'),
  ]),
  authController.register
);

// Login
router.post(
  '/login',
  loginLimiter,
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

// Get current user (protected)
router.get('/me', authenticateToken, authController.getCurrentUser);

// Update profile (protected)
router.put(
  '/profile',
  authenticateToken,
  validate([
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('avatar_url').optional().isURL(),
  ]),
  authController.updateProfile
);

export default router;
