import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useSettingsRoles, useUpdatePermissions } from '../hooks/useSettings.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { ShieldOff } from 'lucide-react';

/* ── RBAC table config (matches mockup columns) ─────────────────── */
const MODULES = ['Fleet', 'Driver', 'Trips', 'Fuel/Exp', 'Analytics'];

const MODULE_PERMISSION_MAP = {
  Fleet:      { full: 'write_vehicles',  view: 'read_vehicles'  },
  Driver:     { full: 'write_drivers',   view: 'read_drivers'   },
  Trips:      { full: 'write_trips',     view: 'read_trips'     },
  'Fuel/Exp': { full: 'write_expenses',  view: 'read_expenses'  },
  Analytics:  { full: 'write_reports',   view: 'read_reports'   },
};

const ROLE_DISPLAY = {
  admin:             'Admin',
  fleet_manager:     'Fleet Manager',
  dispatcher:        'Dispatcher',
  safety_officer:    'Safety Officer',
  financial_analyst: 'Financial Analyst',
};

function PermCell({ permissions = [], module }) {
  const map     = MODULE_PERMISSION_MAP[module];
  const hasFull = permissions.includes(map.full);
  const hasView = permissions.includes(map.view);
  if (hasFull) return <span className="text-accent-orange font-bold text-base">✓</span>;
  if (hasView) return <span className="text-gray-400 text-[11px] font-semibold">View</span>;
  return <span className="text-gray-700">–</span>;
}

/* ── general settings zod schema ────────────────────────────────── */
const generalSchema = zod.object({
  depotName:    zod.string().min(2, 'Depot name required').trim(),
  company:      zod.string().min(2, 'Company name required').trim(),
  distanceUnit: zod.string().nonempty('Select a unit'),
});

/* ════════════════════════════════════════════════════════════════════ */
export const SettingsPage = () => {
  const { user }    = useAuth();
  const isAdmin     = user?.role === 'admin';
  const canEdit     = ['admin', 'fleet_manager'].includes(user?.role);

  /* ── live data from backend (all authenticated users can now read) */
  const { data: roles = [], isLoading, error } = useSettingsRoles();
  const [savedGeneral, setSavedGeneral]         = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      depotName:    'Gandhinagar Depot GJ9',
      company:      'India (IN)',
      distanceUnit: 'Kilometers',
    },
  });

  const onSaveGeneral = () => {
    setSavedGeneral(true);
    setTimeout(() => setSavedGeneral(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-base font-bold text-white tracking-wide uppercase">Settings &amp; RBAC</h1>
        <p className="text-[10px] text-gray-500 mt-0.5">General depot configuration and role-based access control</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ── LEFT: General Settings form ── */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2a2a2a]">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">General</h2>
          </div>

          {/* non-editors see a lock banner instead of an editable form */}
          {!canEdit ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-full">
                <ShieldOff className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Insufficient Permissions</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Your role <span className="text-amber-400 font-semibold">({ROLE_DISPLAY[user?.role] ?? user?.role})</span> does not have
                  access to modify general settings.
                </p>
                <p className="text-[10px] text-gray-600 mt-2 italic">Contact an Admin or Fleet Manager to make changes.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSaveGeneral)} className="flex flex-col gap-4 p-5">

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Depot Name</label>
                <input {...register('depotName')}
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange placeholder:text-gray-700" />
                {errors.depotName && <span className="text-[10px] text-red-400">{errors.depotName.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Company</label>
                <input {...register('company')}
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange placeholder:text-gray-700" />
                {errors.company && <span className="text-[10px] text-red-400">{errors.company.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Distance Unit</label>
                <select {...register('distanceUnit')}
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange cursor-pointer">
                  <option value="Kilometers">Kilometers</option>
                  <option value="Miles">Miles</option>
                </select>
              </div>

              <button type="submit"
                className={`w-full py-2.5 text-sm font-bold rounded-sm transition-colors ${
                  savedGeneral ? 'bg-emerald-600 text-white' : 'bg-accent-orange hover:bg-orange-500 text-white'
                }`}>
                {savedGeneral ? '✓ Saved' : 'Save changes'}
              </button>

              {/* Status flow legend */}
              <div className="flex flex-col gap-2 mt-1 text-[10px] text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-semibold">Available</span>
                  <span className="text-gray-700 flex-1 border-b border-dashed border-gray-700 mx-1" />
                  <span className="text-amber-400 font-semibold">In Shop</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-semibold">In Shop</span>
                  <span className="text-gray-700 flex-1 border-b border-dashed border-gray-700 mx-1" />
                  <span className="text-emerald-400 font-semibold">Available</span>
                </div>
                <p className="text-gray-600 italic text-[9px]">Note: In Shop vehicles are removed from the dispatcher pool.</p>
              </div>
            </form>
          )}
        </div>

        {/* ── RIGHT: RBAC table (live from backend) ── */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2a2a2a]">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Role-Based Access (RBAC)</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-600 animate-pulse text-xs">Loading roles…</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 text-xs">
              Failed to load role data: {error?.message ?? 'Server error'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[#252525] text-[9px] text-gray-500 uppercase tracking-widest">
                    <th className="px-5 py-2.5">Role</th>
                    {MODULES.map((m) => (
                      <th key={m} className="px-3 py-2.5 text-center">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-gray-600">
                        No roles found. Ask an admin to seed role definitions.
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr key={role._id} className="hover:bg-[#1f1f1f] transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-300">
                          {ROLE_DISPLAY[role.roleName] ?? role.roleName}
                          {role.roleName === user?.role && (
                            <span className="ml-2 px-1.5 py-0.5 text-[8px] bg-accent-orange/20 text-accent-orange rounded-sm font-bold">YOU</span>
                          )}
                        </td>
                        {MODULES.map((mod) => (
                          <td key={mod} className="px-3 py-3 text-center">
                            <PermCell permissions={role.permissions ?? []} module={mod} />
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Admin-only notice */}
          {!isAdmin && (
            <div className="px-5 py-3 border-t border-[#2a2a2a] text-[10px] text-gray-600 italic">
              Only Administrators can modify role permissions.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
