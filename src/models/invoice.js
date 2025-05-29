
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  materialCode: { type: String, required: true },
  grade: { type: String, required: true },
  pieces: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  invoiceNo: { type: String, required: true , trim: true},
   date: {
    type: Date,
    required: true,
    default: () => new Date().toISOString(),
  }, 
  totalPieces: { type: Number, required: true },
  items: [itemSchema],
},
  {
    timestamps: true
  }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema)