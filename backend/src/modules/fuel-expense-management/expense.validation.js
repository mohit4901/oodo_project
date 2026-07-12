import { body, query, param } from 'express-validator';

export const validateLogFuel = [
  body('vehicle')
    .notEmpty()
    .withMessage('Vehicle ID reference is required')
    .isMongoId()
    .withMessage('Invalid vehicle ID format'),
  body('liters')
    .notEmpty()
    .withMessage('Fuel consumed in liters is required')
    .isFloat({ min: 0.1 })
    .withMessage('Liters must be a positive number greater than 0'),
  body('cost')
    .notEmpty()
    .withMessage('Fuel purchase cost is required')
    .isFloat({ min: 0.1 })
    .withMessage('Cost must be a positive number greater than 0'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in a valid ISO8601 format'),
  body('trip')
    .optional()
    .isMongoId()
    .withMessage('Invalid trip ID format'),
];

export const validateLogExpense = [
  body('vehicle')
    .notEmpty()
    .withMessage('Vehicle ID reference is required')
    .isMongoId()
    .withMessage('Invalid vehicle ID format'),
  body('category')
    .notEmpty()
    .withMessage('Expense category is required')
    .isIn(['Fuel', 'Maintenance', 'Tolls', 'Repair', 'Insurance', 'Driver Payout', 'Other'])
    .withMessage('Invalid expense category'),
  body('cost')
    .notEmpty()
    .withMessage('Expense cost is required')
    .isFloat({ min: 0.01 })
    .withMessage('Cost must be a positive number'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in a valid ISO8601 format'),
  body('description')
    .optional()
    .isString()
    .trim(),
];

export const validateVehicleCostParams = [
  param('vehicleId')
    .isMongoId()
    .withMessage('Invalid vehicle ID format'),
];

export const validateQueryFuelLogs = [
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
];

export const validateQueryExpenses = [
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
  query('category')
    .optional()
    .isIn(['Fuel', 'Maintenance', 'Tolls', 'Repair', 'Insurance', 'Driver Payout', 'Other'])
    .withMessage('Invalid expense category filter'),
];
