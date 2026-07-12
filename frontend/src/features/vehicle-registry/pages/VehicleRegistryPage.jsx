import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  useVehiclesList,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from '../hooks/useVehicles.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, FileText } from 'lucide-react';

// Zod Schema for Vehicle Registration / Update
const vehicleSchema = zod.object({
  registrationNumber: zod
    .string()
    .min(5, 'Registration number must be at least 5 characters')
    .toUpperCase(),
  vehicleName: zod.string().min(2, 'Vehicle name is required'),
  type: zod.enum(['Truck', 'Van', 'Trailer', 'Utility'], {
    errorMap: () => ({ message: 'Please select a vehicle type' }),
  }),
  maxLoadCapacity: zod.coerce
    .number()
    .positive('Capacity must be a positive number'),
  odometer: zod.coerce
    .number()
    .nonnegative('Odometer reading cannot be negative'),
  acquisitionCost: zod.coerce
    .number()
    .positive('Acquisition cost must be a positive number'),
  region: zod.enum(['North', 'South', 'East', 'West', 'Central'], {
    errorMap: () => ({ message: 'Please select a region' }),
  }),
});

export const VehicleRegistryPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);
  const [docsVehicle, setDocsVehicle] = useState(null); // Vehicle to manage documents for

  // Queries & Mutations
  const { data: vehiclesData, isLoading } = useVehiclesList({
    page,
    limit,
    search,
    status,
    type,
    region,
    sort,
  });

  const { mutate: registerVehicle, isPending: isCreating } = useCreateVehicle();
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdateVehicle();
  const { mutate: deleteVehicle, isPending: isDeleting } = useDeleteVehicle();

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: '',
      vehicleName: '',
      type: '',
      maxLoadCapacity: '',
      odometer: '',
      acquisitionCost: '',
      region: '',
    },
  });

  const handleOpenForm = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      reset({
        registrationNumber: vehicle.registrationNumber,
        vehicleName: vehicle.vehicleName,
        type: vehicle.type,
        maxLoadCapacity: vehicle.maxLoadCapacity,
        odometer: vehicle.odometer,
        acquisitionCost: vehicle.acquisitionCost,
        region: vehicle.region,
      });
    } else {
      setEditingVehicle(null);
      reset({
        registrationNumber: '',
        vehicleName: '',
        type: '',
        maxLoadCapacity: '',
        odometer: 0,
        acquisitionCost: '',
        region: '',
      });
    }
    setIsFormOpen(true);
  };

  const onSubmit = (data) => {
    if (editingVehicle) {
      updateVehicle(
        { id: editingVehicle._id, data },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            setEditingVehicle(null);
          },
        }
      );
    } else {
      registerVehicle(data, {
        onSuccess: () => {
          setIsFormOpen(false);
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingVehicleId) {
      deleteVehicle(deletingVehicleId, {
        onSuccess: () => {
          setDeletingVehicleId(null);
        },
      });
    }
  };

  const isWriteAllowed = ['admin', 'fleet_manager'].includes(user?.role);
  const vehicles = vehiclesData?.data || [];
  const pagination = vehiclesData?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">VEHICLE REGISTRY</h1>
          <p className="text-xs text-gray-500">Manage corporate logistics fleet vehicles</p>
        </div>
        {isWriteAllowed && (
          <Button variant="primary" size="sm" onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="flex flex-col gap-4 py-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by registration number, vehicle name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#121212] border border-border-thin rounded-sm pl-9 pr-4 py-2 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-accent-orange focus:border-accent-orange"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          <Select
            placeholder="All Statuses"
            options={[
              { value: 'Available', label: 'Available' },
              { value: 'On Trip', label: 'On Trip' },
              { value: 'In Shop', label: 'In Shop' },
              { value: 'Retired', label: 'Retired' },
            ]}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#121212] text-sm"
          />

          <Select
            placeholder="All Types"
            options={[
              { value: 'Truck', label: 'Truck' },
              { value: 'Van', label: 'Van' },
              { value: 'Trailer', label: 'Trailer' },
              { value: 'Utility', label: 'Utility' },
            ]}
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#121212] text-sm"
          />

          <Select
            placeholder="All Regions"
            options={[
              { value: 'North', label: 'North' },
              { value: 'South', label: 'South' },
              { value: 'East', label: 'East' },
              { value: 'West', label: 'West' },
              { value: 'Central', label: 'Central' },
            ]}
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#121212] text-sm"
          />

          <Select
            placeholder="Sort By"
            options={[
              { value: '-createdAt', label: 'Newest Registered' },
              { value: 'createdAt', label: 'Oldest Registered' },
              { value: '-odometer', label: 'Odometer (High-Low)' },
              { value: 'odometer', label: 'Odometer (Low-High)' },
              { value: '-maxLoadCapacity', label: 'Capacity (High-Low)' },
              { value: 'maxLoadCapacity', label: 'Capacity (Low-High)' },
            ]}
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#121212] text-sm"
          />
        </div>
      </Card>

      {/* Enterprise Data Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-thin bg-[#171717] text-gray-400 uppercase tracking-wider">
                <th className="p-4">Reg Number</th>
                <th className="p-4">Vehicle Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Region</th>
                <th className="p-4">Capacity (kg)</th>
                <th className="p-4">Odometer (km)</th>
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
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-600">
                    No vehicles found in registry matching criteria.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="p-4 font-semibold text-white">{vehicle.registrationNumber}</td>
                    <td className="p-4 text-gray-300">{vehicle.vehicleName}</td>
                    <td className="p-4 text-gray-400">{vehicle.type}</td>
                    <td className="p-4 text-gray-400">{vehicle.region}</td>
                    <td className="p-4 text-gray-300">{vehicle.maxLoadCapacity.toLocaleString()}</td>
                    <td className="p-4 text-gray-300">{vehicle.odometer.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge status={vehicle.status} />
                    </td>
                    {isWriteAllowed && (
                      <td className="p-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleOpenForm(vehicle)}
                            className="p-1 hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-sm transition-colors cursor-pointer"
                            title="Edit Vehicle"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDocsVehicle(vehicle)}
                            className="p-1 hover:bg-sky-950/20 text-gray-400 hover:text-sky-400 rounded-sm transition-colors cursor-pointer"
                            title="Manage Documents"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingVehicleId(vehicle._id)}
                            className="p-1 hover:bg-red-950/20 text-gray-400 hover:text-red-400 rounded-sm transition-colors cursor-pointer"
                            title="Delete Vehicle"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total vehicles)
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

      {/* CRUD Modal Form */}
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
                {editingVehicle ? 'Edit Vehicle Profile' : 'Register New Vehicle'}
              </h3>
              <p className="text-[11px] text-gray-500">Define operational parameters for this vehicle asset</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input
                label="Registration Number"
                placeholder="DL-01-GB-4812"
                error={errors.registrationNumber?.message}
                disabled={isCreating || isUpdating}
                {...register('registrationNumber')}
              />

              <Input
                label="Vehicle Name / Model"
                placeholder="Tata Signa 4825.T"
                error={errors.vehicleName?.message}
                disabled={isCreating || isUpdating}
                {...register('vehicleName')}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Vehicle Type"
                  placeholder="Select type"
                  options={[
                    { value: 'Truck', label: 'Truck' },
                    { value: 'Van', label: 'Van' },
                    { value: 'Trailer', label: 'Trailer' },
                    { value: 'Utility', label: 'Utility' },
                  ]}
                  error={errors.type?.message}
                  disabled={isCreating || isUpdating}
                  {...register('type')}
                />

                <Select
                  label="Allocated Region"
                  placeholder="Select region"
                  options={[
                    { value: 'North', label: 'North' },
                    { value: 'South', label: 'South' },
                    { value: 'East', label: 'East' },
                    { value: 'West', label: 'West' },
                    { value: 'Central', label: 'Central' },
                  ]}
                  error={errors.region?.message}
                  disabled={isCreating || isUpdating}
                  {...register('region')}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Max Load (kg)"
                  type="number"
                  placeholder="15000"
                  error={errors.maxLoadCapacity?.message}
                  disabled={isCreating || isUpdating}
                  {...register('maxLoadCapacity')}
                />

                <Input
                  label="Odometer (km)"
                  type="number"
                  placeholder="25000"
                  error={errors.odometer?.message}
                  disabled={isCreating || isUpdating}
                  {...register('odometer')}
                />

                <Input
                  label="Cost Price ($)"
                  type="number"
                  placeholder="35000"
                  error={errors.acquisitionCost?.message}
                  disabled={isCreating || isUpdating}
                  {...register('acquisitionCost')}
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
                  {editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Document Management Modal */}
      {docsVehicle && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg relative p-6 flex flex-col gap-5">
            <button
              onClick={() => setDocsVehicle(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vehicle Documents</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">{docsVehicle.registrationNumber} — {docsVehicle.vehicleName}</p>
            </div>

            {/* Existing documents */}
            <div className="flex flex-col gap-2">
              {(docsVehicle.documents ?? []).length === 0 ? (
                <p className="text-[11px] text-gray-600">No documents uploaded yet.</p>
              ) : (
                (docsVehicle.documents ?? []).map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] rounded-sm px-3 py-2">
                    <a href={`http://localhost:5050${doc.url}`} target="_blank" rel="noreferrer" className="text-xs text-sky-400 hover:underline flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      {doc.name}
                    </a>
                    <button
                      onClick={async () => {
                        try {
                          const { default: api } = await import('../../../lib/axios.js');
                          await api.delete(`/vehicles/${docsVehicle._id}/documents/${doc._id}`);
                          setDocsVehicle(prev => ({ ...prev, documents: prev.documents.filter(d => d._id !== doc._id) }));
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Upload new document */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                try {
                  const { default: api } = await import('../../../lib/axios.js');
                  const res = await api.post(`/vehicles/${docsVehicle._id}/documents`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  setDocsVehicle(res.data.data);
                  e.target.reset();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="flex flex-col gap-3 border-t border-[#2a2a2a] pt-4"
            >
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Upload New Document</p>
              <div className="flex gap-3">
                <input
                  name="name"
                  placeholder="Document name (e.g. RC Book)"
                  className="flex-1 bg-[#121212] border border-[#2a2a2a] rounded-sm px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-accent-orange"
                />
                <input
                  name="document"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  className="text-xs text-gray-400 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-accent-orange file:text-white file:rounded-sm hover:file:bg-orange-500 cursor-pointer"
                />
              </div>
              <button
                type="submit"
                className="self-end px-4 py-1.5 bg-accent-orange hover:bg-orange-500 text-white text-xs font-bold rounded-sm transition-colors"
              >
                Upload
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVehicleId && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm relative border-red-950 p-6 flex flex-col gap-4 text-center">
            <div className="mx-auto p-3 bg-red-950/20 text-red-500 rounded-full border border-red-800/30 w-fit">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Remove Vehicle Asset?</h3>
              <p className="text-[11px] text-gray-500 mt-1">
                This action soft-deletes the vehicle registry profile. Ongoing trip and log entries will be preserved.
              </p>
            </div>

            <div className="flex justify-center gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingVehicleId(null)}
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

export default VehicleRegistryPage;
