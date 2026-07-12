import { User } from './auth.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { BadRequestError } from '../../errors/BadRequestError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { auditService } from '../audit/audit.service.js';

class AuthService {
  /**
   * Register a new user (Admin / Fleet Manager creation)
   */
  async register(userData, creatorId) {
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    const newUser = new User({
      ...userData,
      createdBy: creatorId,
    });

    const savedUser = await newUser.save();
    
    // Log audit trail
    await auditService.log({
      user: creatorId,
      action: 'DRIVER_CREATED', // Or generic user creation
      entity: 'User',
      entityId: savedUser._id,
      newValue: { email: savedUser.email, role: savedUser.role },
    });

    return savedUser;
  }

  /**
   * Login user and issue tokens
   */
  async login(email, password, ipAddress) {
    // Select password hash explicitly
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Log login activity
    await auditService.log({
      user: user._id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      ipAddress,
    });

    // Remove password and refresh token from output object
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotate access token using valid refresh token
   */
  async refreshAccessToken(token) {
    try {
      const decoded = verifyRefreshToken(token);
      
      const user = await User.findOne({ _id: decoded.id, isActive: true }).select('+refreshToken');
      if (!user || user.refreshToken !== token) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Generate new tokens (Rotation strategy)
      const accessToken = generateAccessToken({ id: user._id, role: user.role });
      const newRefreshToken = generateRefreshToken({ id: user._id });

      user.refreshToken = newRefreshToken;
      await user.save();

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user by clearing refresh token
   */
  async logout(userId) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = undefined;
      await user.save();

      await auditService.log({
        user: userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
      });
    }
    return true;
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new BadRequestError('Incorrect current password');
    }

    user.password = newPassword;
    user.refreshToken = undefined; // Force logout on other devices by invalidating refresh token
    await user.save();

    return true;
  }

  /**
   * Update profile fields
   */
  async updateProfile(userId, updateData) {
    // Only allow updating name and phone etc. (do not allow role/email edits here)
    const allowedUpdates = {};
    if (updateData.name) allowedUpdates.name = updateData.name;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates, updatedBy: userId },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Find user by ID (for auth middleware initialization)
   */
  async findUserById(id) {
    return await User.findById(id).lean();
  }
}

export const authService = new AuthService();
export default authService;
