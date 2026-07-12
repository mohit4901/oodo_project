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
import { AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── status badge ───────────────────────────────────────────────── */
const BADGE_STYLES = {
  Draft:      'bg-[#333] text-gray-300',
  Dispatched: 'bg-sky-700 text-sky-200',
  'On Trip':  'bg-sky-600 text-white',
  Completed:  'bg-emerald-700 text-emerald-100',
  Cancelled:  'bg-red-900/60 text-red-400',
};

function StatusBadge({ status }) {
  const cls = BADGE_STYLES[status] ?? 'bg-[#333] text-gray-400';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-bold tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

/* ── lifecycle step dots ─────────────────────────────────────────── */
const STEPS = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
function TripLifecycle({ status }) {
  const activeIdx = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STEPS.slice(0, 3).map((step, i) => {
        const done = i <= activeIdx && status !== 'Cancelled';
        const isCancelled = status === 'Cancelled';
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div className={`h-2.5 w-2.5 rounded-full border ${
                done ? 'bg-accent-orange border-accent-orange' :
                (isCancelled && step === 'Cancelled') ? 'bg-red-500 border-red-500' :
                'bg-[#2a2a2a] border-[#444]'
              }`} />
              <span className={`text-[8px] uppercase tracking-wide ${done ? 'text-accent-orange' : 'text-gray-600'}`}>
                {step}
              </span>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mb-3 w-6 ${i < activeIdx ? 'bg-accent-orange' : 'bg-[#333]'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── validation ─────────────────────────────────────────────────── */
const bookSchema = zod.object({
  source:          zod.string().min(2, 'Source is required').trim(),
  destination:     zod.string().min(2, 'Destination is required').trim(),
  vehicle:         zod.string().nonempty('Assign a vehicle'),
  driver:          zod.string().nonempty('Assign a driver'),
  cargoWeight:     zod.coerce.number().positive('Cargo weight required'),
  plannedDistance: zod.coerce.number().positive('Planned distance required'),
  revenue:         zod.coerce.number().nonnegative('Revenue cannot be negative').default(0),
});

const completeSchema = zod.object({
  actualDistance: zod.coerce.number().positive('Actual distance required'),
  liters:         zod.coerce.number().positive('Fuel consumed required'),
  fuelCost:       zod.coerce.number().positive('Fuel cost required'),
});

/* ═══════════════════════════════════════════════════════════════════ */
export const TripDispatcherPage = () => {
  const { user } = useAuth();
  const [completeModal, setCompleteModal] = useState(null); // holds trip object
  const isDispatcher = ['admin', 'dispatcher', 'fleet_manager'].includes(user?.role);

  /* queries */
  const { data: tripsData,   isLoading: loadingTrips } = useTripsList({ limit: 50 });
  const { data: vehiclesData }                          = useVehiclesList({ limit: 100, status: 'Available' });
  const { data: driversData }                          = useDriversList({ limit: 100 });

  /* mutations */
  const { mutate: bookTrip,     isPending: isBooking     } = useCreateTrip();
  const { mutate: dispatchTrip, isPending: isDispatching } = useDispatchTrip();
  const { mutate: completeTrip, isPending: isCompleting  } = useCompleteTrip();
  const { mutate: cancelTrip,   isPending: isCancelling  } = useCancelTrip();

  /* book form */
  const {
    register: rb, handleSubmit: hb, watch: wb, reset: resetBook,
    formState: { errors: be },
  } = useForm({ resolver: zodResolver(bookSchema), defaultValues: {
    source: '', destination: '', vehicle: '', driver: '',
    cargoWeight: '', plannedDistance: '', revenue: 0,
  }});

  /* complete form */
  const {
    register: rc, handleSubmit: hc, reset: resetComplete,
    formState: { errors: ce },
  } = useForm({ resolver: zodResolver(completeSchema), defaultValues: {
    actualDistance: '', liters: '', fuelCost: '',
  }});

  const trips            = tripsData?.data        ?? [];
  const availableVehicles = vehiclesData?.data    ?? [];
  const allDrivers        = driversData?.data     ?? [];
  const availableDrivers  = allDrivers.filter(d => d.status === 'Available');

  const selVehicleId  = wb('vehicle');
  const selDriverId   = wb('driver');
  const cargoWeight   = wb('cargoWeight');
  const matchedVeh    = availableVehicles.find(v => v._id === selVehicleId);
  const matchedDrv    = availableDrivers.find(d => d._id === selDriverId);
  const overloaded    = matchedVeh && Number(cargoWeight) > matchedVeh.maxLoadCapacity;
  const licExpired    = matchedDrv && new Date(matchedDrv.licenseExpiryDate) < new Date();

  const handleBookSubmit = (data) => {
    if (overloaded) { toast.error('Cargo exceeds vehicle capacity — dispatch blocked!'); return; }
    if (licExpired) { toast.error('Driver license has expired!'); return; }
    bookTrip(data, { onSuccess: () => { resetBook(); toast.success('Trip drafted!'); }});
  };

  const handleCompleteSubmit = (data) => {
    completeTrip({ id: completeModal._id, data }, {
      onSuccess: () => { setCompleteModal(null); resetComplete(); },
    });
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-wide uppercase">Trip Dispatcher</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">Book drafts, assign vehicles &amp; drivers, dispatch shipments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ── LEFT: Create Trip form ── */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2a2a2a] flex items-center gap-4">
            <span className="text-xs font-bold text-white uppercase tracking-widest">Trip Lifecycle</span>
            <TripLifecycle status="Draft" />
          </div>

          <div className="p-5 flex flex-col gap-3">
            <h3 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Create Trip</h3>

            <form onSubmit={hb(handleBookSubmit)} className="flex flex-col gap-3">

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest">Source</label>
                <input {...rb('source')} placeholder="Gandhinagar Depot"
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange placeholder:text-gray-700" />
                {be.source && <span className="text-[10px] text-red-400">{be.source.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest">Destination</label>
                <input {...rb('destination')} placeholder="Ahmedabad Hub"
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange placeholder:text-gray-700" />
                {be.destination && <span className="text-[10px] text-red-400">{be.destination.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest">Vehicle (Available Only)</label>
                <select {...rb('vehicle')}
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange cursor-pointer">
                  <option value="">Select vehicle</option>
                  {availableVehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.vehicleName} – {v.maxLoadCapacity} kg capacity</option>
                  ))}
                </select>
                {be.vehicle && <span className="text-[10px] text-red-400">{be.vehicle.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest">Driver (Available Only)</label>
                <select {...rb('driver')}
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange cursor-pointer">
                  <option value="">Select driver</option>
                  {availableDrivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
                {be.driver && <span className="text-[10px] text-red-400">{be.driver.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">Cargo Weight (kg)</label>
                  <input {...rb('cargoWeight')} type="number" placeholder="700"
                    className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange placeholder:text-gray-700" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">Planned Distance (km)</label>
                  <input {...rb('plannedDistance')} type="number" placeholder="35"
                    className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange placeholder:text-gray-700" />
                </div>
              </div>

              {/* validation alerts */}
              {overloaded && (
                <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-sm text-[10px] text-red-400 flex flex-col gap-0.5">
                  <span>Vehicle Capacity: {matchedVeh.maxLoadCapacity} kg</span>
                  <span>Cargo Weight: {cargoWeight} kg</span>
                  <span className="font-bold flex items-center gap-1">
                    <X className="h-3 w-3" /> Capacity exceeded by {Number(cargoWeight) - matchedVeh.maxLoadCapacity} kg — dispatch blocked
                  </span>
                </div>
              )}
              {licExpired && (
                <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-sm text-[10px] text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" /> Driver license expired
                </div>
              )}

              {isDispatcher && (
                <button
                  type="submit"
                  disabled={isBooking || overloaded || licExpired}
                  className="w-full py-2.5 mt-1 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-xs font-bold rounded-sm border border-[#3a3a3a] disabled:opacity-40 transition-colors"
                >
                  {isBooking ? 'Booking…' : 'Dispatch (disabled)'}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* ── RIGHT: Live Board ── */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-[#2a2a2a]">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest">Live Board</h2>
          </div>

          <div className="divide-y divide-[#222] overflow-y-auto max-h-[600px]">
            {loadingTrips ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 h-20 animate-pulse bg-[#1a1a1a]" />
              ))
            ) : trips.length === 0 ? (
              <div className="p-12 text-center text-gray-600 text-xs">
                No trips booked. Create a dispatch using the form.
              </div>
            ) : (
              trips.map((trip) => (
                <div key={trip._id} className="p-4 flex flex-col gap-2 hover:bg-[#1f1f1f] transition-colors">
                  {/* Trip ID & vehicle/driver */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-white text-xs">{trip.tripId}</span>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {trip.vehicle?.registrationNumber ?? 'No vehicle'} / {trip.driver?.name ?? 'Unassigned'}
                      </p>
                    </div>
                    <StatusBadge status={trip.status} />
                  </div>

                  {/* Route */}
                  <p className="text-[11px] text-gray-300">
                    {trip.source} → {trip.destination}
                  </p>

                  {/* Note / eta */}
                  <p className="text-[10px] text-gray-600 italic">
                    {trip.status === 'Draft'      ? 'Awaiting driver'         :
                     trip.status === 'Dispatched' ? '~45 min estimated'       :
                     trip.status === 'Completed'  ? 'Vehicle sent to shop'    :
                     trip.status === 'Cancelled'  ? 'Vehicle sent to shop'    : ''}
                  </p>

                  {/* Action buttons */}
                  {isDispatcher && (
                    <div className="flex gap-2 mt-1">
                      {trip.status === 'Draft' && (
                        <>
                          <button
                            onClick={() => dispatchTrip(trip._id)}
                            disabled={isDispatching}
                            className="px-3 py-1 bg-sky-700 hover:bg-sky-600 text-white text-[10px] font-bold rounded-sm disabled:opacity-40"
                          >
                            Dispatch
                          </button>
                          <button
                            onClick={() => cancelTrip(trip._id)}
                            disabled={isCancelling}
                            className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#333] text-gray-400 text-[10px] rounded-sm disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {trip.status === 'Dispatched' && (
                        <>
                          <button
                            onClick={() => setCompleteModal(trip)}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-sm"
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => cancelTrip(trip._id)}
                            disabled={isCancelling}
                            className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#333] text-gray-400 text-[10px] rounded-sm"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-2 border-t border-[#2a2a2a] text-[9px] text-gray-600">
            On Complete: odometer → fuel log → expenses → Vehicle &amp; Driver Available
          </div>
        </div>
      </div>

      {/* ── Complete Trip Modal ── */}
      {completeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-sm w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase">Close Trip</h3>
              <button onClick={() => setCompleteModal(null)} className="text-gray-500 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-500">Record final mileage &amp; fuel for trip {completeModal.tripId}</p>

            <form onSubmit={hc(handleCompleteSubmit)} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-500 uppercase tracking-widest">Actual Distance (km)</label>
                <input {...rc('actualDistance')} type="number" placeholder="1435"
                  className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange" />
                {ce.actualDistance && <span className="text-[10px] text-red-400">{ce.actualDistance.message}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">Fuel (L)</label>
                  <input {...rc('liters')} type="number" placeholder="350"
                    className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-500 uppercase tracking-widest">Fuel Cost (₹)</label>
                  <input {...rc('fuelCost')} type="number" placeholder="1200"
                    className="bg-[#141414] border border-[#2a2a2a] text-gray-300 text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-accent-orange" />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setCompleteModal(null)}
                  className="px-4 py-2 text-xs text-gray-400 border border-[#333] rounded-sm hover:bg-[#252525]">
                  Cancel
                </button>
                <button type="submit" disabled={isCompleting}
                  className="px-4 py-2 text-xs font-bold bg-accent-orange hover:bg-orange-500 text-white rounded-sm disabled:opacity-50">
                  {isCompleting ? 'Saving…' : 'Confirm Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDispatcherPage;
