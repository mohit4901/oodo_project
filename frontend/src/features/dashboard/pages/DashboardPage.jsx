import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard.js';
import Select from '../../../components/ui/Select.jsx';

/* ─────────────────────────────────────────────────────── helpers ── */
const STATUS_BADGE = {
  'On Trip':   { bg: 'bg-sky-500',       text: 'text-white' },
  Dispatched:  { bg: 'bg-sky-700/60',    text: 'text-sky-200 border border-sky-500' },
  Completed:   { bg: 'bg-emerald-500',   text: 'text-white' },
  Draft:       { bg: 'bg-[#333]',        text: 'text-gray-400' },
  Cancelled:   { bg: 'bg-red-900/60',    text: 'text-red-400' },
};

function TripBadge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE['Draft'];
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-bold tracking-wide select-none ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────────────── KPI card ── */
function KpiCard({ label, value, accent }) {
  const accentClass = accent
    ? 'border-t-2 border-accent-orange text-accent-orange'
    : 'border-t-2 border-[#2a2a2a] text-white';
  return (
    <div className={`bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm p-4 flex flex-col gap-1 select-none`}>
      <span className="text-[9px] uppercase tracking-[0.12em] text-gray-500 font-semibold block">{label}</span>
      <span className={`text-3xl font-bold leading-none ${accent ? 'text-accent-orange' : 'text-white'}`}>{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── status bar ── */
function VehicleStatusBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-gray-400 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-[#252525] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 w-8 text-right">{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export const DashboardPage = () => {
  const [vehicleType, setVehicleType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [region, setRegion] = useState('');

  const { data, isLoading, error } = useDashboard({ vehicleType, status: statusFilter, region });

  /* ── derived data with safe fallbacks ── */
  const kpis = {
    activeVehicles:         data?.kpis?.activeVehicles    ?? 0,
    availableVehicles:      data?.kpis?.availableVehicles ?? 0,
    inMaintenanceVehicles:  data?.kpis?.inShopVehicles    ?? 0,
    activeTrips:            data?.kpis?.activeTrips       ?? 0,
    pendingTrips:           data?.kpis?.pendingTrips      ?? 0,
    driversOnDuty:          data?.kpis?.driversOnDuty     ?? 0,
    utilizationRate:        data?.kpis?.fleetUtilization  ?? 0,
  };

  const recentTrips = data?.recentTrips ?? [];
  const dist = data?.statusDistribution ?? {};
  const vehicleStatus = {
    available: dist['Available'] ?? 0,
    onTrip:    dist['On Trip']   ?? 0,
    inShop:    dist['In Shop']   ?? 0,
    retired:   dist['Retired']   ?? 0,
  };
  const vsTotal = vehicleStatus.available + vehicleStatus.onTrip + vehicleStatus.inShop + vehicleStatus.retired;

  /* ── loading skeleton ── */
  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        <div className="grid grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => <div key={i} className="h-24 bg-[#1c1c1c] rounded-sm border border-[#2a2a2a]" />)}
        </div>
        <div className="h-72 bg-[#1c1c1c] rounded-sm border border-[#2a2a2a]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-900/50 bg-red-950/20 text-red-400 rounded-sm text-sm">
        Failed to load dashboard: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Filters ── */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mr-1">FILTERS</span>
        <Select
          placeholder="Vehicle Type: All"
          options={[
            { value: 'Truck',   label: 'Trucks'   },
            { value: 'Van',     label: 'Vans'     },
            { value: 'Trailer', label: 'Trailers' },
            { value: 'Utility', label: 'Utility'  },
          ]}
          value={vehicleType}
          onChange={e => setVehicleType(e.target.value)}
          className="bg-[#1c1c1c] border-[#2a2a2a] text-xs h-8 py-0"
        />
        <Select
          placeholder="Status: All"
          options={[
            { value: 'Draft',      label: 'Draft'      },
            { value: 'Dispatched', label: 'Dispatched' },
            { value: 'On Trip',    label: 'On Trip'    },
            { value: 'Completed',  label: 'Completed'  },
            { value: 'Cancelled',  label: 'Cancelled'  },
          ]}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#1c1c1c] border-[#2a2a2a] text-xs h-8 py-0"
        />
        <Select
          placeholder="Region: All"
          options={[
            { value: 'North',   label: 'North'   },
            { value: 'South',   label: 'South'   },
            { value: 'East',    label: 'East'    },
            { value: 'West',    label: 'West'    },
            { value: 'Central', label: 'Central' },
          ]}
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="bg-[#1c1c1c] border-[#2a2a2a] text-xs h-8 py-0"
        />
        {(vehicleType || statusFilter || region) && (
          <button
            onClick={() => { setVehicleType(''); setStatusFilter(''); setRegion(''); }}
            className="text-[10px] text-gray-500 hover:text-accent-orange underline ml-1 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── 7 KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard label="Active Vehicles"       value={String(kpis.activeVehicles).padStart(2,'0')} />
        <KpiCard label="Available Vehicles"    value={String(kpis.availableVehicles).padStart(2,'0')} />
        <KpiCard label="Vehicles in Maintenance" value={String(kpis.inMaintenanceVehicles).padStart(2,'0')} accent />
        <KpiCard label="Active Trips"          value={String(kpis.activeTrips).padStart(2,'0')} />
        <KpiCard label="Pending Trips"         value={String(kpis.pendingTrips).padStart(2,'0')} />
        <KpiCard label="Drivers on Duty"       value={String(kpis.driversOnDuty).padStart(2,'0')} />
        <KpiCard label="Fleet Utilization"     value={`${kpis.utilizationRate}%`} />
      </div>

      {/* ── Bottom Row: Recent Trips + Vehicle Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Trips Table */}
        <div className="lg:col-span-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-[#2a2a2a]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Recent Trips</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#252525] text-[9px] text-gray-500 uppercase tracking-widest">
                  <th className="px-5 py-2.5">Trip</th>
                  <th className="px-3 py-2.5">Vehicle</th>
                  <th className="px-3 py-2.5">Driver</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-600">
                      No recent trips. Book and dispatch a trip to see activity.
                    </td>
                  </tr>
                ) : (
                  recentTrips.map(trip => (
                    <tr key={trip._id} className="hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-white text-[10px]">
                        {trip.tripId ?? trip._id?.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-3 py-3 text-gray-300">
                        {trip.vehicle?.registrationNumber ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-300">
                        {trip.driver?.name ?? '—'}
                      </td>
                      <td className="px-3 py-3">
                        <TripBadge status={trip.status} />
                      </td>
                      <td className="px-3 py-3 text-gray-500">
                        {trip.status === 'Completed'  ? '—'               :
                         trip.status === 'Cancelled'  ? '—'               :
                         trip.status === 'Draft'      ? 'Awaiting vehicle':
                         trip.eta                     ? trip.eta          : 'In transit'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Bars */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm flex flex-col">
          <div className="px-5 py-3 border-b border-[#2a2a2a]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white">Vehicle Status</h2>
          </div>
          <div className="flex flex-col gap-4 p-5 flex-1 justify-center">
            <VehicleStatusBar
              label="Available"
              value={vehicleStatus.available}
              total={vsTotal}
              color="bg-emerald-500"
            />
            <VehicleStatusBar
              label="On Trip"
              value={vehicleStatus.onTrip}
              total={vsTotal}
              color="bg-sky-500"
            />
            <VehicleStatusBar
              label="In Shop"
              value={vehicleStatus.inShop}
              total={vsTotal}
              color="bg-accent-orange"
            />
            <VehicleStatusBar
              label="Retired"
              value={vehicleStatus.retired}
              total={vsTotal}
              color="bg-red-600"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
