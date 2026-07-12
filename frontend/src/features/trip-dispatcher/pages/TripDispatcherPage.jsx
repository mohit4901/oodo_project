import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  useTripsList,
  useCreateTrip,
  useDispatchTrip,
  useCompleteTrip,
  useCancelTrip,
} from '../hooks/useTrips.js';
import { useVehiclesList } from '../../vehicle-registry/hooks/useVehicles.js';
import { useDriversList } from '../../driver-safety-profile/hooks/useDrivers.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import Card from '../../../components/ui/Card.jsx';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import {
  Plus,
  Compass,
  ArrowRight,
  Route,
  User,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Zod validation schemas
const bookTripSchema = zod.object({
  source: zod.string().min(2, 'Source location is required').trim(),
  destination: zod.string().min(2, 'Destination location is required').trim(),
  plannedDistance: zod.coerce.number().positive('Distance must be positive'),
  vehicle: zod.string().nonempty('Please assign a vehicle'),
  driver: zod.string().nonempty('Please assign a driver'),
  cargoWeight: zod.coerce.number().positive('Cargo weight must be positive'),
  revenue: zod.coerce.number().nonnegative('Revenue payout cannot be negative'),
});

const completeTripSchema = zod.object({
  actualDistance: zod.coerce.number().positive('Actual distance must be positive'),
  liters: zod.coerce.number().positive('Fuel consumed is required'),
  fuelCost: zod.coerce.number().positive('Fuel cost is required'),
});

export const TripDispatcherPage = () => {
  const { user: currentUser } = useAuth();
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookStep, setBookStep] = useState(1);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Queries
  const { data: tripsData, isLoading: loadingTrips } = useTripsList({ limit: 50 });
  const { data: vehiclesData } = useVehiclesList({ limit: 100, status: 'Available' });
  const { data: driversData } = useDriversList({ limit: 100 });

  // Mutations
  const { mutate: bookTrip, isPending: isBooking } = useCreateTrip();
  const { mutate: dispatchTrip, isPending: isDispatching } = useDispatchTrip();
  const { mutate: completeTrip, isPending: isCompleting } = useCompleteTrip();
  const { mutate: cancelTrip, isPending: isCancelling } = useCancelTrip();

  // React Hook Form for Booking Trip
  const {
    register: registerBook,
    handleSubmit: handleSubmitBook,
    watch: watchBook,
    reset: resetBook,
    setValue: setBookValue,
    formState: { errors: bookErrors },
  } = useForm({
    resolver: zodResolver(bookTripSchema),
    defaultValues: {
      source: '',
      destination: '',
      plannedDistance: '',
      vehicle: '',
      driver: '',
      cargoWeight: '',
      revenue: '',
    },
  });

  // React Hook Form for Completing Trip
  const {
    register: registerComplete,
    handleSubmit: handleSubmitComplete,
    reset: resetComplete,
    formState: { errors: completeErrors },
  } = useForm({
    resolver: zodResolver(completeTripSchema),
    defaultValues: {
      actualDistance: '',
      liters: '',
      fuelCost: '',
    },
  });

  const selectedVehicleId = watchBook('vehicle');
  const selectedDriverId = watchBook('driver');
  const watchCargoWeight = watchBook('cargoWeight');

  const availableVehicles = vehiclesData?.data || [];
  const allDrivers = driversData?.data || [];
  const availableDrivers = allDrivers.filter((d) => d.status === 'Available');

  // Client-side validations
  const matchedVehicle = availableVehicles.find((v) => v._id === selectedVehicleId);
  const matchedDriver = availableDrivers.find((d) => d._id === selectedDriverId);

  const isOverloaded = matchedVehicle && watchCargoWeight > matchedVehicle.maxLoadCapacity;
  const isDriverLowScore = matchedDriver && matchedDriver.safetyScore < 75;
  const isLicenseExpired = matchedDriver && new Date(matchedDriver.licenseExpiryDate) < new Date();

  const handleOpenBookModal = () => {
    resetBook();
    setBookStep(1);
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = (data) => {
    if (isOverloaded) {
      toast.error('Cannot book: Cargo weight exceeds assigned vehicle capacity!');
      return;
    }
    if (isLicenseExpired) {
      toast.error('Cannot book: Assigned driver license has expired!');
      return;
    }
    bookTrip(data, {
      onSuccess: (newTrip) => {
        setIsBookModalOpen(false);
        setSelectedTrip(newTrip);
      },
    });
  };

  const handleDispatch = (id) => {
    dispatchTrip(id, {
      onSuccess: (updated) => {
        setSelectedTrip(updated);
      },
    });
  };

  const handleCompleteSubmit = (data) => {
    completeTrip(
      { id: selectedTrip._id, data },
      {
        onSuccess: (updated) => {
          setIsCompleteModalOpen(false);
          resetComplete();
          setSelectedTrip(updated);
        },
      }
    );
  };

  const handleCancel = (id) => {
    cancelTrip(id, {
      onSuccess: (updated) => {
        setSelectedTrip(updated);
      },
    });
  };

  const isDispatcher = ['admin', 'dispatcher', 'fleet_manager'].includes(currentUser?.role);
  const trips = tripsData?.data || [];
  
  // Find current state of selected trip from query results to refresh visual states
  const activeTrip = selectedTrip ? trips.find((t) => t._id === selectedTrip._id) || selectedTrip : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">TRIP DISPATCHER</h1>
          <p className="text-xs text-gray-500">Book drafts, allocate drivers, and dispatch shipments</p>
        </div>
        {isDispatcher && (
          <Button variant="primary" size="sm" onClick={handleOpenBookModal}>
            <Plus className="h-4 w-4 mr-2" />
            Book Shipment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Dispatches List */}
        <Card className="lg:col-span-1 p-0 overflow-hidden flex flex-col max-h-[700px]">
          <div className="p-4 border-b border-border-thin bg-[#171717]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Board</h2>
            <span className="text-[10px] text-gray-500">List of system booked trips</span>
          </div>

          <div className="overflow-y-auto divide-y divide-border-thin">
            {loadingTrips ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 flex flex-col gap-2 animate-pulse bg-[#1a1a1a]/10 h-20" />
              ))
            ) : trips.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">No booked shipments.</div>
            ) : (
              trips.map((trip) => (
                <div
                  key={trip._id}
                  onClick={() => setSelectedTrip(trip)}
                  className={`p-4 flex flex-col gap-2 cursor-pointer transition-colors ${
                    activeTrip?._id === trip._id ? 'bg-accent-orange/5 border-l-2 border-accent-orange' : 'hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{trip.tripId}</span>
                    <Badge status={trip.status} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <span className="truncate">{trip.source}</span>
                    <ArrowRight className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{trip.destination}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                    <span>Distance: {trip.plannedDistance} km</span>
                    <span className="text-gray-400 font-semibold">${trip.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column: Dispatcher Actions & Timeline */}
        <div className="lg:col-span-2">
          {activeTrip ? (
            <Card className="flex flex-col gap-6">
              {/* Trip Header Status */}
              <div className="flex items-start justify-between border-b border-border-thin pb-4">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">Logistics ID</span>
                  <h2 className="text-xl font-bold text-white font-mono mt-0.5">{activeTrip.tripId}</h2>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge status={activeTrip.status} className="text-sm px-3 py-1" />
                  <span className="text-[10px] text-gray-500">Revenue payout: ${activeTrip.revenue.toLocaleString()}</span>
                </div>
              </div>

              {/* Path Routing Info */}
              <div className="grid grid-cols-2 gap-6 bg-[#171717] border border-border-thin p-4 rounded-sm">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Origin Point</span>
                  <span className="text-sm font-semibold text-white mt-1 block">{activeTrip.source}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Destination Target</span>
                  <span className="text-sm font-semibold text-white mt-1 block">{activeTrip.destination}</span>
                </div>
              </div>

              {/* Resource specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Card className="bg-[#121212] border-border-thin p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-accent-orange uppercase tracking-wider">
                    <Truck className="h-4 w-4" />
                    Allocated Vehicle
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {activeTrip.vehicle?.vehicleName || 'Vehicle record deleted'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Reg Number: {activeTrip.vehicle?.registrationNumber || 'N/A'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Odometer: {activeTrip.vehicle?.odometer?.toLocaleString() || 0} km
                    </p>
                  </div>
                </Card>

                <Card className="bg-[#121212] border-border-thin p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-accent-orange uppercase tracking-wider">
                    <User className="h-4 w-4" />
                    Allocated Driver
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {activeTrip.driver?.name || 'Driver record deleted'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      License Number: {activeTrip.driver?.licenseNumber || 'N/A'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Safety rating: {activeTrip.driver?.safetyScore || 0} / 100
                    </p>
                  </div>
                </Card>
              </div>

              {/* Step Workflow Visual Timeline */}
              <div className="flex flex-col gap-4 border-t border-border-thin pt-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Operational Dispatch Stage</h3>
                <div className="flex items-center justify-between w-full max-w-md mx-auto py-4 relative">
                  {/* Progress Line */}
                  <div className="absolute top-[28px] left-8 right-8 h-0.5 bg-[#2a2a2a] z-0" />
                  
                  {/* Step 1: Draft */}
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className="h-8 w-8 rounded-full bg-accent-orange text-white flex items-center justify-center font-bold text-xs select-none">
                      1
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Draft</span>
                  </div>

                  {/* Step 2: Dispatched */}
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs select-none ${
                      ['Dispatched', 'Completed'].includes(activeTrip.status) 
                        ? 'bg-accent-orange text-white' 
                        : 'bg-[#242424] text-gray-500 border border-[#333]'
                    }`}>
                      2
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Dispatched</span>
                  </div>

                  {/* Step 3: Finished */}
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs select-none ${
                      activeTrip.status === 'Completed' 
                        ? 'bg-emerald-500 text-white' 
                        : activeTrip.status === 'Cancelled'
                        ? 'bg-rose-500 text-white'
                        : 'bg-[#242424] text-gray-500 border border-[#333]'
                    }`}>
                      {activeTrip.status === 'Completed' ? <CheckCircle2 className="h-4 w-4" /> : activeTrip.status === 'Cancelled' ? <XCircle className="h-4 w-4" /> : '3'}
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                      {activeTrip.status === 'Cancelled' ? 'Cancelled' : 'Completed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Panel */}
              {isDispatcher && (
                <div className="flex flex-wrap gap-3 border-t border-border-thin pt-5 justify-end">
                  {activeTrip.status === 'Draft' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleCancel(activeTrip._id)} isLoading={isCancelling}>
                        Cancel Trip
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleDispatch(activeTrip._id)} isLoading={isDispatching}>
                        Dispatch Shipment
                      </Button>
                    </>
                  )}

                  {activeTrip.status === 'Dispatched' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleCancel(activeTrip._id)} isLoading={isCancelling}>
                        Cancel Dispatch
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setIsCompleteModalOpen(true)}>
                        Mark Completed
                      </Button>
                    </>
                  )}

                  {['Completed', 'Cancelled'].includes(activeTrip.status) && (
                    <span className="text-xs text-gray-500 font-semibold italic">
                      This dispatch has concluded and its state transitions are locked.
                    </span>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card className="py-20 text-center text-gray-500 flex flex-col items-center gap-3">
              <Compass className="h-10 w-10 text-gray-600" />
              <div>
                <h3 className="text-sm font-semibold text-white">No Shipment Selected</h3>
                <p className="text-xs text-gray-600 mt-1">Select an active trip from the sidebar board to view states.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Book shipment step-by-step Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg relative border-border-thin p-6 flex flex-col gap-5">
            <button
              onClick={() => setIsBookModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Book New Dispatch</h3>
              <p className="text-[11px] text-gray-500">Step {bookStep} of 2 - Assigning route & logistics assets</p>
            </div>

            <form onSubmit={handleSubmitBook(handleBookSubmit)} className="flex flex-col gap-4">
              {bookStep === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Source Location"
                      placeholder="New Delhi"
                      error={bookErrors.source?.message}
                      {...registerBook('source')}
                    />
                    <Input
                      label="Destination Target"
                      placeholder="Mumbai"
                      error={bookErrors.destination?.message}
                      {...registerBook('destination')}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Planned Distance (km)"
                      type="number"
                      placeholder="1420"
                      error={bookErrors.plannedDistance?.message}
                      {...registerBook('plannedDistance')}
                    />
                    <Input
                      label="Cargo Weight (kg)"
                      type="number"
                      placeholder="14000"
                      error={bookErrors.cargoWeight?.message}
                      {...registerBook('cargoWeight')}
                    />
                    <Input
                      label="Revenue Payout ($)"
                      type="number"
                      placeholder="8500"
                      error={bookErrors.revenue?.message}
                      {...registerBook('revenue')}
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setBookStep(2)}
                    >
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {bookStep === 2 && (
                <div className="flex flex-col gap-4">
                  {/* Select available vehicle */}
                  <Select
                    label="Assign Available Vehicle"
                    placeholder="Select vehicle"
                    error={bookErrors.vehicle?.message}
                    {...registerBook('vehicle')}
                  >
                    {availableVehicles.map((v) => (
                      <option key={v._id} value={v._id} className="bg-[#1f1f1f] text-gray-200">
                        {v.vehicleName} ({v.registrationNumber}) - Capacity: {v.maxLoadCapacity}kg
                      </option>
                    ))}
                  </Select>

                  {/* Overload Alert */}
                  {isOverloaded && (
                    <div className="p-3 bg-red-950/20 text-red-400 border border-red-800/40 rounded-sm text-xs flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warning: Cargo weight exceeds selected vehicle load capacity!
                    </div>
                  )}

                  {/* Select available driver */}
                  <Select
                    label="Assign Available Driver"
                    placeholder="Select driver"
                    error={bookErrors.driver?.message}
                    {...registerBook('driver')}
                  >
                    {availableDrivers.map((d) => (
                      <option key={d._id} value={d._id} className="bg-[#1f1f1f] text-gray-200">
                        {d.name} (Safety Score: {d.safetyScore}/100)
                      </option>
                    ))}
                  </Select>

                  {/* License Expired Alert */}
                  {isLicenseExpired && (
                    <div className="p-3 bg-red-950/20 text-red-400 border border-red-800/40 rounded-sm text-xs flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Error: Assigned driver has an expired driving license!
                    </div>
                  )}

                  {/* Driver low score warn */}
                  {isDriverLowScore && (
                    <div className="p-3 bg-amber-950/20 text-amber-400 border border-amber-800/40 rounded-sm text-xs flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Caution: Selected driver has a low safety rating score ({matchedDriver.safetyScore}).
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setBookStep(1)}>
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isBooking}
                      disabled={isOverloaded || isLicenseExpired}
                    >
                      Book Draft Shipment
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Card>
        </div>
      )}

      {/* Complete Shipment Modal Form */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000]/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm relative border-border-thin p-6 flex flex-col gap-5">
            <button
              onClick={() => setIsCompleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Close Dispatch Trip</h3>
              <p className="text-[11px] text-gray-500">Record final mileage metrics and fuel logs</p>
            </div>

            <form onSubmit={handleSubmitComplete(handleCompleteSubmit)} className="flex flex-col gap-4">
              <Input
                label="Actual Distance Traveled (km)"
                type="number"
                placeholder="1435"
                error={completeErrors.actualDistance?.message}
                disabled={isCompleting}
                {...registerComplete('actualDistance')}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Fuel Consumed (L)"
                  type="number"
                  placeholder="350"
                  error={completeErrors.liters?.message}
                  disabled={isCompleting}
                  {...registerComplete('liters')}
                />
                <Input
                  label="Total Fuel Cost ($)"
                  type="number"
                  placeholder="1200"
                  error={completeErrors.fuelCost?.message}
                  disabled={isCompleting}
                  {...registerComplete('fuelCost')}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={() => setIsCompleteModalOpen(false)} disabled={isCompleting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isCompleting}>
                  Confirm Complete
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TripDispatcherPage;
