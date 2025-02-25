import mongoose from "mongoose";
const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to User model (salesperson)
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    additionalDetails: {
      phoneNumber: { type: String, trim: true, default: null },
      emailId: { type: String, trim: true, lowercase: true, default: null },
      companyName: { type: String, trim: true, default: null },
      contactPersonName: { type: String, trim: true, default: null },
      feedback: { type: String, trim: true, default: null },
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date().toISOString(),
    },
    isCompleted: {
      type: Boolean,
      default: false,
      required: true,
    },
    isExtraTask: {
      type: Boolean,
      default: false,
      required: true,
    },
    fileUrl: {
      type: String,
      required: false, // Optional field for storing file URL
    },
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
