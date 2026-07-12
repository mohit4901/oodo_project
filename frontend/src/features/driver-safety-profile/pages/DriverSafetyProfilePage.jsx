import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  useDriversList,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
} from '../hooks/useDrivers.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

/* ── driver status badge ─────────────────────────────────────────── */
const STATUS_STYLES = {
  Available:  'bg-emerald-700/60 text-emerald-200',
  'On Trip':  'bg-sky-700/60 text-sky-200',
  'Off Duty': 'bg-[#333] text-gray-400',
  Suspended:  'bg-amber-700/60 text-amber-200',
};

function DriverStatusBadge({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-[#333] text-gray-400';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-bold ${cls}`}>
      {status}
    </span>
  );
}

/* ── safety score colour ──────────────────────────────────────────── */
function safetyColor(score) {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
}

/* ── expiry helper ────────────────────────────────────────────────── */
function expiryLabel(dateStr) {
  const today  = new Date();
  const expiry = new Date(dateStr);
  const days   = Math.ceil((expiry - today) / 86400000);
  const fmt    = expiry.toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' });
  if (days <= 0)  return { text: `${fmt} EXPIRED`, warn: true };
  if (days <= 60) return { text: `${fmt} EXPIRING`, warn: true };
  return { text: fmt, warn: false };
}

/* ── Zod schema ───────────────────────────────────────────────────── */
const driverSchema = zod.object({
  name:              zod.string().min(2, 'Name required'),
  licenseNumber:     zod.string().min(5, 'License number required'),
  licenseCategory:   zod.string().nonempty('Category required'),
  licenseExpiryDate: zod.string().nonempty('Expiry date required'),
  contactNumber:     zod.string().min(10, 'Contact required'),
  safetyScore:       zod.coerce.number().min(0).max(100),
});

/* ═══════════════════════════════════════════════════════════════════ */
export const DriverSafetyProfilePage = () => {
  const { user }    = useAuth();
  const [search, setSearch]        = useState('');
  const [page, setPage]            = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data: driversData, isLoading } = useDriversList({ page, limit: 10, search });
  const { mutate: createDriver, isPending: isCreating } = useCreateDriver();
  const { mutate: updateDriver, isPending: isUpdating } = useUpdateDriver();
  const { mutate: deleteDriver, isPending: isDeleting } = useDeleteDriver();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(driverSchema),
    defaultValues: { name: '', licenseNumber: '', licenseCategory: 'LMV', licenseExpiryDate: '', contactNumber: '', safetyScore: 95 },
  });

  const openForm = (driver = null) => {
    setEditing(driver);
    if (driver) {
      reset({
        name:              driver.name,
        licenseNumber:     driver.licenseNumber,
        licenseCategory:   driver.licenseCategory ?? 'LMV',
        licenseExpiryDate: new Date(driver.licenseExpiryDate).toISOString().split('T')[0],
        contactNumber:     driver.contactNumber,
        safetyScore:       driver.safetyScore,
      });
    } else {
      reset({ name: '', licenseNumber: '', licenseCategory: 'LMV', licenseExpiryDate: '', contactNumber: '', safetyScore: 95 });
    }
    setIsFormOpen(true);
  };

  const onSubmit = (data) => {
    if (editingDriver) {
      updateDriver({ id: editingDriver._id, data }, { onSuccess: () => { setIsFormOpen(false); setEditing(null); }});
    } else {
      createDriver(data, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const isWriteAllowed = ['admin', 'safety_officer', 'fleet_manager'].includes(user?.role);
  const drivers    = driversData?.data       ?? [];
  const pagination = driversData?.pagination ?? { page: 1, pages: 1, total: 0 };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-wide uppercase">Drivers &amp; Safety Profiles</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">Monitor license compliance and driver safety ratings</p>
        </div>
        {isWriteAllowed && (
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-orange hover:bg-orange-500 text-white text-xs font-bold rounded-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            + Add Driver
          </button>
        )}
      </div>

      {/* ── Search bar ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name or license number…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-[#1c1c1c] border border-[#2a2a2a] text-gray-300 text-sm pl-9 pr-4 py-2 rounded-sm focus:outline-none focus:border-accent-orange placeholder:text-gray-600"
        />
      </div>

      {/* ── Driver Table ── */}
      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-[#252525] text-[9px] text-gray-500 uppercase tracking-widest">
                <th className="px-5 py-2.5">Driver</th>
                <th className="px-4 py-2.5">License ID</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Expiry</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Safety</th>
                <th className="px-4 py-2.5">Status</th>
                {isWriteAllowed && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="p-4 animate-pulse bg-[#1a1a1a] h-10" /></tr>
                ))
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-600 text-xs">
                    No drivers registered. Use "+ Add Driver" to create a profile.
                  </td>
                </tr>
              ) : (
                drivers.map(d => {
                  const exp = expiryLabel(d.licenseExpiryDate);
                  return (
                    <tr key={d._id} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-5 py-3 font-semibold text-white">{d.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-400">{d.licenseNumber}</td>
                      <td className="px-4 py-3 text-gray-400">{d.licenseCategory ?? 'LMV'}</td>
                      <td className={`px-4 py-3 ${exp.warn ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                        {exp.text}
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono">{d.contactNumber}</td>
                      <td className={`px-4 py-3 font-bold ${safetyColor(d.safetyScore)}`}>
                        {d.safetyScore}%
                      </td>
                      <td className="px-4 py-3">
                        <DriverStatusBadge status={d.status} />
                      </td>
                      {isWriteAllowed && (
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => openForm(d)}
                              className="p-1.5 hover:bg-[#2a2a2a] text-gray-500 hover:text-white rounded-sm transition-colors cursor-pointer">
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button onClick={() => setDeletingId(d._id)}
                              className="p-1.5 hover:bg-red-950/30 text-gray-500 hover:text-red-400 rounded-sm transition-colors cursor-pointer">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Status toggle legend */}
        <div className="px-5 py-3 border-t border-[#2a2a2a] flex items-center gap-3 flex-wrap">
          <span className="text-[9px] text-gray-600 uppercase tracking-widest mr-1">Toggle Status:</span>
          {['Available', 'On Trip', 'Off Duty', 'Suspended'].map(s => (
            <span key={s} className={`inline-block px-3 py-1 rounded-sm text-[10px] font-bold cursor-default ${STATUS_STYLES[s] ?? 'bg-[#333] text-gray-400'}`}>
              {s}
            </span>
          ))}
        </div>
        <div className="px-5 py-2 border-t border-[#2a2a2a] text-[9px] text-amber-700 italic">
          Rule: Expired license or Suspended status → blocked from trip assignment
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#2a2a2a] text-[10px] text-gray-500">
            <span>Showing page {pagination.page} / {pagination.pages} ({pagination.total} drivers)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="px-2 py-1 border border-[#333] rounded-sm hover:bg-[#252525] disabled:opacity-30 text-gray-400">‹</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}
                className="px-2 py-1 border border-[#333] rounded-sm hover:bg-[#252525] disabled:opacity-30 text-gray-400">›</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Driver Modal ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm w-full max-w-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase">
                {editingDriver ? 'Edit Driver Profile' : 'Register New Driver'}
              </h3>
              <button onClick={() => { setIsFormOpen(false); setEditing(null); }} className="text-gray-500 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest">Full Name</label>
                <input {...register('name')} placeholder="Rajesh Yadav"
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange" />
                {errors.name && <span className="text-[10px] text-red-400">{errors.name.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">License Number</label>
                  <input {...register('licenseNumber')} placeholder="DL-8F7215"
                    className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange" />
                  {errors.licenseNumber && <span className="text-[10px] text-red-400">{errors.licenseNumber.message}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">Category</label>
                  <select {...register('licenseCategory')}
                    className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange cursor-pointer">
                    <option value="LMV">LMV</option>
                    <option value="HMV">HMV</option>
                    <option value="HPMV">HPMV</option>
                    <option value="MGV">MGV</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">Expiry Date</label>
                  <input {...register('licenseExpiryDate')} type="date"
                    className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange" />
                  {errors.licenseExpiryDate && <span className="text-[10px] text-red-400">{errors.licenseExpiryDate.message}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">Contact</label>
                  <input {...register('contactNumber')} placeholder="9876543210"
                    className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange" />
                  {errors.contactNumber && <span className="text-[10px] text-red-400">{errors.contactNumber.message}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest">Safety Score (0–100)</label>
                <input {...register('safetyScore')} type="number" min="0" max="100" placeholder="95"
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange" />
                {errors.safetyScore && <span className="text-[10px] text-red-400">{errors.safetyScore.message}</span>}
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => { setIsFormOpen(false); setEditing(null); }}
                  className="px-4 py-2 text-xs text-gray-400 border border-[#333] rounded-sm hover:bg-[#252525]">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating || isUpdating}
                  className="px-4 py-2 text-xs font-bold bg-accent-orange hover:bg-orange-500 text-white rounded-sm disabled:opacity-50">
                  {(isCreating || isUpdating) ? 'Saving…' : editingDriver ? 'Update Profile' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm w-full max-w-sm p-6 flex flex-col gap-4 text-center">
            <div className="mx-auto p-3 bg-red-950/20 rounded-full border border-red-800/30">
              <AlertTriangle className="h-6 w-6 text-red-400 mx-auto" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase">Remove Driver?</h3>
              <p className="text-[11px] text-gray-500 mt-1">This soft-deletes the profile. Past trips and analytics are preserved.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeletingId(null)} disabled={isDeleting}
                className="px-4 py-2 text-xs text-gray-400 border border-[#333] rounded-sm hover:bg-[#252525]">
                Cancel
              </button>
              <button onClick={() => deleteDriver(deletingId, { onSuccess: () => setDeletingId(null) })} disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold bg-red-700 hover:bg-red-600 text-white rounded-sm disabled:opacity-50">
                {isDeleting ? 'Removing…' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverSafetyProfilePage;
