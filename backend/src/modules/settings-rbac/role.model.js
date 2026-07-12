import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      enum: ['admin', 'fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst', 'driver'],
    },
    permissions: {
      type: [String],
      required: true,
      default: [],
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

export const Role = mongoose.model('Role', roleSchema);
export default Role;
