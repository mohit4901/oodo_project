import { catchAsync } from '../../utils/catchAsync.js';
import { settingsService } from './settings.service.js';

export const getRoles = catchAsync(async (req, res) => {
  const roles = await settingsService.getRoles();

  res.status(200).json({
    success: true,
    message: 'Roles and permission mapping retrieved successfully',
    data: roles,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const updateRolePermissions = catchAsync(async (req, res) => {
  const { roleName, permissions } = req.body;
  const role = await settingsService.updateRolePermissions(roleName, permissions, req.user._id);

  res.status(200).json({
    success: true,
    message: `Permissions updated successfully for role: ${roleName}`,
    data: role,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const triggerSeedRoles = catchAsync(async (req, res) => {
  await settingsService.seedRoles();

  res.status(200).json({
    success: true,
    message: 'Roles database successfully seeded with system default settings.',
    data: null,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});
