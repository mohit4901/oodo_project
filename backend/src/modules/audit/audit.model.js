import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Can be null for system-triggered events
    },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'VEHICLE_CREATED',
        'VEHICLE_UPDATED',
        'VEHICLE_DELETED',
        'DRIVER_CREATED',
        'DRIVER_UPDATED',
        'DRIVER_DELETED',
        'TRIP_CREATED',
        'TRIP_DISPATCHED',
        'TRIP_COMPLETED',
        'TRIP_CANCELLED',
        'MAINTENANCE_STARTED',
        'MAINTENANCE_CLOSED',
        'FUEL_ADDED',
        'EXPENSE_ADDED',
      ],
    },
    entity: {
      type: String,
      required: true,
      index: true, // e.g. 'Vehicle', 'Trip', 'Driver', 'MaintenanceLog'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false }, // only track when logged
  }
);

// Compound index for fast audits
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
