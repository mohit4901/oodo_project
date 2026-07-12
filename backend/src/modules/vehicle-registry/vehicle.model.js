import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  comment: String,
});

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    vehicleName: {
      type: String,
      required: [true, 'Vehicle name/model is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['Truck', 'Van', 'Trailer', 'Utility'],
        message: 'Type must be Truck, Van, Trailer, or Utility',
      },
      required: [true, 'Vehicle type is required'],
    },
    maxLoadCapacity: {
      type: Number,
      required: [true, 'Maximum load capacity is required'],
      min: [0, 'Load capacity cannot be negative'],
    },
    odometer: {
      type: Number,
      required: [true, 'Current odometer reading is required'],
      min: [0, 'Odometer cannot be negative'],
      default: 0,
    },
    acquisitionCost: {
      type: Number,
      required: [true, 'Acquisition cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
      default: 'Available',
      index: true,
    },
    region: {
      type: String,
      enum: ['North', 'South', 'East', 'West', 'Central'],
      default: 'Central',
      index: true,
    },
    statusHistory: [statusHistorySchema],
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save to initialize status history on creation
vehicleSchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this.createdBy,
      comment: 'Initial vehicle registration',
    });
  }
  next();
});

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
