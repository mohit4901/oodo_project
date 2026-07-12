import mongoose from 'mongoose';
import { MaintenanceLog } from './maintenance.model.js';
import { Vehicle } from '../vehicle-registry/vehicle.model.js';
import { Expense } from '../fuel-expense-management/expense.model.js';
import { BadRequestError } from '../../errors/BadRequestError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { auditService } from '../audit/audit.service.js';

class MaintenanceService {
  /**
   * Log vehicle into maintenance (transitions vehicle -> 'In Shop')
   */
  async createMaintenanceLog(logData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const vehicle = await Vehicle.findOne({ _id: logData.vehicle, isActive: true }).session(session);
      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }

      // Vehicles on trip or retired cannot be logged into maintenance
      if (vehicle.status === 'On Trip') {
        throw new BadRequestError(`Vehicle ${vehicle.registrationNumber} is currently on an active trip and cannot enter maintenance.`);
      }
      if (vehicle.status === 'Retired') {
        throw new BadRequestError(`Vehicle ${vehicle.registrationNumber} is retired and cannot enter maintenance.`);
      }

      const newLog = new MaintenanceLog({
        ...logData,
        status: 'Active',
        createdBy: userId,
      });

      // Update vehicle status to 'In Shop'
      vehicle.status = 'In Shop';
      vehicle.statusHistory.push({
        status: 'In Shop',
        changedAt: new Date(),
        changedBy: userId,
        comment: `Maintenance started: ${logData.description}`,
      });

      await Promise.all([
        newLog.save({ session }),
        vehicle.save({ session }),
      ]);

      await auditService.log({
        user: userId,
        action: 'MAINTENANCE_STARTED',
        entity: 'MaintenanceLog',
        entityId: newLog._id,
        newValue: newLog.toObject(),
      });

      await session.commitTransaction();
      return newLog;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Close maintenance log (restores vehicle -> 'Available', logs cost as an Expense)
   */
  async closeMaintenanceLog(logId, closingData, userId) {
    const { cost, description } = closingData;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const log = await MaintenanceLog.findById(logId).session(session);
      if (!log) {
        throw new NotFoundError('Maintenance log not found');
      }

      if (log.status === 'Completed') {
        throw new BadRequestError('This maintenance log is already completed');
      }

      const vehicle = await Vehicle.findOne({ _id: log.vehicle, isActive: true }).session(session);
      if (!vehicle) {
        throw new NotFoundError('Associated vehicle not found');
      }

      // Update log fields
      log.status = 'Completed';
      log.endDate = new Date();
      log.cost = cost;
      log.updatedBy = userId;

      // Restore vehicle status (unless it has been retired during maintenance)
      if (vehicle.status !== 'Retired') {
        vehicle.status = 'Available';
        vehicle.statusHistory.push({
          status: 'Available',
          changedAt: new Date(),
          changedBy: userId,
          comment: `Maintenance closed: ${description || log.description}`,
        });
      }

      // Automatically register cost under Expense ledger
      const maintenanceExpense = new Expense({
        vehicle: vehicle._id,
        category: 'Maintenance',
        cost: cost,
        date: new Date(),
        description: `Closed maintenance ref: ${log._id}. ${description || log.description}`,
        createdBy: userId,
      });

      await Promise.all([
        log.save({ session }),
        vehicle.save({ session }),
        maintenanceExpense.save({ session }),
      ]);

      await auditService.log({
        user: userId,
        action: 'MAINTENANCE_CLOSED',
        entity: 'MaintenanceLog',
        entityId: log._id,
        newValue: { cost, status: 'Completed' },
      });

      await session.commitTransaction();
      return log;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Retrieve paginated maintenance logs
   */
  async getAllLogs({ vehicleId, status, page = 1, limit = 10 }) {
    const query = {};
    if (vehicleId) query.vehicle = vehicleId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const queryExec = MaintenanceLog.find(query)
      .populate('vehicle', 'registrationNumber vehicleName type status')
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .sort('-startDate')
      .skip(skip)
      .limit(limit)
      .lean();

    const totalExec = MaintenanceLog.countDocuments(query);

    const [data, total] = await Promise.all([queryExec, totalExec]);

    return {
      logs: data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve details of a log
   */
  async getLogById(logId) {
    const log = await MaintenanceLog.findById(logId)
      .populate('vehicle', 'registrationNumber vehicleName type status')
      .populate('createdBy', 'name email role');
      
    if (!log) {
      throw new NotFoundError('Maintenance log not found');
    }
    return log;
  }
}

export const maintenanceService = new MaintenanceService();
export default maintenanceService;
