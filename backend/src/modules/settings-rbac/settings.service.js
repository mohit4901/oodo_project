import { Role } from './role.model.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { auditService } from '../audit/audit.service.js';

class SettingsService {
  /**
   * Seed standard roles and permissions if database is empty
   */
  async seedRoles() {
    const count = await Role.countDocuments();
    if (count > 0) return;

    const defaultRoles = [
      {
        roleName: 'admin',
        description: 'Administrator with full system privileges',
        permissions: ['*'], // wildcard indicates all actions allowed
      },
      {
        roleName: 'fleet_manager',
        description: 'Oversees fleet vehicle registry, dispatch, and maintenance',
        permissions: [
          'read_vehicles',
          'write_vehicles',
          'read_drivers',
          'read_trips',
          'write_trips',
          'read_maintenance',
          'write_maintenance',
          'read_expenses',
          'write_expenses',
          'read_reports',
        ],
      },
      {
        roleName: 'dispatcher',
        description: 'Manages trip bookings, driver allocations, and active dispatches',
        permissions: [
          'read_vehicles',
          'read_drivers',
          'read_trips',
          'write_trips',
          'read_maintenance',
          'read_expenses',
        ],
      },
      {
        roleName: 'safety_officer',
        description: 'Ensures driver compliance and safety score reviews',
        permissions: [
          'read_vehicles',
          'read_drivers',
          'write_drivers',
          'read_trips',
          'read_maintenance',
          'read_reports',
        ],
      },
      {
        roleName: 'financial_analyst',
        description: 'Reviews operational cash expenses and fuel logging metrics',
        permissions: [
          'read_vehicles',
          'read_drivers',
          'read_trips',
          'read_expenses',
          'write_expenses',
          'read_reports',
        ],
      },
      {
        roleName: 'driver',
        description: 'Vehicle operator with access to assigned routes and fuel logs',
        permissions: [
          'read_trips',
          'read_maintenance',
          'write_maintenance',
          'write_expenses',
        ],
      },
    ];

    await Role.insertMany(defaultRoles);
  }

  /**
   * Retrieve all roles and permissions
   */
  async getRoles() {
    return await Role.find().lean();
  }

  /**
   * Update permissions associated with a specific role
   */
  async updateRolePermissions(roleName, permissions, userId) {
    const role = await Role.findOne({ roleName });
    if (!role) {
      throw new NotFoundError(`Role '${roleName}' not found`);
    }

    const oldPermissions = [...role.permissions];
    role.permissions = permissions;
    role.updatedBy = userId;
    await role.save();

    await auditService.log({
      user: userId,
      action: 'VEHICLE_UPDATED', // General update audit
      entity: 'Role',
      entityId: role._id,
      oldValue: oldPermissions,
      newValue: permissions,
    });

    return role;
  }

  /**
   * Check if a role possesses a specific permission
   */
  async checkPermission(roleName, requiredPermission) {
    const role = await Role.findOne({ roleName }).lean();
    if (!role) return false;

    // Wildcard matches all permissions
    if (role.permissions.includes('*')) return true;

    return role.permissions.includes(requiredPermission);
  }
}

export const settingsService = new SettingsService();
export default settingsService;
