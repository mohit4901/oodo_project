import { Router } from 'express';
import { getDashboardSummary } from './dashboard.controller.js';
import { validateDashboardFilters } from './dashboard.validation.js';
import { handleValidationErrors } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst'),
  validateDashboardFilters,
  handleValidationErrors,
  getDashboardSummary
);

export default router;
