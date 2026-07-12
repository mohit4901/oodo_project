import { Router } from 'express';
import {
  logFuel,
  logExpense,
  getFuelLogs,
  getExpenses,
  getVehicleTotalCost,
} from './expense.controller.js';
import {
  validateLogFuel,
  validateLogExpense,
  validateVehicleCostParams,
  validateQueryFuelLogs,
  validateQueryExpenses,
} from './expense.validation.js';
import { handleValidationErrors } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Secure all expense routes
router.use(authenticate);

// Read-only queries accessible to operation managers and financial analysts
router.get(
  '/fuel',
  authorize('admin', 'fleet_manager', 'dispatcher', 'financial_analyst'),
  validateQueryFuelLogs,
  handleValidationErrors,
  getFuelLogs
);

router.get(
  '/',
  authorize('admin', 'fleet_manager', 'dispatcher', 'financial_analyst'),
  validateQueryExpenses,
  handleValidationErrors,
  getExpenses
);

router.get(
  '/vehicle/:vehicleId/total-cost',
  authorize('admin', 'fleet_manager', 'financial_analyst'),
  validateVehicleCostParams,
  handleValidationErrors,
  getVehicleTotalCost
);

// Drivers and managers can submit fuel entries
router.post(
  '/fuel',
  authorize('admin', 'fleet_manager', 'driver'),
  validateLogFuel,
  handleValidationErrors,
  logFuel
);

// General expenses restricted to Financial Analysts and Fleet Managers
router.post(
  '/',
  authorize('admin', 'fleet_manager', 'financial_analyst'),
  validateLogExpense,
  handleValidationErrors,
  logExpense
);

export default router;
