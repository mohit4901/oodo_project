import { Vehicle } from './vehicle.model.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { auditService } from '../audit/audit.service.js';

class VehicleService {
  /**
   * Register a new vehicle
   */
  async createVehicle(vehicleData, userId) {
    const regNo = vehicleData.registrationNumber.toUpperCase().trim();
    
    // Enforce unique registration number constraint
    const existingVehicle = await Vehicle.findOne({ registrationNumber: regNo, isActive: true });
    if (existingVehicle) {
      throw new ConflictError(`Vehicle with registration number '${regNo}' already exists`);
    }

    const newVehicle = new Vehicle({
      ...vehicleData,
      registrationNumber: regNo,
      createdBy: userId,
    });

    const savedVehicle = await newVehicle.save();

    // Log audit trail
    await auditService.log({
      user: userId,
      action: 'VEHICLE_CREATED',
      entity: 'Vehicle',
      entityId: savedVehicle._id,
      newValue: savedVehicle.toObject(),
    });

    return savedVehicle;
  }

  /**
   * Update vehicle registry details
   */
  async updateVehicle(vehicleId, updateData, userId) {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, isActive: true });
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    const oldVal = vehicle.toObject();

    // Validate registration number unique constraint if it's changing
    if (updateData.registrationNumber) {
      const regNo = updateData.registrationNumber.toUpperCase().trim();
      if (regNo !== vehicle.registrationNumber) {
        const duplicate = await Vehicle.findOne({ registrationNumber: regNo, isActive: true });
        if (duplicate) {
          throw new ConflictError(`Vehicle with registration number '${regNo}' already exists`);
        }
        vehicle.registrationNumber = regNo;
      }
    }

    // Monitor status transitions and append to history log
    if (updateData.status && updateData.status !== vehicle.status) {
      vehicle.statusHistory.push({
        status: updateData.status,
        changedAt: new Date(),
        changedBy: userId,
        comment: updateData.statusComment || 'Manual status adjustment',
      });
      vehicle.status = updateData.status;
    }

    // Update other allowed fields
    const fieldsToUpdate = ['vehicleName', 'type', 'maxLoadCapacity', 'odometer', 'acquisitionCost', 'region'];
    fieldsToUpdate.forEach((field) => {
      if (updateData[field] !== undefined) {
        vehicle[field] = updateData[field];
      }
    });

    vehicle.updatedBy = userId;
    const updatedVehicle = await vehicle.save();

    // Log audit trail
    await auditService.log({
      user: userId,
      action: 'VEHICLE_UPDATED',
      entity: 'Vehicle',
      entityId: updatedVehicle._id,
      oldValue: oldVal,
      newValue: updatedVehicle.toObject(),
    });

    return updatedVehicle;
  }

  /**
   * Retrieve a vehicle by ID
   */
  async getVehicleById(vehicleId) {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, isActive: true })
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');
      
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }
    return vehicle;
  }

  /**
   * Retrieve all vehicles with search, pagination, and filter parameters
   */
  async getAllVehicles({ search, page = 1, limit = 10, sort = '-createdAt', type, status, region }) {
    const query = { isActive: true };

    // Search filter (Reg Number or Model name match)
    if (search) {
      query.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { vehicleName: { $regex: search, $options: 'i' } },
      ];
    }

    // Explicit categorical filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (region) query.region = region;

    const skip = (page - 1) * limit;

    const queryExec = Vehicle.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalExec = Vehicle.countDocuments(query);

    const [data, total] = await Promise.all([queryExec, totalExec]);

    return {
      vehicles: data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Perform a soft-delete on a vehicle
   */
  async deleteVehicle(vehicleId, userId) {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, isActive: true });
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    vehicle.isActive = false;
    vehicle.updatedBy = userId;
    await vehicle.save();

    await auditService.log({
      user: userId,
      action: 'VEHICLE_DELETED',
      entity: 'Vehicle',
      entityId: vehicleId,
      oldValue: { registrationNumber: vehicle.registrationNumber },
    });

    return true;
  }

  /**
   * Aggregates stats for analytical report cards
   */
  async getVehicleAnalytics() {
    return await Vehicle.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalVehicles: { $sum: 1 },
          totalAcquisitionCost: { $sum: '$acquisitionCost' },
          averageOdometer: { $avg: '$odometer' },
        },
      },
    ]);
  }

  /**
   * Upload a vehicle document
   */
  async addVehicleDocument(vehicleId, file, name, userId) {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, isActive: true });
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    const documentUrl = `/uploads/${file.filename}`;
    const newDoc = {
      name: name || file.originalname,
      url: documentUrl,
      uploadedAt: new Date(),
    };

    vehicle.documents.push(newDoc);
    vehicle.updatedBy = userId;
    await vehicle.save();

    await auditService.log({
      user: userId,
      action: 'VEHICLE_DOCUMENT_UPLOADED',
      entity: 'Vehicle',
      entityId: vehicleId,
      newValue: newDoc,
    });

    return vehicle;
  }

  /**
   * Remove a vehicle document
   */
  async removeVehicleDocument(vehicleId, docId, userId) {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, isActive: true });
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    const docIndex = vehicle.documents.findIndex(d => d._id.toString() === docId);
    if (docIndex === -1) {
      throw new NotFoundError('Document not found');
    }

    const removedDoc = vehicle.documents[docIndex];
    vehicle.documents.splice(docIndex, 1);
    vehicle.updatedBy = userId;
    await vehicle.save();

    await auditService.log({
      user: userId,
      action: 'VEHICLE_DOCUMENT_DELETED',
      entity: 'Vehicle',
      entityId: vehicleId,
      oldValue: removedDoc,
    });

    return vehicle;
  }
}

export const vehicleService = new VehicleService();
export default vehicleService;
