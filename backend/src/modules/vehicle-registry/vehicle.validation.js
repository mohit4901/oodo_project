import { body, query, param } from 'express-validator';

export const validateCreateVehicle = [
  body('registrationNumber')
    .notEmpty()
    .withMessage('Registration number is required')
    .isString()
    .withMessage('Registration number must be a valid string')
    .trim(),
  body('vehicleName')
    .notEmpty()
    .withMessage('Vehicle name/model is required')
    .isString()
    .trim(),
  body('type')
    .notEmpty()
    .withMessage('Vehicle type is required')
    .isIn(['Truck', 'Van', 'Trailer', 'Utility'])
    .withMessage('Type must be Truck, Van, Trailer, or Utility'),
  body('maxLoadCapacity')
    .notEmpty()
    .withMessage('Maximum load capacity is required')
    .isFloat({ min: 0 })
    .withMessage('Cargo weight capacity must be a positive number'),
  body('odometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Odometer reading must be a positive number'),
  body('acquisitionCost')
    .notEmpty()
    .withMessage('Acquisition cost is required')
    .isFloat({ min: 0 })
    .withMessage('Acquisition cost must be a positive number'),
  body('region')
    .notEmpty()
    .withMessage('Region is required')
    .isIn(['North', 'South', 'East', 'West', 'Central'])
    .withMessage('Region must be North, South, East, West, or Central'),
];

export const validateUpdateVehicle = [
  param('id')
    .isMongoId()
    .withMessage('Invalid vehicle ID format'),
  body('registrationNumber')
    .optional()
    .isString()
    .trim(),
  body('vehicleName')
    .optional()
    .isString()
    .trim(),
  body('type')
    .optional()
    .isIn(['Truck', 'Van', 'Trailer', 'Utility'])
    .withMessage('Type must be Truck, Van, Trailer, or Utility'),
  body('maxLoadCapacity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cargo weight capacity must be a positive number'),
  body('odometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Odometer reading must be a positive number'),
  body('acquisitionCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Acquisition cost must be a positive number'),
  body('region')
    .optional()
    .isIn(['North', 'South', 'East', 'West', 'Central'])
    .withMessage('Region must be North, South, East, West, or Central'),
  body('status')
    .optional()
    .isIn(['Available', 'On Trip', 'In Shop', 'Retired'])
    .withMessage('Status must be Available, On Trip, In Shop, or Retired'),
];

export const validateVehicleId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid vehicle ID format'),
];

export const validateQueryVehicles = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('type')
    .optional()
    .isIn(['Truck', 'Van', 'Trailer', 'Utility'])
    .withMessage('Invalid type filter'),
  query('status')
    .optional()
    .isIn(['Available', 'On Trip', 'In Shop', 'Retired'])
    .withMessage('Invalid status filter'),
  query('region')
    .optional()
    .isIn(['North', 'South', 'East', 'West', 'Central'])
    .withMessage('Invalid region filter'),
];
