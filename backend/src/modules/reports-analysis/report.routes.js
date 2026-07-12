import { Router } from 'express';
import {
  getPerformanceReport,
  exportPerformanceReportCSV,
} from './report.controller.js';
import { validateReportFilters } from './report.validation.js';
import { handleValidationErrors } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Secure all reports paths
router.use(authenticate);

router.get(
  '/',
  authorize('admin', 'fleet_manager', 'financial_analyst', 'safety_officer', 'dispatcher'),
  validateReportFilters,
  handleValidationErrors,
  getPerformanceReport
);

router.get(
  '/export',
  authorize('admin', 'fleet_manager', 'financial_analyst'),
  validateReportFilters,
  handleValidationErrors,
  exportPerformanceReportCSV
);

export default router;
