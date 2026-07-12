import React from 'react';
import { useReportsAnalytics, useExportReportsCSV } from '../hooks/useReports.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Download } from 'lucide-react';

/* ── tiny helpers ───────────────────────────────────────────────── */
function KpiTile({ label, value, sub, accent }) {
  return (
    <div className={`flex flex-col gap-1 p-4 border rounded-sm ${accent ? 'border-accent-orange/40 bg-accent-orange/5' : 'border-[#2a2a2a] bg-[#1c1c1c]'}`}>
      <span className="text-[9px] uppercase tracking-[0.14em] text-gray-500 font-semibold">{label}</span>
      <span className={`text-2xl font-bold leading-none ${accent ? 'text-accent-orange' : 'text-white'}`}>{value}</span>
      {sub && <span className="text-[10px] text-gray-600 mt-0.5">{sub}</span>}
    </div>
  );
}

/* ── page ───────────────────────────────────────────────────────── */
export const ReportsPage = () => {
  const { user } = useAuth();
  const { data: reports = [], isLoading, error } = useReportsAnalytics();
  const { mutate: exportCSV, isPending: exporting } = useExportReportsCSV();

  /* derived aggregates */
  const totalOperationalCost = reports.reduce((s, r) => s + (r.operatingCost ?? 0), 0);
  const avgUtilization        = reports.length
    ? Math.round(reports.reduce((s, r) => s + (r.utilizationRate ?? 0), 0) / reports.length)
    : 0;
  const avgFuelEff            = reports.length
    ? (reports.reduce((s, r) => s + (r.fuelEfficiency ?? 0), 0) / reports.length).toFixed(1)
    : '0.0';
  const bestRoi               = reports.length
    ? Math.max(...reports.map((r) => r.roi ?? 0)).toFixed(1)
    : '0.0';

  /* monthly revenue chart data — aggregate by vehicle for now */
  const revenueData = reports.map((r) => ({
    name: r.vehicle?.registrationNumber ?? 'N/A',
    Revenue: r.revenue ?? 0,
  }));

  /* top costliest vehicles */
  const costliestVehicles = [...reports]
    .sort((a, b) => (b.operatingCost ?? 0) - (a.operatingCost ?? 0))
    .slice(0, 5);
  const maxCost = costliestVehicles[0]?.operatingCost ?? 1;

  const isExportAllowed = ['admin', 'fleet_manager', 'financial_analyst'].includes(user?.role);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[#1c1c1c] rounded-sm border border-[#2a2a2a]" />)}
        </div>
        <div className="h-72 bg-[#1c1c1c] rounded-sm border border-[#2a2a2a]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-900/50 bg-red-950/20 text-red-400 rounded-sm text-sm">
        Failed to load analytics: {error?.message ?? 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-wide uppercase">Reports &amp; Analytics</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">ROI = (Revenue − Maintenance + Fuel) / Acquisition Cost</p>
        </div>
        {isExportAllowed && reports.length > 0 && (
          <button
            onClick={() => exportCSV()}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-orange text-white text-xs font-bold rounded-sm hover:bg-orange-500 transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        )}
      </div>

      {/* ── 4 KPI tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile label="Fuel Efficiency"    value={`${avgFuelEff} km/l`}                         />
        <KpiTile label="Fleet Utilization"  value={`${avgUtilization}%`}                          />
        <KpiTile label="Operational Cost"   value={totalOperationalCost.toLocaleString()} accent  />
        <KpiTile label="Vehicle ROI"        value={`${bestRoi}%`}                                 sub="Best performing asset" />
      </div>

      {reports.length === 0 ? (
        <div className="p-12 text-center text-gray-600 border border-[#2a2a2a] rounded-sm bg-[#1c1c1c] text-sm">
          No operational logs available. Book, dispatch and complete trips first to generate analytics.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Monthly Revenue bar chart */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm flex flex-col">
            <div className="px-5 py-3 border-b border-[#2a2a2a]">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Monthly Revenue</h2>
            </div>
            <div className="p-4 flex-1 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#444" fontSize={9} />
                  <YAxis stroke="#444" fontSize={9} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#333', fontSize: '11px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="Revenue" radius={[2, 2, 0, 0]}>
                    {revenueData.map((_, i) => (
                      <Cell key={i} fill="#5b8dd9" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Costliest Vehicles horizontal bars */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm flex flex-col">
            <div className="px-5 py-3 border-b border-[#2a2a2a]">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest">Top Costliest Vehicles</h2>
            </div>
            <div className="flex flex-col gap-3 p-5 flex-1 justify-center">
              {costliestVehicles.map((r, i) => {
                const pct = Math.round(((r.operatingCost ?? 0) / maxCost) * 100);
                const colors = ['bg-red-400', 'bg-accent-orange', 'bg-sky-500', 'bg-emerald-500', 'bg-purple-400'];
                return (
                  <div key={r.vehicle?._id ?? i} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400 w-20 shrink-0 truncate">
                      {r.vehicle?.registrationNumber ?? 'N/A'}
                    </span>
                    <div className="flex-1 h-3 bg-[#252525] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-gray-400 w-16 text-right">
                      ₹{(r.operatingCost ?? 0).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ROI Table */}
      {reports.length > 0 && (
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2a2a2a]">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">ROI Analysis Ledger</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#252525] text-[9px] text-gray-500 uppercase tracking-widest">
                  <th className="px-5 py-2.5">Vehicle</th>
                  <th className="px-4 py-2.5 text-right">Revenue</th>
                  <th className="px-4 py-2.5 text-right">Fuel Cost</th>
                  <th className="px-4 py-2.5 text-right">Maintenance</th>
                  <th className="px-4 py-2.5 text-right">Net Profit</th>
                  <th className="px-4 py-2.5 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {reports.map((r) => (
                  <tr key={r.vehicle?._id ?? Math.random()} className="hover:bg-[#1f1f1f] transition-colors">
                    <td className="px-5 py-3 font-semibold text-white">{r.vehicle?.registrationNumber ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">₹{(r.revenue ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-400">₹{(r.fuelCost ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-400">₹{(r.maintenanceCost ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-white font-semibold">₹{(r.netProfit ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        (r.roi ?? 0) >= 50 ? 'bg-emerald-950/40 text-emerald-400' :
                        (r.roi ?? 0) >= 20 ? 'bg-amber-950/40 text-amber-400' :
                                             'bg-rose-950/40 text-rose-400'
                      }`}>
                        {(r.roi ?? 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
