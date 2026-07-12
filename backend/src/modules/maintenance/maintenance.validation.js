import { body, param, query } from 'express-validator';

export const validateCreateLog = [
  body('vehicle')
    .notEmpty()
    .withMessage('Vehicle ID reference is required')
    .isMongoId()
    .withMessage('Invalid vehicle ID format'),
  body('description')
    .notEmpty()
    .withMessage('Maintenance description is required')
    .isString()
    .trim(),
  body('maintenanceType')
    .notEmpty()
    .withMessage('Maintenance type is required')
    .isIn(['Routine', 'Breakdown', 'Inspection', 'Repair'])
    .withMessage('Type must be Routine, Breakdown, Inspection, or Repair'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
];

export const validateCloseLog = [
  param('id')
    .isMongoId()
    .withMessage('Invalid log ID format'),
  body('cost')
    .notEmpty()
    .withMessage('Closing maintenance cost is required')
    .isFloat({ min: 0 })
    .withMessage('Maintenance cost must be a positive number'),
  body('description')
    .optional()
    .isString()
    .trim(),
];

export const validateLogId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid log ID format'),
];

export const validateQueryLogs = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('vehicleId')
    .optional()
    .isMongoId()
    .withMessage('Invalid vehicle filter ID format'),
  query('status')
    .optional()
    .isIn(['Active', 'Completed'])
    .withMessage('Invalid status filter'),
];
