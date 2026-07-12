import mongoose from 'mongoose';

const driverStatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
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

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    licenseCategory: {
      type: String,
      enum: {
        values: ['Heavy Duty', 'Light Vehicle', 'Commercial'],
        message: 'Category must be Heavy Duty, Light Vehicle, or Commercial',
      },
      required: [true, 'License category is required'],
    },
    licenseExpiryDate: {
      type: Date,
      required: [true, 'License expiry date is required'],
      index: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    safetyScore: {
      type: Number,
      min: [0, 'Safety score cannot be less than 0'],
      max: [100, 'Safety score cannot exceed 100'],
      default: 100,
    },
    status: {
      type: String,
      enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
      default: 'Available',
      index: true,
    },
    statusHistory: [driverStatusHistorySchema],
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

// Virtual field to check if license is expired
driverSchema.virtual('isLicenseExpired').get(function () {
  return this.licenseExpiryDate < new Date();
});

// Pre-save to initialize status history on creation
driverSchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this.createdBy,
      comment: 'Initial driver registration',
    });
  }
  next();
});

export const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
