import { body } from 'express-validator';

export const validateRegister = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'])
    .withMessage('Invalid role value'),
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

export const validateUpdateProfile = [
  body('name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters')
    .trim(),
];
