import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard.js';
import Badge from '../../../components/ui/Badge.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Select from '../../../components/ui/Select.jsx';
import {
  TrendingUp,
  Truck,
  Users,
  Compass,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

export const DashboardPage = () => {
  const [region, setRegion] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  const { data: dashboardData, isLoading, error } = useDashboard({ region, vehicleType });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-[#1f1f1f] rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[#1f1f1f] rounded-sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-80 md:col-span-2 bg-[#1f1f1f] rounded-sm" />
          <div className="h-80 bg-[#1f1f1f] rounded-sm" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-800 bg-red-950/20 text-red-400 flex flex-col gap-3 max-w-md mx-auto mt-10">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-5 w-5" />
          Failed to load dashboard metrics
        </div>
        <p className="text-xs text-red-500">{error.message || 'Check database connectivity.'}</p>
      </Card>
    );
  }

  // Safe fallback counts from backend API mapping
  const kpis = dashboardData?.kpis || {
    activeVehicles: 0,
    availableVehicles: 0,
    activeDrivers: 0,
    totalTrips: 0,
    utilizationRate: 0,
  };

  const chartData = dashboardData?.utilizationTrend || [
    { name: 'Mon', rate: 45 },
    { name: 'Tue', rate: 52 },
    { name: 'Wed', rate: 58 },
    { name: 'Thu', rate: 64 },
    { name: 'Fri', rate: 70 },
    { name: 'Sat', rate: 62 },
    { name: 'Sun', rate: 55 },
  ];

  const costData = dashboardData?.costComparison || [
    { type: 'Fuel', amount: 3200 },
    { type: 'Maintenance', amount: 1800 },
    { type: 'Other', amount: 850 },
  ];

  const recentTrips = dashboardData?.recentTrips || [];
  const recentActivities = dashboardData?.recentActivities || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Filters panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">PLATFORM OVERVIEW</h1>
          <p className="text-xs text-gray-500">Real-time status of TransitOps logistics nodes</p>
        </div>

        {/* Dynamic filters */}
        <div className="flex items-center gap-3">
          <Select
            placeholder="All Regions"
            options={[
              { value: 'North', label: 'North Region' },
              { value: 'South', label: 'South Region' },
              { value: 'East', label: 'East Region' },
              { value: 'West', label: 'West Region' },
              { value: 'Central', label: 'Central Region' },
            ]}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-40 bg-[#1f1f1f] text-xs py-1.5"
          />

          <Select
            placeholder="All Vehicles"
            options={[
              { value: 'Truck', label: 'Trucks' },
              { value: 'Van', label: 'Vans' },
              { value: 'Trailer', label: 'Trailers' },
              { value: 'Utility', label: 'Utility' },
            ]}
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-40 bg-[#1f1f1f] text-xs py-1.5"
          />

          {(region || vehicleType) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRegion('');
                setVehicleType('');
              }}
              className="text-xs py-1.5 px-3"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-accent-orange/10 rounded-sm border border-accent-orange/20">
            <Truck className="h-5 w-5 text-accent-orange" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Active Vehicles</span>
            <span className="text-2xl font-bold text-white leading-none">
              {kpis.activeVehicles} / {kpis.activeVehicles + kpis.availableVehicles}
            </span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-950/20 rounded-sm border border-emerald-800/30">
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Drivers On Duty</span>
            <span className="text-2xl font-bold text-white leading-none">{kpis.activeDrivers}</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-sky-950/20 rounded-sm border border-sky-800/30">
            <Compass className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Trips Dispatched</span>
            <span className="text-2xl font-bold text-white leading-none">{kpis.totalTrips}</span>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-950/20 rounded-sm border border-amber-800/30">
            <TrendingUp className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-semibold block uppercase">Fleet Utilization</span>
            <span className="text-2xl font-bold text-white leading-none">
              {(kpis.utilizationRate ?? 0).toFixed(1)}%
            </span>
          </div>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Utilization trend area plot */}
        <Card className="lg:col-span-2 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Fleet Utilization Trend</h2>
            <span className="text-[10px] text-gray-500">Average weekly asset occupancy rates</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent-orange)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-accent-orange)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#444" fontSize={10} />
                <YAxis stroke="#444" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#2a2a2a' }}
                  labelStyle={{ color: '#aaa', fontSize: '11px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--color-accent-orange)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Operating Cost Breakdown bar chart */}
        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cost Allocation ($)</h2>
            <span className="text-[10px] text-gray-500">Logistics expenses grouped by source</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="type" stroke="#444" fontSize={10} />
                <YAxis stroke="#444" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#2a2a2a' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Trips and Activity grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trips Table */}
        <Card className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Trip Dispatch</h2>
            <Badge status="Active">Live</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-thin text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5">Trip ID</th>
                  <th className="py-2.5">Route</th>
                  <th className="py-2.5">Vehicle</th>
                  <th className="py-2.5">Driver</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-600">
                      No active dispatches. Clear status filters or schedule new trips.
                    </td>
                  </tr>
                ) : (
                  recentTrips.map((trip) => (
                    <tr key={trip._id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-3 font-semibold text-white">{trip.tripId}</td>
                      <td className="py-3 text-gray-300">
                        {trip.source} → {trip.destination}
                      </td>
                      <td className="py-3 text-gray-400">
                        {trip.vehicle?.registrationNumber || 'N/A'}
                      </td>
                      <td className="py-3 text-gray-400">
                        {trip.driver?.name || 'N/A'}
                      </td>
                      <td className="py-3">
                        <Badge status={trip.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent activities trail */}
        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Operation Audits</h2>
          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[300px] pr-1">
            {recentActivities.length === 0 ? (
              <div className="text-center py-10 text-gray-600 text-xs">
                No recent system logs.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act._id} className="flex gap-3 items-start border-l-2 border-accent-orange/40 pl-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 font-medium font-mono uppercase tracking-wider leading-none">
                      {act.action}
                    </p>
                    <span className="text-[10px] text-gray-500 block mt-1">
                      {new Date(act.createdAt).toLocaleTimeString()} · By {act.user?.name || 'System'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
