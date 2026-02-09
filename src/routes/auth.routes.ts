import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// Register
router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['customer', 'mechanic']).withMessage('Role must be customer or mechanic'),
  ]),
  authController.register
);

// Login
router.post(
  '/login',
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
