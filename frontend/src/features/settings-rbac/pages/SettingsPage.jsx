import React, { useState, useEffect } from 'react';
import { useSettingsRoles, useUpdatePermissions } from '../hooks/useSettings.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import { Shield, Save, AlertTriangle, Info } from 'lucide-react';

const PERMISSION_GROUPS = {
  Vehicles: [
    { value: 'read_vehicles', label: 'View Vehicle Registry' },
    { value: 'write_vehicles', label: 'Modify/Register Vehicles' },
  ],
  Drivers: [
    { value: 'read_drivers', label: 'View Driver Profiles' },
    { value: 'write_drivers', label: 'Modify/Register Drivers' },
  ],
  Trips: [
    { value: 'read_trips', label: 'View Trips Board' },
    { value: 'write_trips', label: 'Book & Dispatch Trips' },
  ],
  Maintenance: [
    { value: 'read_maintenance', label: 'View Maintenance Logs' },
    { value: 'write_maintenance', label: 'Log/Close Maintenance Shop Entries' },
  ],
  Expenses: [
    { value: 'read_expenses', label: 'View Fuel/Expense Ledger' },
    { value: 'write_expenses', label: 'Log Expenses & Fuel Purchases' },
  ],
  Reports: [
    { value: 'read_reports', label: 'View ROI & Analytics Reports' },
    { value: 'write_reports', label: 'Export Ledger Reports to CSV' },
  ],
  Settings: [
    { value: 'read_settings', label: 'View System Access Roles' },
    { value: 'write_settings', label: 'Modify Role Access Permissions (RBAC)' },
  ],
};

export const SettingsPage = () => {
  const { user } = useAuth();
  const { data: rolesData, isLoading } = useSettingsRoles();
  const { mutate: updatePermissions, isPending: isUpdating } = useUpdatePermissions();

  const [selectedRole, setSelectedRole] = useState(null);
  const [checkedPermissions, setCheckedPermissions] = useState([]);

  const roles = rolesData || [];

  // Set initial selected role when roles fetch completes
  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0]);
      setCheckedPermissions(roles[0].permissions || []);
    }
  }, [roles, selectedRole]);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setCheckedPermissions(role.permissions || []);
  };

  const handlePermissionToggle = (permissionValue) => {
    if (user?.role !== 'admin') return; // Read-only for non-admins

    setCheckedPermissions((prev) =>
      prev.includes(permissionValue)
        ? prev.filter((p) => p !== permissionValue)
        : [...prev, permissionValue]
    );
  };

  const handleSave = () => {
    if (!selectedRole) return;
    updatePermissions({
      roleName: selectedRole.roleName,
      permissions: checkedPermissions,
    });
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">ROLE ACCESS SETTINGS</h1>
        <p className="text-xs text-gray-500">Configure dynamic role-based access control (RBAC) permissions</p>
      </div>

      {/* Admin Notice */}
      {!isAdmin && (
        <div className="p-3 bg-amber-950/20 text-amber-400 border border-amber-800/40 rounded-sm text-xs flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold uppercase tracking-wider block text-[10px]">Read Only Notice</span>
            <span className="block mt-0.5">Only Administrators can update dynamic role permissions. Showing current settings.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left: Role List Selection */}
        <Card className="md:col-span-1 p-0 overflow-hidden flex flex-col divide-y divide-border-thin">
          <div className="p-4 bg-[#171717]">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Access Roles</h2>
          </div>

          <div className="flex flex-col divide-y divide-border-thin">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 bg-[#1a1a1a]/15 animate-pulse h-12" />
              ))
            ) : roles.length === 0 ? (
              <div className="p-4 text-xs text-gray-600">No roles defined.</div>
            ) : (
              roles.map((role) => (
                <button
                  key={role._id}
                  onClick={() => handleRoleChange(role)}
                  className={`p-4 text-left text-xs font-semibold cursor-pointer select-none transition-colors ${
                    selectedRole?.roleName === role.roleName
                      ? 'bg-accent-orange/5 text-accent-orange border-l-2 border-accent-orange'
                      : 'text-gray-400 hover:bg-[#1a1a1a]'
                  }`}
                >
                  {role.roleName.replace('_', ' ').toUpperCase()}
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right: Grouped Permissions Checklist */}
        <Card className="md:col-span-3 flex flex-col gap-6">
          {selectedRole ? (
            <>
              <div className="flex items-center justify-between border-b border-border-thin pb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent-orange" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {selectedRole.roleName.replace('_', ' ').toUpperCase()} Permissions
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Toggle route filters bound to this access role</p>
                  </div>
                </div>
                {isAdmin && (
                  <Button variant="primary" size="sm" onClick={handleSave} isLoading={isUpdating}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Permissions
                  </Button>
                )}
              </div>

              {/* Checklist groups */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                  <div key={group} className="flex flex-col gap-3 p-4 bg-[#151515] border border-border-thin rounded-sm">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-border-thin pb-1.5">
                      {group}
                    </h4>
                    <div className="flex flex-col gap-2">
                      {permissions.map((perm) => {
                        const isChecked = checkedPermissions.includes(perm.value);
                        return (
                          <label
                            key={perm.value}
                            className={`flex items-start gap-2.5 text-xs text-gray-300 py-1 transition-colors select-none ${
                              isAdmin ? 'cursor-pointer hover:text-white' : 'opacity-70'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!isAdmin}
                              onChange={() => handlePermissionToggle(perm.value)}
                              className="mt-0.5 border border-border-thin rounded-sm bg-[#121212] accent-accent-orange"
                            />
                            <span>{perm.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-gray-500 text-xs">
              Select an access role from the registry list to edit permissions.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
