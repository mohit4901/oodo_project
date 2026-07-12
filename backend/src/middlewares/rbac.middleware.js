import { ForbiddenError } from '../errors/ForbiddenError.js';

/**
 * Authorize specified roles
 * @param {...string} allowedRoles - List of roles permitted to access the route
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new Error('User object not found on request context. Ensure authenticate middleware runs first.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }

    next();
  };
};
export default authorize;
