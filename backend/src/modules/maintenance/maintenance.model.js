import mongoose from 'mongoose';

const maintenanceLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Maintenance description is required'],
      trim: true,
    },
    maintenanceType: {
      type: String,
      enum: {
        values: ['Routine', 'Breakdown', 'Inspection', 'Repair'],
        message: 'Type must be Routine, Breakdown, Inspection, or Repair',
      },
      required: [true, 'Maintenance type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: Date,
    cost: {
      type: Number,
      required: [true, 'Maintenance cost is required'],
      min: [0, 'Cost cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Completed'],
      default: 'Active',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const MaintenanceLog = mongoose.model('MaintenanceLog', maintenanceLogSchema);
export default MaintenanceLog;
