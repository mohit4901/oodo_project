import { verifyAccessToken } from '../utils/jwt.js';
import { authService } from '../modules/auth/auth.service.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const authenticate = catchAsync(async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Fallback check for token in cookies
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new UnauthorizedError('Authentication token is missing. Please log in.');
  }

  try {
    // Verify token validity
    const decoded = verifyAccessToken(token);
    
    // Find active user profile
    const currentUser = await authService.findUserById(decoded.id);
    if (!currentUser) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists in the database.'));
    }

    if (!currentUser.isActive) {
      return next(new UnauthorizedError('This account has been deactivated.'));
    }

    // Attach user information to request object
    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    return next(new UnauthorizedError('Invalid or expired authentication token. Please login again.'));
  }
});
export default authenticate;
