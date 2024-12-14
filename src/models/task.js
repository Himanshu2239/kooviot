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
    date: {
      type: Date,
      required: true,
      default: Date.now,
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
