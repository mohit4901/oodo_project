import { logger } from '../config/logger.js';

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;

  // Log full stack trace in development, only error message in production
  if (process.env.NODE_ENV === 'production') {
    logger.error(`${err.message} - Status: ${err.statusCode}`);
  } else {
    logger.error(`${err.message} - Stack: ${err.stack}`);
  }

  // 1. Mongoose Bad ObjectId (Cast Error)
  if (err.name === 'CastError') {
    const message = `Invalid format for field: ${err.path}`;
    error = { statusCode: 400, message };
  }

  // 2. Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const key = Object.keys(err.keyValue)[0];
    const value = err.keyValue[key];
    const message = `Duplicate value error: ${key} '${value}' already exists.`;
    error = { statusCode: 409, message };
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errorsList = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
    error = { statusCode: 400, message: 'Database validation failed', errors: errorsList };
  }

  // 4. JWT Expiration Error
  if (err.name === 'TokenExpiredError') {
    error = { statusCode: 401, message: 'Authentication token has expired' };
  }

  // 5. JWT Invalid Signature Error
  if (err.name === 'JsonWebTokenError') {
    error = { statusCode: 401, message: 'Invalid authentication token signature' };
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || null;

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
};
