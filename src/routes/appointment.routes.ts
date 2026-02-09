import { Router } from 'express';
import { body } from 'express-validator';
import * as appointmentController from '../controllers/appointmentController';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// All appointment routes require authentication
router.use(authenticateToken);

// Get appointments (filtered by user role)
router.get('/', appointmentController.getAppointments);

// Get appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// Create appointment (customer only)
router.post(
  '/',
  validate([
    body('shop_id').notEmpty().isUUID().withMessage('Valid shop_id is required'),
    body('car_model').trim().notEmpty().withMessage('Car model is required'),
    body('appointment_date').isISO8601().withMessage('Valid appointment date is required'),
    body('service_type').trim().notEmpty().withMessage('Service type is required'),
    body('note').optional().trim(),
  ]),
  appointmentController.createAppointment
);

// Update appointment status (mechanic or customer)
router.patch(
  '/:id',
  validate([
    body('status')
      .isIn(['pending', 'confirmed', 'rejected', 'completed'])
      .withMessage('Invalid status'),
  ]),
  appointmentController.updateAppointmentStatus
);

// Delete appointment (customer only - their own)
router.delete('/:id', appointmentController.deleteAppointment);

export default router;
