import { query } from 'express-validator';

export const validateReportFilters = [
  query('type')
    .optional()
    .isIn(['Truck', 'Van', 'Trailer', 'Utility'])
    .withMessage('Vehicle type must be Truck, Van, Trailer, or Utility'),
  query('region')
    .optional()
    .isIn(['North', 'South', 'East', 'West', 'Central'])
    .withMessage('Region must be North, South, East, West, or Central'),
];
