import { catchAsync } from '../../utils/catchAsync.js';
import { authService } from './auth.service.js';

/**
 * Handle user registration
 */
export const register = catchAsync(async (req, res) => {
  const newUser = await authService.register(req.body, req.user ? req.user._id : null);
  
  const userObj = newUser.toObject();
  delete userObj.password;

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: userObj,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Handle user login
 */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.socket.remoteAddress;

  const { user, accessToken, refreshToken } = await authService.login(email, password, ipAddress);

  // Store refresh token in secure cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      accessToken,
    },
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Handle refresh token rotation
 */
export const refreshToken = catchAsync(async (req, res) => {
  // Get refresh token from cookie or request body
  const token = req.cookies.refreshToken || req.body.refreshToken;

  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(token);

  // Store new refresh token in cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: 'Access token refreshed successfully',
    data: {
      accessToken,
    },
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Handle user logout
 */
export const logout = catchAsync(async (req, res) => {
  if (req.user) {
    await authService.logout(req.user._id);
  }

  // Clear cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
    data: null,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Retrieve current user profile
 */
export const getCurrentUser = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Current user retrieved successfully',
    data: req.user,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Handle password changes
 */
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, currentPassword, newPassword);

  // Clear cookie since refresh token was invalidated
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
    data: null,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Update user profile
 */
export const updateProfile = catchAsync(async (req, res) => {
  const updatedUser = await authService.updateProfile(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});
