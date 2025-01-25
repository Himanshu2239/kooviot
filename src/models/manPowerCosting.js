import mongoose from "mongoose";

const manPowerCostingSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    payroll: {
      type: Number,
      required: true,
    },
    contractorLabour: {
      type: Number,
      required: true,
    },
    otherLabour: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

export const ManPowerCosting = mongoose.model("ManPowerCosting",  manPowerCostingSchema);

