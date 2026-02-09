import { Router } from 'express';
import { body, query } from 'express-validator';
import * as shopController from '../controllers/shopController';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// Get nearby shops (public or authenticated)
router.get(
  '/',
  validate([
    query('lat').notEmpty().isFloat().withMessage('Valid latitude is required'),
    query('lng').notEmpty().isFloat().withMessage('Valid longitude is required'),
    query('radius').optional().isFloat({ min: 1, max: 100 }),
    query('category').optional().isString(),
  ]),
  shopController.getNearbyShops
);

// Get shop by ID (public or authenticated)
router.get('/:id', shopController.getShopById);

// Create shop (mechanic only)
router.post(
  '/',
  authenticateToken,
  requireRole('mechanic'),
  validate([
    body('name').trim().notEmpty().withMessage('Shop name is required'),
    body('latitude').isFloat().withMessage('Valid latitude is required'),
    body('longitude').isFloat().withMessage('Valid longitude is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('categories').isArray().withMessage('Categories must be an array'),
  ]),
  shopController.createShop
);

// Update shop (owner only)
router.put(
  '/:id',
  authenticateToken,
  requireRole('mechanic'),
  validate([
    body('name').optional().trim().notEmpty(),
    body('address').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('categories').optional().isArray(),
  ]),
  shopController.updateShop
);

// Update availability (owner only)
router.patch(
  '/:id/availability',
  authenticateToken,
  requireRole('mechanic'),
  validate([
    body('is_open').isBoolean().withMessage('is_open must be a boolean'),
  ]),
  shopController.updateAvailability
);

// Delete shop (owner only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole('mechanic'),
  shopController.deleteShop
);

export default router;
