import { body } from 'express-validator';

export const validateUpdatePermissions = [
  body('roleName')
    .notEmpty()
    .withMessage('Role name is required')
    .isIn(['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'])
    .withMessage('Invalid role name'),
  body('permissions')
    .notEmpty()
    .withMessage('Permissions list is required')
    .isArray()
    .withMessage('Permissions must be provided as an array of strings'),
];
