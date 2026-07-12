import { body, query, param } from 'express-validator';

export const validateCreateDriver = [
  body('name')
    .notEmpty()
    .withMessage('Driver name is required')
    .isString()
    .trim(),
  body('licenseNumber')
    .notEmpty()
    .withMessage('License number is required')
    .isString()
    .trim(),
  body('licenseCategory')
    .notEmpty()
    .withMessage('License category is required')
    .isIn(['Heavy Duty', 'Light Vehicle', 'Commercial'])
    .withMessage('License category must be Heavy Duty, Light Vehicle, or Commercial'),
  body('licenseExpiryDate')
    .notEmpty()
    .withMessage('License expiry date is required')
    .isISO8601()
    .withMessage('License expiry date must be a valid ISO8601 date format'),
  body('contactNumber')
    .notEmpty()
    .withMessage('Contact number is required')
    .isString()
    .trim(),
  body('safetyScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Safety score must be a number between 0 and 100'),
];

export const validateUpdateDriver = [
  param('id')
    .isMongoId()
    .withMessage('Invalid driver ID format'),
  body('name')
    .optional()
    .isString()
    .trim(),
  body('licenseNumber')
    .optional()
    .isString()
    .trim(),
  body('licenseCategory')
    .optional()
    .isIn(['Heavy Duty', 'Light Vehicle', 'Commercial'])
    .withMessage('License category must be Heavy Duty, Light Vehicle, or Commercial'),
  body('licenseExpiryDate')
    .optional()
    .isISO8601()
    .withMessage('License expiry date must be a valid ISO8601 date'),
  body('contactNumber')
    .optional()
    .isString()
    .trim(),
  body('safetyScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Safety score must be a number between 0 and 100'),
  body('status')
    .optional()
    .isIn(['Available', 'On Trip', 'Off Duty', 'Suspended'])
    .withMessage('Status must be Available, On Trip, Off Duty, or Suspended'),
];

export const validateDriverId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid driver ID format'),
];

export const validateQueryDrivers = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('status')
    .optional()
    .isIn(['Available', 'On Trip', 'Off Duty', 'Suspended'])
    .withMessage('Invalid status filter'),
  query('licenseCategory')
    .optional()
    .isIn(['Heavy Duty', 'Light Vehicle', 'Commercial'])
    .withMessage('Invalid license category filter'),
  query('isExpired')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isExpired filter must be true or false'),
];
