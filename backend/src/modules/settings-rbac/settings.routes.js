import { Router } from 'express';
import {
  getRoles,
  updateRolePermissions,
  triggerSeedRoles,
} from './settings.controller.js';
import { validateUpdatePermissions } from './settings.validation.js';
import { handleValidationErrors } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';

const router = Router();

// Secure all settings paths
router.use(authenticate);

router.get(
  '/roles',
  authorize('admin', 'fleet_manager'),
  getRoles
);

router.put(
  '/permissions',
  authorize('admin'),
  validateUpdatePermissions,
  handleValidationErrors,
  updateRolePermissions
);

router.post(
  '/seed',
  authorize('admin'),
  triggerSeedRoles
);

export default router;
