import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      required: [true, 'Trip ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    source: {
      type: String,
      required: [true, 'Source location is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination location is required'],
      trim: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver is required'],
      index: true,
    },
    cargoWeight: {
      type: Number,
      required: [true, 'Cargo weight is required'],
      min: [0, 'Cargo weight cannot be negative'],
    },
    plannedDistance: {
      type: Number,
      required: [true, 'Planned distance is required'],
      min: [0, 'Planned distance cannot be negative'],
    },
    actualDistance: {
      type: Number,
      min: [0, 'Actual distance cannot be negative'],
    },
    revenue: {
      type: Number,
      required: [true, 'Revenue is required'],
      min: [0, 'Revenue cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
      default: 'Draft',
      index: true,
    },
    dispatchDate: Date,
    completedDate: Date,
    isActive: {
      type: Boolean,
      default: true,
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

export const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
