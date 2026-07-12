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
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Calendar } from 'lucide-react';

// Zod validation schema for Driver
const driverSchema = zod.object({
  name: zod.string().min(2, 'Driver name must be at least 2 characters'),
  licenseNumber: zod.string().min(5, 'Valid driver license number is required'),
  licenseExpiryDate: zod.string().nonempty('License expiry date is required'),
  contactNumber: zod
    .string()
    .min(10, 'Valid contact number is required'),
  safetyScore: zod.coerce
    .number()
    .min(0, 'Score cannot be negative')
    .max(100, 'Score cannot exceed 100'),
});

export const DriverSafetyProfilePage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [deletingDriverId, setDeletingDriverId] = useState(null);

  // Queries & Mutations
  const { data: driversData, isLoading } = useDriversList({
    page,
    limit,
    search,
  });

  const { mutate: registerDriver, isPending: isCreating } = useCreateDriver();
  const { mutate: updateDriver, isPending: isUpdating } = useUpdateDriver();
  const { mutate: deleteDriver, isPending: isDeleting } = useDeleteDriver();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      licenseNumber: '',
      licenseExpiryDate: '',
      contactNumber: '',
      safetyScore: 90,
    },
  });

  const handleOpenForm = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      
      // Extract YYYY-MM-DD date string
      const rawDate = new Date(driver.licenseExpiryDate);
      const formattedDate = rawDate.toISOString().split('T')[0];

      reset({
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        licenseExpiryDate: formattedDate,
        contactNumber: driver.contactNumber,
        safetyScore: driver.safetyScore,
      });
    } else {
      setEditingDriver(null);
      reset({
        name: '',
        licenseNumber: '',
        licenseExpiryDate: '',
        contactNumber: '',
        safetyScore: 100,
      });
    }
    setIsFormOpen(true);
  };

  const onSubmit = (data) => {
    if (editingDriver) {
      updateDriver(
        { id: editingDriver._id, data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingDriver(null);
          },
        }
      );
    } else {
      registerDriver(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingDriverId) {
      deleteDriver(deletingDriverId, {
        onSuccess: () => {
          setDeletingDriverId(null);
        },
      });
    }
  };

  // Helper checking for license compliance
  const getLicenseExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff <= 0) {
      return { label: 'EXPIRED', color: 'bg-rose-950/40 text-rose-400 border-rose-800/60' };
    }
    if (daysDiff <= 30) {
      return { label: `EXPIRING SOON (${daysDiff}d)`, color: 'bg-amber-950/40 text-amber-400 border-amber-800/60' };
    }
    return null;
  };

  // Helper rating safety levels
  const getSafetyScoreBadgeColor = (score) => {
    if (score >= 90) return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
    if (score >= 70) return 'bg-amber-950/40 text-amber-400 border-amber-800/60';
    return 'bg-rose-950/40 text-rose-400 border-rose-800/60';
  };

  const isWriteAllowed = ['admin', 'safety_officer'].includes(user?.role);
  const drivers = driversData?.data || [];
  const pagination = driversData?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">DRIVER & SAFETY PROFILES</h1>
          <p className="text-xs text-gray-500">Monitor driver license compliances and safety scorings</p>
        </div>
        {isWriteAllowed && (
          <Button variant="primary" size="sm" onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Driver
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="flex items-center py-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by driver name or license number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#121212] border border-border-thin rounded-sm pl-9 pr-4 py-2 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-accent-orange focus:border-accent-orange"
          />
        </div>
      </Card>

      {/* Large Data Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-thin bg-[#171717] text-gray-400 uppercase tracking-wider">
                <th className="p-4">Driver Name</th>
                <th className="p-4">License Number</th>
                <th className="p-4">License Expiry</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Safety Score</th>
                <th className="p-4">Status</th>
                {isWriteAllowed && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-thin">
              {isLoading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={7} className="p-4 bg-[#1a1a1a]/10 h-10" />
                  </tr>
                ))
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-600">
                    No drivers registered matching query.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => {
                  const expiryWarn = getLicenseExpiryStatus(driver.licenseExpiryDate);
                  return (
                    <tr key={driver._id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4 font-semibold text-white">{driver.name}</td>
                      <td className="p-4 text-gray-400 font-mono">{driver.licenseNumber}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-gray-300">
                            {new Date(driver.licenseExpiryDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {expiryWarn && (
                            <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold border ${expiryWarn.color}`}>
                              {expiryWarn.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{driver.contactNumber}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-sm border text-[11px] font-bold ${getSafetyScoreBadgeColor(driver.safetyScore)}`}>
                          {driver.safetyScore} / 100
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge status={driver.status} />
                      </td>
                      {isWriteAllowed && (
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleOpenForm(driver)}
                              className="p-1 hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-sm transition-colors cursor-pointer"
                              title="Edit Driver Profile"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingDriverId(driver._id)}
                              className="p-1 hover:bg-red-950/20 text-gray-400 hover:text-red-400 rounded-sm transition-colors cursor-pointer"
                              title="Delete Driver"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

        {/* Pagination Panel */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border-thin bg-[#171717]">
            <span className="text-[11px] text-gray-500">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total drivers)
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

      {/* CRUD Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg relative border-border-thin p-6 flex flex-col gap-5">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                {editingDriver ? 'Edit Driver Profile' : 'Register New Driver'}
              </h3>
              <p className="text-[11px] text-gray-500">Assign legal credentials and performance details</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Full Name"
                placeholder="Rajesh Yadav"
                error={errors.name?.message}
                disabled={isCreating || isUpdating}
                {...register('name')}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Driving License Number"
                  placeholder="DL1420210087612"
                  error={errors.licenseNumber?.message}
                  disabled={isCreating || isUpdating}
                  {...register('licenseNumber')}
                />

                <Input
                  label="License Expiry Date"
                  type="date"
                  error={errors.licenseExpiryDate?.message}
                  disabled={isCreating || isUpdating}
                  {...register('licenseExpiryDate')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Phone"
                  placeholder="+919876543210"
                  error={errors.contactNumber?.message}
                  disabled={isCreating || isUpdating}
                  {...register('contactNumber')}
                />

                <Input
                  label="Safety Score (0 - 100)"
                  type="number"
                  placeholder="95"
                  error={errors.safetyScore?.message}
                  disabled={isCreating || isUpdating}
                  {...register('safetyScore')}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isCreating || isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isCreating || isUpdating}
                >
                  {editingDriver ? 'Update Profile' : 'Register Driver'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDriverId && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm relative border-red-950 p-6 flex flex-col gap-4 text-center">
            <div className="mx-auto p-3 bg-red-950/20 text-red-500 rounded-full border border-red-800/30 w-fit">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Remove Driver Profile?</h3>
              <p className="text-[11px] text-gray-500 mt-1">
                This action soft-deletes the driver registry profile. Past dispatches and analytics will be preserved.
              </p>
            </div>

            <div className="flex justify-center gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingDriverId(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
              >
                Yes, Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DriverSafetyProfilePage;
