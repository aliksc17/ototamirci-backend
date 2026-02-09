import { Router } from 'express';
import { body } from 'express-validator';
import * as reviewController from '../controllers/reviewController';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// Get reviews for a shop (public)
router.get('/:shopId', reviewController.getShopReviews);

// Create/update review (authenticated customer only)
router.post(
  '/:shopId',
  authenticateToken,
  validate([
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim(),
  ]),
  reviewController.createReview
);

export default router;
