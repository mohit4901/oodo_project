import mongoose from 'mongoose';
import { FuelLog } from './fuel.model.js';
import { Expense } from './expense.model.js';
import { Vehicle } from '../vehicle-registry/vehicle.model.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { auditService } from '../audit/audit.service.js';

class ExpenseService {
  /**
   * Log a new fuel entry (creates FuelLog & corresponding Expense)
   */
  async logFuel(fuelData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const vehicle = await Vehicle.findOne({ _id: fuelData.vehicle, isActive: true }).session(session);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Create Fuel Log
      const fuelLog = new FuelLog({
        ...fuelData,
        createdBy: userId,
      });

      // Mirror as an item in the unified Expense ledger
      const fuelExpense = new Expense({
        vehicle: fuelData.vehicle,
        category: 'Fuel',
        cost: fuelData.cost,
        date: fuelData.date || new Date(),
        description: `Fuel consumption: ${fuelData.liters} liters. Log ref: ${fuelLog._id}`,
        createdBy: userId,
      });

      await Promise.all([
        fuelLog.save({ session }),
        fuelExpense.save({ session }),
      ]);

      await auditService.log({
        user: userId,
        action: 'FUEL_ADDED',
        entity: 'FuelLog',
        entityId: fuelLog._id,
        newValue: fuelLog.toObject(),
      });

      await session.commitTransaction();
      return fuelLog;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Log a general operational expense (tolls, repair, insurance, payouts, etc.)
   */
  async logExpense(expenseData, userId) {
    const vehicle = await Vehicle.findOne({ _id: expenseData.vehicle, isActive: true });
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    const expense = new Expense({
      ...expenseData,
      createdBy: userId,
    });

    const savedExpense = await expense.save();

    await auditService.log({
      user: userId,
      action: 'EXPENSE_ADDED',
      entity: 'Expense',
      entityId: savedExpense._id,
      newValue: savedExpense.toObject(),
    });

    return savedExpense;
  }

  /**
   * Fetch cumulative operational cost and breakdown per vehicle
   */
  async getVehicleTotalOperationalCost(vehicleId) {
    const vehicleExists = await Vehicle.findOne({ _id: vehicleId, isActive: true });
    if (!vehicleExists) {
      throw new NotFoundError('Vehicle not found');
    }

    // Aggregate expense ledger by category
    const costAgg = await Expense.aggregate([
      { $match: { vehicle: new mongoose.Types.ObjectId(vehicleId) } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$cost' },
        },
      },
    ]);

    const breakdown = {
      Fuel: 0,
      Maintenance: 0,
      Tolls: 0,
      Repair: 0,
      Insurance: 0,
      'Driver Payout': 0,
      Other: 0,
    };

    let grandTotal = 0;
    costAgg.forEach((item) => {
      if (item._id in breakdown) {
        breakdown[item._id] = item.total;
        grandTotal += item.total;
      }
    });

    return {
      vehicleId,
      totalOperationalCost: grandTotal,
      breakdown,
    };
  }

  /**
   * Query all fuel logs with pagination
   */
  async getFuelLogs({ vehicleId, page = 1, limit = 10 }) {
    const query = {};
    if (vehicleId) query.vehicle = vehicleId;

    const skip = (page - 1) * limit;

    const queryExec = FuelLog.find(query)
      .populate('vehicle', 'registrationNumber vehicleName type')
      .populate('trip', 'tripId source destination')
      .sort('-date')
      .skip(skip)
      .limit(limit)
      .lean();

    const totalExec = FuelLog.countDocuments(query);

    const [data, total] = await Promise.all([queryExec, totalExec]);

    return {
      fuelLogs: data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Query all expenses with pagination
   */
  async getExpenses({ vehicleId, category, page = 1, limit = 10 }) {
    const query = {};
    if (vehicleId) query.vehicle = vehicleId;
    if (category) query.category = category;

    const skip = (page - 1) * limit;

    const queryExec = Expense.find(query)
      .populate('vehicle', 'registrationNumber vehicleName type')
      .sort('-date')
      .skip(skip)
      .limit(limit)
      .lean();

    const totalExec = Expense.countDocuments(query);

    const [data, total] = await Promise.all([queryExec, totalExec]);

    return {
      expenses: data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export const expenseService = new ExpenseService();
export default expenseService;
