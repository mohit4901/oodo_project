import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: ['Fuel', 'Maintenance', 'Tolls', 'Repair', 'Insurance', 'Driver Payout', 'Other'],
        message: 'Invalid expense category',
      },
      required: [true, 'Expense category is required'],
      index: true,
    },
    cost: {
      type: Number,
      required: [true, 'Expense cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      trim: true,
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

export const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
