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
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { Plus, Wrench, Calendar, DollarSign, X, CheckSquare } from 'lucide-react';

// Zod validation schemas
const createMaintenanceSchema = zod.object({
  vehicle: zod.string().nonempty('Please select a vehicle'),
  description: zod.string().min(5, 'Description details are required'),
  maintenanceType: zod.enum(['Routine', 'Breakdown', 'Inspection', 'Repair'], {
    errorMap: () => ({ message: 'Please select a service type' }),
  }),
  cost: zod.coerce.number().nonnegative('Cost cannot be negative'),
});

const closeMaintenanceSchema = zod.object({
  cost: zod.coerce.number().positive('Final cost must be a positive amount'),
  description: zod.string().optional(),
});

export const MaintenancePage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [closingLog, setClosingLog] = useState(null);

  // Queries
  const { data: logsData, isLoading } = useMaintenanceList({ page, limit, status });
  // Query available vehicles for selection (prevents logging On Trip assets)
  const { data: vehiclesData } = useVehiclesList({ limit: 100, status: 'Available' });

  // Mutations
  const { mutate: createLog, isPending: isCreating } = useCreateMaintenance();
  const { mutate: closeLog, isPending: isClosing } = useCloseMaintenance();

  // Forms
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm({
    resolver: zodResolver(createMaintenanceSchema),
    defaultValues: {
      vehicle: '',
      description: '',
      maintenanceType: '',
      cost: '',
    },
  });

  const {
    register: registerClose,
    handleSubmit: handleSubmitClose,
    reset: resetClose,
    formState: { errors: closeErrors },
  } = useForm({
    resolver: zodResolver(closeMaintenanceSchema),
    defaultValues: {
      cost: '',
      description: '',
    },
  });

  const handleOpenCreate = () => {
    resetCreate();
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = (data) => {
    createLog(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
      },
    });
  };

  const handleOpenCloseModal = (log) => {
    setClosingLog(log);
    resetClose({
      cost: log.cost,
      description: '',
    });
  };

  const handleCloseSubmit = (data) => {
    closeLog(
      { id: closingLog._id, data },
      {
        onSuccess: () => {
          setClosingLog(null);
        },
      }
    );
  };

  const isWriteAllowed = ['admin', 'fleet_manager'].includes(user?.role);
  const logs = logsData?.data || [];
  const pagination = logsData?.pagination || { page: 1, pages: 1, total: 0 };
  const availableVehicles = vehiclesData?.data || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">MAINTENANCE REGISTRY</h1>
          <p className="text-xs text-gray-500">Record diagnostics, schedule routine repairs, and log expenses</p>
        </div>
        {isWriteAllowed && (
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Service
          </Button>
        )}
      </div>

      {/* Filter panel */}
      <Card className="flex items-center py-4">
        <Select
          placeholder="All Logs Statuses"
          options={[
            { value: 'Active', label: 'Active (In Shop)' },
            { value: 'Completed', label: 'Completed (Released)' },
          ]}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-64 bg-[#121212] text-sm"
        />
      </Card>

      {/* Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-thin bg-[#171717] text-gray-400 uppercase tracking-wider">
                <th className="p-4">Vehicle</th>
                <th className="p-4">Service Type</th>
                <th className="p-4">Description</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Cost ($)</th>
                <th className="p-4">Status</th>
                {isWriteAllowed && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-thin">
              {isLoading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={8} className="p-4 bg-[#1a1a1a]/10 h-10" />
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-600">
                    No active or historical maintenance logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 font-semibold text-white">
                      {log.vehicle?.registrationNumber || 'N/A'}
                    </td>
                    <td className="p-4 text-gray-400">{log.maintenanceType}</td>
                    <td className="p-4 text-gray-300 max-w-xs truncate" title={log.description}>
                      {log.description}
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(log.startDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-400">
                      {log.endDate ? new Date(log.endDate).toLocaleDateString() : '--'}
                    </td>
                    <td className="p-4 text-gray-300 font-semibold">
                      ${log.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <Badge status={log.status} />
                    </td>
                    {isWriteAllowed && (
                      <td className="p-4 text-right">
                        {log.status === 'Active' ? (
                          <button
                            onClick={() => handleOpenCloseModal(log)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-accent-orange border border-accent-orange/30 hover:border-accent-orange bg-accent-orange/5 hover:bg-accent-orange/15 rounded-sm transition-colors cursor-pointer select-none"
                            title="Complete maintenance and release vehicle"
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                            Close Log
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-600 select-none">Concluded</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-thin bg-[#171717]">
            <span className="text-[11px] text-gray-500">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total entries)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="py-1 px-3 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.pages}
                onClick={() => setPage((prev) => prev + 1)}
                className="py-1 px-3 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Book Maintenance Modal Form */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg relative border-border-thin p-6 flex flex-col gap-5">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Schedule Maintenance</h3>
              <p className="text-[11px] text-gray-500">Log vehicle into shop. Vehicle status will update to In Shop.</p>
            </div>

            <form onSubmit={handleSubmitCreate(handleCreateSubmit)} className="flex flex-col gap-4">
              <Select
                label="Select Available Vehicle"
                placeholder="Select vehicle"
                error={createErrors.vehicle?.message}
                disabled={isCreating}
                {...registerCreate('vehicle')}
              >
                {availableVehicles.map((v) => (
                  <option key={v._id} value={v._id} className="bg-[#1f1f1f] text-gray-200">
                    {v.vehicleName} ({v.registrationNumber}) - Odo: {v.odometer} km
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Maintenance Type"
                  placeholder="Select type"
                  options={[
                    { value: 'Routine', label: 'Routine Service' },
                    { value: 'Breakdown', label: 'Breakdown Repair' },
                    { value: 'Inspection', label: 'Safety Inspection' },
                    { value: 'Repair', label: 'Misc Repair' },
                  ]}
                  error={createErrors.maintenanceType?.message}
                  disabled={isCreating}
                  {...registerCreate('maintenanceType')}
                />

                <Input
                  label="Estimated Cost ($)"
                  type="number"
                  placeholder="150"
                  error={createErrors.cost?.message}
                  disabled={isCreating}
                  {...registerCreate('cost')}
                />
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Service Description</label>
                <textarea
                  placeholder="Describe diagnostics, breakdown cause, or scheduled works..."
                  className={`w-full h-24 bg-[#121212] border border-border-thin text-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-orange focus:border-accent-orange placeholder:text-gray-600 ${
                    createErrors.description && 'border-red-500'
                  }`}
                  disabled={isCreating}
                  {...registerCreate('description')}
                />
                {createErrors.description && (
                  <span className="text-xs text-red-500 mt-0.5">{createErrors.description.message}</span>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
                  Log into Shop
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Close Maintenance Modal Form */}
      {closingLog && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm relative border-border-thin p-6 flex flex-col gap-5">
            <button
              onClick={() => setClosingLog(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Close Repair Log</h3>
              <p className="text-[11px] text-gray-500">Record final repair bills. Vehicle will be set to Available.</p>
            </div>

            <form onSubmit={handleSubmitClose(handleCloseSubmit)} className="flex flex-col gap-4">
              <Input
                label="Final Invoice Cost ($)"
                type="number"
                placeholder="450"
                error={closeErrors.cost?.message}
                disabled={isClosing}
                {...registerClose('cost')}
              />

              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Concluding Comments (Optional)</label>
                <textarea
                  placeholder="Mention final work done, parts replaced..."
                  className="w-full h-20 bg-[#121212] border border-border-thin text-gray-200 rounded-sm p-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-orange focus:border-accent-orange placeholder:text-gray-600"
                  disabled={isClosing}
                  {...registerClose('description')}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={() => setClosingLog(null)} disabled={isClosing}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isClosing}>
                  Close & Release
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
