import { Driver } from './driver.model.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { auditService } from '../audit/audit.service.js';

class DriverService {
  /**
   * Register a new driver
   */
  async createDriver(driverData, userId) {
    const licenseNo = driverData.licenseNumber.trim();

    // Enforce unique license number constraint
    const existingDriver = await Driver.findOne({ licenseNumber: licenseNo, isActive: true });
    if (existingDriver) {
      throw new ConflictError(`Driver with license number '${licenseNo}' already exists`);
    }

    const newDriver = new Driver({
      ...driverData,
      licenseNumber: licenseNo,
      createdBy: userId,
    });

    const savedDriver = await newDriver.save();

    // Log audit trail
    await auditService.log({
      user: userId,
      action: 'DRIVER_CREATED',
      entity: 'Driver',
      entityId: savedDriver._id,
      newValue: savedDriver.toObject(),
    });

    return savedDriver;
  }

  /**
   * Update driver profile details & status
   */
  async updateDriver(driverId, updateData, userId) {
    const driver = await Driver.findOne({ _id: driverId, isActive: true });
    if (!driver) {
      throw new NotFoundError('Driver not found');
    }

    const oldVal = driver.toObject();

    // Check unique license constraint if it's changing
    if (updateData.licenseNumber) {
      const licenseNo = updateData.licenseNumber.trim();
      if (licenseNo !== driver.licenseNumber) {
        const duplicate = await Driver.findOne({ licenseNumber: licenseNo, isActive: true });
        if (duplicate) {
          throw new ConflictError(`Driver with license number '${licenseNo}' already exists`);
        }
        driver.licenseNumber = licenseNo;
      }
    }

    // Monitor status transitions and log to history
    if (updateData.status && updateData.status !== driver.status) {
      driver.statusHistory.push({
        status: updateData.status,
        changedAt: new Date(),
        changedBy: userId,
        comment: updateData.statusComment || 'Manual status adjustment',
      });
      driver.status = updateData.status;
    }

    // Update other fields
    const fieldsToUpdate = ['name', 'licenseCategory', 'licenseExpiryDate', 'contactNumber', 'safetyScore'];
    fieldsToUpdate.forEach((field) => {
      if (updateData[field] !== undefined) {
        driver[field] = updateData[field];
      }
    });

    driver.updatedBy = userId;
    const updatedDriver = await driver.save();

    // Log audit trail
    await auditService.log({
      user: userId,
      action: 'DRIVER_UPDATED',
      entity: 'Driver',
      entityId: updatedDriver._id,
      oldValue: oldVal,
      newValue: updatedDriver.toObject(),
    });

    return updatedDriver;
  }

  /**
   * Get a driver by ID
   */
  async getDriverById(driverId) {
    const driver = await Driver.findOne({ _id: driverId, isActive: true })
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    if (!driver) {
      throw new NotFoundError('Driver not found');
    }
    return driver;
  }

  /**
   * Query drivers list with search, sorting, and compliance filters
   */
  async getAllDrivers({ search, page = 1, limit = 10, sort = '-createdAt', status, licenseCategory, isExpired }) {
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;
    if (licenseCategory) query.licenseCategory = licenseCategory;

    // Filter to check for expired or near-expired licenses
    if (isExpired === 'true') {
      query.licenseExpiryDate = { $lt: new Date() };
    } else if (isExpired === 'false') {
      query.licenseExpiryDate = { $gte: new Date() };
    }

    const skip = (page - 1) * limit;

    const queryExec = Driver.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalExec = Driver.countDocuments(query);

    const [data, total] = await Promise.all([queryExec, totalExec]);

    // Format output with isLicenseExpired flag computed for lean queries
    const driversWithFlags = data.map((d) => ({
      ...d,
      isLicenseExpired: d.licenseExpiryDate < new Date(),
    }));

    return {
      drivers: driversWithFlags,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Soft-delete a driver profile
   */
  async deleteDriver(driverId, userId) {
    const driver = await Driver.findOne({ _id: driverId, isActive: true });
    if (!driver) {
      throw new NotFoundError('Driver not found');
    }

    driver.isActive = false;
    driver.updatedBy = userId;
    await driver.save();

    await auditService.log({
      user: userId,
      action: 'DRIVER_DELETED',
      entity: 'Driver',
      entityId: driverId,
      oldValue: { name: driver.name, licenseNumber: driver.licenseNumber },
    });

    return true;
  }

  /**
   * Driver safety overview aggregates for dashboards
   */
  async getDriverSafetySummary() {
    const aggregates = await Driver.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          averageSafetyScore: { $avg: '$safetyScore' },
          totalDrivers: { $sum: 1 },
          suspendedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Suspended'] }, 1, 0] },
          },
          expiredLicenses: {
            $sum: { $cond: [{ $lt: ['$licenseExpiryDate', new Date()] }, 1, 0] },
          },
        },
      },
    ]);

    return aggregates[0] || { averageSafetyScore: 100, totalDrivers: 0, suspendedCount: 0, expiredLicenses: 0 };
  }
}

export const driverService = new DriverService();
export default driverService;
