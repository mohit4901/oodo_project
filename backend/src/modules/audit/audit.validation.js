import { query } from 'express-validator';

export const validateGetAuditLogs = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page number must be an integer greater than 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('action')
    .optional()
    .isString()
    .withMessage('Action filter must be a valid string identifier'),
  query('entity')
    .optional()
    .isString()
    .withMessage('Entity type filter must be a valid string'),
];
