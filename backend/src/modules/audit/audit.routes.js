import { Router } from 'express';
import { getAuditLogs } from './audit.controller.js';
import { validateGetAuditLogs } from './audit.validation.js';
import { handleValidationErrors } from '../../middlewares/validate.middleware.js';

// Note: Auth/RBAC middlewares will be imported and wired up in this router once the Auth module is completed.
const router = Router();

router.get(
  '/',
  validateGetAuditLogs,
  handleValidationErrors,
  getAuditLogs
);

export default router;
