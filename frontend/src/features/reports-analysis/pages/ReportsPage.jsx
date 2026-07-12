import React from 'react';
import { useReportsAnalytics, useExportReportsCSV } from '../hooks/useReports.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import {
  Download,
  TrendingUp,
  Percent,
  DollarSign,
  Award,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const ReportsPage = () => {
  const { user } = useAuth();
  const { data: analyticsData, isLoading, error } = useReportsAnalytics();
  const { mutate: exportCSV, isPending: exporting } = useExportReportsCSV();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-[#1f1f1f] rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-[#1f1f1f] rounded-sm" />
          ))}
        </div>
        <div className="h-96 bg-[#1f1f1f] rounded-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-800 bg-red-950/20 text-red-400 flex flex-col gap-3 max-w-md mx-auto mt-10">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-5 w-5" />
          Failed to load reports
        </div>
        <p className="text-xs text-red-500">{error.message || 'Check database connectivity.'}</p>
      </Card>
    );
  }

  // Fallbacks if DB is clean
  const reports = analyticsData || [];

  const topPerformance = reports.reduce(
    (max, item) => (item.roi > max.roi ? item : max),
    { roi: 0, vehicle: { registrationNumber: 'N/A' } }
  );

  const averageRoi = reports.length
    ? reports.reduce((sum, item) => sum + item.roi, 0) / reports.length
    : 0;

  const totalNetProfit = reports.reduce((sum, item) => sum + item.netProfit, 0);

  // Map data for Recharts Bar charts
  const chartData = reports.map((item) => ({
    name: item.vehicle?.registrationNumber || 'Deleted',
    ROI: parseFloat(item.roi.toFixed(1)),
    Revenue: item.revenue,
    Expenses: item.operatingCost,
    Fuel: item.fuelCost,
    Maintenance: item.maintenanceCost,
  }));

  const isExportAllowed = ['admin', 'fleet_manager', 'financial_analyst'].includes(user?.role);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">REPORTS & ANALYTICS</h1>
          <p className="text-xs text-gray-500">Calculate Return on Investment (ROI) and evaluate asset performance</p>
        </div>
        {isExportAllowed && reports.length > 0 && (
          <Button variant="primary" size="sm" onClick={() => exportCSV()} isLoading={exporting}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-950/20 rounded-sm border border-amber-800/30">
            <Award className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Top Performing Asset</span>
            <span className="text-lg font-bold text-white leading-none block mt-0.5">
              {topPerformance.vehicle?.registrationNumber || 'N/A'}
            </span>
            <span className="text-[10px] text-gray-500 mt-1 block">ROI: {topPerformance.roi.toFixed(1)}%</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-950/20 rounded-sm border border-emerald-800/30">
            <Percent className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Average Fleet ROI</span>
            <span className="text-xl font-bold text-white leading-none block mt-0.5">
              {averageRoi.toFixed(1)}%
            </span>
            <span className="text-[10px] text-gray-500 mt-1 block">Calculated across active fleet</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-950/20 rounded-sm border border-blue-800/30">
            <DollarSign className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Fleet Net Profit</span>
            <span className="text-xl font-bold text-white leading-none block mt-0.5">
              ${totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-gray-500 mt-1 block">Revenue minus operating costs</span>
          </div>
        </Card>
      </div>

      {reports.length === 0 ? (
        <Card className="py-20 text-center text-gray-500">
          No operational logs available to generate reports. Please book, dispatch, and complete trips first.
        </Card>
      ) : (
        <>
          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ROI Comparison Chart */}
            <Card className="flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Asset ROI (%)</h2>
                <span className="text-[10px] text-gray-500">Comparative ROI per vehicle registry profile</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#444" fontSize={10} />
                    <YAxis stroke="#444" fontSize={10} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#2a2a2a' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="ROI" fill="#f97316" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Cost vs Revenue Stacked Bar chart */}
            <Card className="flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Financial Overview ($)</h2>
                <span className="text-[10px] text-gray-500">Revenue allocations vs Operating expenses</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#444" fontSize={10} />
                    <YAxis stroke="#444" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#2a2a2a' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Revenue" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ROI Data Table */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-border-thin bg-[#171717]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">ROI Analysis Ledger</h2>
              <span className="text-[10px] text-gray-500">Breakdown of operational profitability indices</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-thin bg-[#131313]/30 text-gray-400 uppercase tracking-wider">
                    <th className="p-4">Vehicle Reg</th>
                    <th className="p-4 text-right">Revenue ($)</th>
                    <th className="p-4 text-right">Fuel Cost ($)</th>
                    <th className="p-4 text-right">Maintenance ($)</th>
                    <th className="p-4 text-right">Net Profit ($)</th>
                    <th className="p-4 text-right">ROI Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-thin">
                  {reports.map((item) => (
                    <tr key={item.vehicle?._id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4 font-semibold text-white">
                        {item.vehicle?.registrationNumber || 'N/A'}
                      </td>
                      <td className="p-4 text-right text-emerald-400 font-medium">
                        ${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-gray-400">
                        ${item.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-gray-400">
                        ${item.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right text-gray-300 font-semibold">
                        ${item.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-2 py-0.5 rounded-sm border font-mono font-bold ${
                          item.roi >= 50 
                            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40' 
                            : item.roi >= 20 
                            ? 'bg-amber-950/30 text-amber-400 border-amber-800/40' 
                            : 'bg-rose-950/30 text-rose-400 border-rose-800/40'
                        }`}>
                          {item.roi.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
