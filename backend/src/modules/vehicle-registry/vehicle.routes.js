import { Router } from 'express';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehicleMetrics,
} from './vehicle.controller.js';
import {
  validateCreateVehicle,
  validateUpdateVehicle,
  validateVehicleId,
  validateQueryVehicles,
} from './vehicle.validation.js';
import { handleValidationErrors } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Secure all vehicle routes
router.use(authenticate);

// Read-only endpoints for all operations staff
router.get(
  '/',
  authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'),
  validateQueryVehicles,
  handleValidationErrors,
  getVehicles
);

router.get(
  '/metrics',
  authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'),
  getVehicleMetrics
);

router.get(
  '/:id',
  authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'),
  validateVehicleId,
  handleValidationErrors,
  getVehicleById
);

// Registry modifications restricted to Admins and Fleet Managers
router.post(
  '/',
  authorize('admin', 'fleet_manager'),
  validateCreateVehicle,
  handleValidationErrors,
  createVehicle
);

router.put(
  '/:id',
  authorize('admin', 'fleet_manager'),
  validateUpdateVehicle,
  handleValidationErrors,
  updateVehicle
);

router.delete(
  '/:id',
  authorize('admin', 'fleet_manager'),
  validateVehicleId,
  handleValidationErrors,
  deleteVehicle
);

export default router;
