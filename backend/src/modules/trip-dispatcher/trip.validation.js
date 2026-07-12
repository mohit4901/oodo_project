import { body, param, query } from 'express-validator';

export const validateCreateTrip = [
  body('source')
    .notEmpty()
    .withMessage('Source location is required')
    .isString()
    .trim(),
  body('destination')
    .notEmpty()
    .withMessage('Destination location is required')
    .isString()
    .trim(),
  body('vehicle')
    .notEmpty()
    .withMessage('Vehicle reference is required')
    .isMongoId()
    .withMessage('Invalid vehicle ID format'),
  body('driver')
    .notEmpty()
    .withMessage('Driver reference is required')
    .isMongoId()
    .withMessage('Invalid driver ID format'),
  body('cargoWeight')
    .notEmpty()
    .withMessage('Cargo weight is required')
    .isFloat({ min: 0.1 })
    .withMessage('Cargo weight must be a positive number greater than 0'),
  body('plannedDistance')
    .notEmpty()
    .withMessage('Planned distance is required')
    .isFloat({ min: 0.1 })
    .withMessage('Planned distance must be a positive number greater than 0'),
  body('revenue')
    .notEmpty()
    .withMessage('Revenue payout is required')
    .isFloat({ min: 0 })
    .withMessage('Revenue must be a positive number'),
];

export const validateCompleteTrip = [
  param('id')
    .isMongoId()
    .withMessage('Invalid trip ID format'),
  body('actualDistance')
    .notEmpty()
    .withMessage('Actual distance traveled is required')
    .isFloat({ min: 0 })
    .withMessage('Actual distance must be a positive number'),
  body('liters')
    .notEmpty()
    .withMessage('Fuel consumed in liters is required')
    .isFloat({ min: 0 })
    .withMessage('Liters consumed must be a positive number'),
  body('fuelCost')
    .notEmpty()
    .withMessage('Fuel cost is required')
    .isFloat({ min: 0 })
    .withMessage('Fuel cost must be a positive number'),
];

export const validateTripId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid trip ID format'),
];

export const validateQueryTrips = [
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
    .isIn(['Draft', 'Dispatched', 'Completed', 'Cancelled'])
    .withMessage('Invalid status filter'),
];
