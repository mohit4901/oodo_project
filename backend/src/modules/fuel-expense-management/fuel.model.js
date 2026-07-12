import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
      index: true,
    },
    liters: {
      type: Number,
      required: [true, 'Fuel liters count is required'],
      min: [0, 'Liters cannot be negative'],
    },
    cost: {
      type: Number,
      required: [true, 'Fuel cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      index: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: false,
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

export const FuelLog = mongoose.model('FuelLog', fuelLogSchema);
export default FuelLog;
