import { Router } from 'express';
import {
  createTrip,
  getTrips,
  getTripById,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from './trip.controller.js';
import {
  validateCreateTrip,
  validateCompleteTrip,
  validateTripId,
  validateQueryTrips,
} from './trip.validation.js';
import { handleValidationErrors } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Secure all trip routes
router.use(authenticate);

// Read actions open to all authenticated roles
router.get(
  '/',
  authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'),
  validateQueryTrips,
  handleValidationErrors,
  getTrips
);

router.get(
  '/:id',
  authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'),
  validateTripId,
  handleValidationErrors,
  getTripById
);

// Trip modifications (Create, Dispatch, Cancel) restricted to managers and dispatchers
router.post(
  '/',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  validateCreateTrip,
  handleValidationErrors,
  createTrip
);

router.post(
  '/:id/dispatch',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  validateTripId,
  handleValidationErrors,
  dispatchTrip
);

router.post(
  '/:id/cancel',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  validateTripId,
  handleValidationErrors,
  cancelTrip
);

// Drivers can also mark their assigned trip as Completed
router.post(
  '/:id/complete',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  validateCompleteTrip,
  handleValidationErrors,
  completeTrip
);

export default router;
