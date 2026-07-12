import { query } from 'express-validator';

export const validateDashboardFilters = [
  query('vehicleType')
    .optional()
    .isIn(['Truck', 'Van', 'Trailer', 'Utility'])
    .withMessage('Vehicle type must be Truck, Van, Trailer, or Utility'),
  query('region')
    .optional()
    .isIn(['North', 'South', 'East', 'West', 'Central'])
    .withMessage('Region must be North, South, East, West, or Central'),
  query('status')
    .optional()
    .isIn(['Available', 'On Trip', 'In Shop', 'Retired'])
    .withMessage('Status must be Available, On Trip, In Shop, or Retired'),
];
