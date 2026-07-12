import mongoose from 'mongoose';
import { Trip } from './trip.model.js';
import { Vehicle } from '../vehicle-registry/vehicle.model.js';
import { Driver } from '../driver-safety-profile/driver.model.js';
import { FuelLog } from '../fuel-expense-management/fuel.model.js';
import { BadRequestError } from '../../errors/BadRequestError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { auditService } from '../audit/audit.service.js';

class TripService {
  /**
   * Create a new trip in Draft state
   */
  async createTrip(tripData, userId) {
    const tripCount = await Trip.countDocuments();
    const generatedTripId = `TR-${10000 + tripCount + 1}`;

    const newTrip = new Trip({
      ...tripData,
      tripId: generatedTripId,
      status: 'Draft',
      createdBy: userId,
    });

    const savedTrip = await newTrip.save();

    await auditService.log({
      user: userId,
      action: 'TRIP_CREATED',
      entity: 'Trip',
      entityId: savedTrip._id,
      newValue: savedTrip.toObject(),
    });

    return savedTrip;
  }

  /**
   * Transition trip to DISPATCHED state using Mongoose Transaction
   */
  async dispatchTrip(tripId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const trip = await Trip.findOne({ _id: tripId, isActive: true }).session(session);
      if (!trip) {
        throw new NotFoundError('Trip not found');
      }

      if (trip.status !== 'Draft') {
        throw new BadRequestError(`Cannot dispatch a trip in '${trip.status}' status`);
      }

      const [vehicle, driver] = await Promise.all([
        Vehicle.findOne({ _id: trip.vehicle, isActive: true }).session(session),
        Driver.findOne({ _id: trip.driver, isActive: true }).session(session),
      ]);

      if (!vehicle) throw new NotFoundError('Assigned vehicle not found');
      if (!driver) throw new NotFoundError('Assigned driver not found');

      // Enforce operational constraints
      // 1. Vehicle status checks
      if (vehicle.status !== 'Available') {
        throw new BadRequestError(`Vehicle ${vehicle.registrationNumber} is not available (Status: ${vehicle.status})`);
      }

      // 2. Driver status and compliance checks
      if (driver.status !== 'Available') {
        throw new BadRequestError(`Driver ${driver.name} is not available (Status: ${driver.status})`);
      }
      if (driver.licenseExpiryDate < new Date()) {
        throw new BadRequestError(`Driver ${driver.name} has an expired driving license`);
      }

      // 3. Cargo load constraint check
      if (trip.cargoWeight > vehicle.maxLoadCapacity) {
        throw new BadRequestError(`Cargo weight (${trip.cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacity} kg)`);
      }

      // Make updates
      trip.status = 'Dispatched';
      trip.dispatchDate = new Date();
      trip.updatedBy = userId;

      vehicle.status = 'On Trip';
      vehicle.statusHistory.push({
        status: 'On Trip',
        changedAt: new Date(),
        changedBy: userId,
        comment: `Trip ${trip.tripId} dispatched`,
      });

      driver.status = 'On Trip';
      driver.statusHistory.push({
        status: 'On Trip',
        changedAt: new Date(),
        changedBy: userId,
        comment: `Trip ${trip.tripId} dispatched`,
      });

      await Promise.all([
        trip.save({ session }),
        vehicle.save({ session }),
        driver.save({ session }),
      ]);

      await auditService.log({
        user: userId,
        action: 'TRIP_DISPATCHED',
        entity: 'Trip',
        entityId: trip._id,
        newValue: { tripId: trip.tripId, vehicleId: vehicle._id, driverId: driver._id },
      });

      await session.commitTransaction();
      return trip;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Transition trip to COMPLETED state using Mongoose Transaction
   */
  async completeTrip(tripId, completionData, userId) {
    const { actualDistance, liters, fuelCost } = completionData;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const trip = await Trip.findOne({ _id: tripId, isActive: true }).session(session);
      if (!trip) {
        throw new NotFoundError('Trip not found');
      }

      if (trip.status !== 'Dispatched') {
        throw new BadRequestError(`Cannot complete a trip in '${trip.status}' status`);
      }

      const [vehicle, driver] = await Promise.all([
        Vehicle.findOne({ _id: trip.vehicle, isActive: true }).session(session),
        Driver.findOne({ _id: trip.driver, isActive: true }).session(session),
      ]);

      if (!vehicle) throw new NotFoundError('Vehicle reference missing');
      if (!driver) throw new NotFoundError('Driver reference missing');

      // Make updates
      trip.status = 'Completed';
      trip.completedDate = new Date();
      trip.actualDistance = actualDistance;
      trip.updatedBy = userId;

      // Update vehicle odometer and status
      vehicle.status = 'Available';
      vehicle.odometer += actualDistance;
      vehicle.statusHistory.push({
        status: 'Available',
        changedAt: new Date(),
        changedBy: userId,
        comment: `Trip ${trip.tripId} completed. Odometer updated.`,
      });

      // Update driver status
      driver.status = 'Available';
      driver.statusHistory.push({
        status: 'Available',
        changedAt: new Date(),
        changedBy: userId,
        comment: `Trip ${trip.tripId} completed.`,
      });

      // Create Fuel Log entry automatically
      const newFuelLog = new FuelLog({
        vehicle: vehicle._id,
        liters,
        cost: fuelCost,
        date: new Date(),
        trip: trip._id,
        createdBy: userId,
      });

      await Promise.all([
        trip.save({ session }),
        vehicle.save({ session }),
        driver.save({ session }),
        newFuelLog.save({ session }),
      ]);

      await auditService.log({
        user: userId,
        action: 'TRIP_COMPLETED',
        entity: 'Trip',
        entityId: trip._id,
        newValue: { tripId: trip.tripId, actualDistance, liters, fuelCost },
      });

      await session.commitTransaction();
      return trip;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Transition trip to CANCELLED state
   */
  async cancelTrip(tripId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const trip = await Trip.findOne({ _id: tripId, isActive: true }).session(session);
      if (!trip) {
        throw new NotFoundError('Trip not found');
      }

      if (trip.status === 'Completed' || trip.status === 'Cancelled') {
        throw new BadRequestError(`Cannot cancel a trip already in '${trip.status}' status`);
      }

      const isDispatched = trip.status === 'Dispatched';

      // Update trip details
      trip.status = 'Cancelled';
      trip.updatedBy = userId;
      await trip.save({ session });

      // If trip was active/dispatched, restore vehicle & driver availability
      if (isDispatched) {
        const [vehicle, driver] = await Promise.all([
          Vehicle.findOne({ _id: trip.vehicle, isActive: true }).session(session),
          Driver.findOne({ _id: trip.driver, isActive: true }).session(session),
        ]);

        if (vehicle) {
          vehicle.status = 'Available';
          vehicle.statusHistory.push({
            status: 'Available',
            changedAt: new Date(),
            changedBy: userId,
            comment: `Trip ${trip.tripId} cancelled. Status restored.`,
          });
          await vehicle.save({ session });
        }

        if (driver) {
          driver.status = 'Available';
          driver.statusHistory.push({
            status: 'Available',
            changedAt: new Date(),
            changedBy: userId,
            comment: `Trip ${trip.tripId} cancelled. Status restored.`,
          });
          await driver.save({ session });
        }
      }

      await auditService.log({
        user: userId,
        action: 'TRIP_CANCELLED',
        entity: 'Trip',
        entityId: trip._id,
        newValue: { tripId: trip.tripId },
      });

      await session.commitTransaction();
      return trip;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Query trips list
   */
  async getAllTrips({ search, page = 1, limit = 10, sort = '-createdAt', status }) {
    const query = { isActive: true };

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { tripId: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const queryExec = Trip.find(query)
      .populate('vehicle', 'registrationNumber vehicleName type maxLoadCapacity')
      .populate('driver', 'name licenseNumber contactNumber safetyScore status')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalExec = Trip.countDocuments(query);

    const [data, total] = await Promise.all([queryExec, totalExec]);

    return {
      trips: data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a trip by ID
   */
  async getTripById(tripId) {
    const trip = await Trip.findOne({ _id: tripId, isActive: true })
      .populate('vehicle', 'registrationNumber vehicleName type maxLoadCapacity odometer')
      .populate('driver', 'name licenseNumber contactNumber safetyScore status')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }
    return trip;
  }
}

export const tripService = new TripService();
export default tripService;
