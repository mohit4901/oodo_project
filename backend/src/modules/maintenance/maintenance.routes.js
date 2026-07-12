import { Router } from 'express';
import {
  createLog,
  closeLog,
  getLogs,
  getLogById,
} from './maintenance.controller.js';
import {
  validateCreateLog,
  validateCloseLog,
  validateLogId,
  validateQueryLogs,
} from './maintenance.validation.js';
import { handleValidationErrors } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Secure all maintenance routes
router.use(authenticate);

// Read-only logs access
router.get(
  '/',
  authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'),
  validateQueryLogs,
  handleValidationErrors,
  getLogs
);

router.get(
  '/:id',
  authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'),
  validateLogId,
  handleValidationErrors,
  getLogById
);

// Drivers, Fleet Managers and Admins can log/report vehicle maintenance issues
router.post(
  '/',
  authorize('admin', 'fleet_manager', 'driver'),
  validateCreateLog,
  handleValidationErrors,
  createLog
);

// Restoring status and closing logs restricted to Fleet Managers/Admins
router.put(
  '/:id/close',
  authorize('admin', 'fleet_manager'),
  validateCloseLog,
  handleValidationErrors,
  closeLog
);

export default router;
