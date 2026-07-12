import { Router } from 'express';
import {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  getDriverSafetyStats,
} from './driver.controller.js';
import {
  validateCreateDriver,
  validateUpdateDriver,
  validateDriverId,
  validateQueryDrivers,
} from './driver.validation.js';
import { handleValidationErrors } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Secure all driver routes
router.use(authenticate);

// Read endpoints accessible to all operators
router.get(
  '/',
  authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'),
  validateQueryDrivers,
  handleValidationErrors,
  getDrivers
);

router.get(
  '/safety-summary',
  authorize('admin', 'fleet_manager', 'safety_officer'),
  getDriverSafetyStats
);

router.get(
  '/:id',
  authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'),
  validateDriverId,
  handleValidationErrors,
  getDriverById
);

// Drivers modifications restricted to Safety Officers and Admins
router.post(
  '/',
  authorize('admin', 'safety_officer'),
  validateCreateDriver,
  handleValidationErrors,
  createDriver
);

router.put(
  '/:id',
  authorize('admin', 'safety_officer'),
  validateUpdateDriver,
  handleValidationErrors,
  updateDriver
);

router.delete(
  '/:id',
  authorize('admin', 'safety_officer'),
  validateDriverId,
  handleValidationErrors,
  deleteDriver
);

export default router;
