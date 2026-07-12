import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  useMaintenanceList,
  useCreateMaintenance,
  useCloseMaintenance,
} from '../hooks/useMaintenance.js';
import { useVehiclesList } from '../../vehicle-registry/hooks/useVehicles.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { X, CheckSquare } from 'lucide-react';

/* ── status badge ───────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const styles = {
    Active:    'bg-amber-700/60 text-amber-200',
    Completed: 'bg-emerald-700/60 text-emerald-200',
  };
  const cls = styles[status] ?? 'bg-[#333] text-gray-400';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-bold ${cls}`}>
      {status === 'Active' ? 'In Shop' : status}
    </span>
  );
}

/* ── zod schemas ─────────────────────────────────────────────────── */
const createSchema = zod.object({
  vehicle:         zod.string().nonempty('Select a vehicle'),
  maintenanceType: zod.string().nonempty('Select service type'),
  cost:            zod.coerce.number().nonnegative('Cost required'),
  description:     zod.string().min(3, 'Description required'),
});

const closeSchema = zod.object({
  cost:        zod.coerce.number().positive('Final cost required'),
  description: zod.string().optional(),
});

/* ═══════════════════════════════════════════════════════════════════ */
export const MaintenancePage = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [closingLog, setClosingLog] = useState(null);

  const { data: logsData, isLoading } = useMaintenanceList({ page, limit: 10, status: statusFilter });
  const { data: vehiclesData }        = useVehiclesList({ limit: 100, status: 'Available' });
  const { mutate: createLog, isPending: isCreating } = useCreateMaintenance();
  const { mutate: closeLog,  isPending: isClosing  } = useCloseMaintenance();

  const {
    register: rc, handleSubmit: hc, reset: resetCreate,
    formState: { errors: ce },
  } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      vehicle: '', maintenanceType: '', cost: '', description: '',
    },
  });

  const {
    register: rcl, handleSubmit: hcl, reset: resetClose,
    formState: { errors: cle },
  } = useForm({
    resolver: zodResolver(closeSchema),
    defaultValues: { cost: '', description: '' },
  });

  const handleCreateSubmit = (data) =>
    createLog(data, { onSuccess: () => resetCreate() });

  const handleCloseSubmit = (data) =>
    closeLog({ id: closingLog._id, data }, { onSuccess: () => setClosingLog(null) });

  const isWriteAllowed = ['admin', 'fleet_manager'].includes(user?.role);
  const logs           = logsData?.data ?? [];
  const pagination     = logsData?.pagination ?? { page: 1, pages: 1, total: 0 };
  const vehicles       = vehiclesData?.data ?? [];

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-base font-bold text-white tracking-wide uppercase">Maintenance</h1>
        <p className="text-[10px] text-gray-500 mt-0.5">Schedule service records and track vehicle repair status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ── LEFT: Log Service Record form ── */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2a2a2a]">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Log Service Record</h2>
          </div>
          <form onSubmit={hc(handleCreateSubmit)} className="flex flex-col gap-3 p-5">

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest">Vehicle</label>
              <select {...rc('vehicle')}
                className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange cursor-pointer">
                <option value="">Select vehicle</option>
                {vehicles.map(v => (
                  <option key={v._id} value={v._id}>{v.vehicleName} ({v.registrationNumber})</option>
                ))}
              </select>
              {ce.vehicle && <span className="text-[10px] text-red-400">{ce.vehicle.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest">Service Type</label>
              <select {...rc('maintenanceType')}
                className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange cursor-pointer">
                <option value="">Select type</option>
                <option value="Routine">Oil Change</option>
                <option value="Breakdown">Engine Repair</option>
                <option value="Inspection">Tyre Replace</option>
                <option value="Repair">General Repair</option>
              </select>
              {ce.maintenanceType && <span className="text-[10px] text-red-400">{ce.maintenanceType.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest">Cost (₹)</label>
              <input {...rc('cost')} type="number" placeholder="2500"
                className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange placeholder:text-gray-700" />
              {ce.cost && <span className="text-[10px] text-red-400">{ce.cost.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest">Date</label>
              <input {...rc('description')} placeholder="Service description / notes"
                className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange placeholder:text-gray-700" />
              {ce.description && <span className="text-[10px] text-red-400">{ce.description.message}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-widest">Status</label>
              <input readOnly value="Active" className="bg-[#141414] border border-[#2a2a2a] text-gray-500 text-sm px-3 py-2 rounded-sm" />
            </div>

            {isWriteAllowed && (
              <button type="submit" disabled={isCreating}
                className="w-full py-2.5 mt-1 bg-accent-orange hover:bg-orange-500 text-white text-sm font-bold rounded-sm disabled:opacity-50 transition-colors">
                {isCreating ? 'Saving…' : 'Save'}
              </button>
            )}

            {/* Status transition legend */}
            <div className="flex flex-col gap-1.5 mt-2 text-[10px] text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">Available</span>
                <span className="text-gray-700 text-[8px]">─────────────────────►</span>
                <span className="text-amber-400 font-semibold">In Shop</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-semibold">In Shop</span>
                <span className="text-gray-700 text-[8px]">──────────────────────►</span>
                <span className="text-emerald-400 font-semibold">Available</span>
              </div>
              <p className="text-gray-600 italic text-[9px]">Note: In Shop vehicles are removed from the dispatcher pool.</p>
            </div>
          </form>
        </div>

        {/* ── RIGHT: Service Log table ── */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Service Log</h2>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-[#141414] border border-[#2a2a2a] text-gray-400 text-[10px] px-2 py-1 rounded-sm focus:outline-none focus:border-accent-orange cursor-pointer"
            >
              <option value="">All</option>
              <option value="Active">In Shop</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#252525] text-[9px] text-gray-500 uppercase tracking-widest">
                  <th className="px-5 py-2.5">Vehicle</th>
                  <th className="px-4 py-2.5">Service</th>
                  <th className="px-4 py-2.5 text-right">Cost</th>
                  <th className="px-4 py-2.5">Status</th>
                  {isWriteAllowed && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}><td colSpan={5} className="p-4 animate-pulse bg-[#1a1a1a] h-10" /></tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-600 text-xs">
                      No maintenance logs. Use the form to log a service record.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log._id} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-5 py-3 font-semibold text-white">
                        {log.vehicle?.registrationNumber ?? 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{log.maintenanceType}</td>
                      <td className="px-4 py-3 text-right text-gray-300 font-mono">
                        {(log.cost ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                      {isWriteAllowed && (
                        <td className="px-4 py-3">
                          {log.status === 'Active' && (
                            <button
                              onClick={() => { setClosingLog(log); resetClose({ cost: log.cost, description: '' }); }}
                              className="flex items-center gap-1 text-[10px] text-accent-orange border border-accent-orange/30 px-2 py-1 rounded-sm hover:bg-accent-orange/10 transition-colors"
                            >
                              <CheckSquare className="h-3 w-3" /> Close
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#2a2a2a] text-[10px] text-gray-500">
              <span>Page {pagination.page} / {pagination.pages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                  className="px-2 py-1 border border-[#333] rounded-sm hover:bg-[#252525] disabled:opacity-30 text-gray-400">
                  ‹
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}
                  className="px-2 py-1 border border-[#333] rounded-sm hover:bg-[#252525] disabled:opacity-30 text-gray-400">
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Close Maintenance Modal ── */}
      {closingLog && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase">Close Repair Log</h3>
              <button onClick={() => setClosingLog(null)} className="text-gray-500 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-500">
              Vehicle: {closingLog.vehicle?.registrationNumber} — will be set back to Available.
            </p>
            <form onSubmit={hcl(handleCloseSubmit)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest">Final Cost (₹)</label>
                <input {...rcl('cost')} type="number" placeholder="450"
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange" />
                {cle.cost && <span className="text-[10px] text-red-400">{cle.cost.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest">Closing Notes (optional)</label>
                <textarea {...rcl('description')} placeholder="Parts replaced, work completed…"
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange h-16 resize-none" />
              </div>
              <div className="flex gap-3 justify-end mt-1">
                <button type="button" onClick={() => setClosingLog(null)}
                  className="px-4 py-2 text-xs text-gray-400 border border-[#333] rounded-sm hover:bg-[#252525]">
                  Cancel
                </button>
                <button type="submit" disabled={isClosing}
                  className="px-4 py-2 text-xs font-bold bg-accent-orange hover:bg-orange-500 text-white rounded-sm disabled:opacity-50">
                  {isClosing ? 'Saving…' : 'Close & Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
