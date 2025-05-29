import mongoose from "mongoose";

const rejectionItemSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  materialCode: { type: String, required: true },
  pieces: { type: Number, required: true },
  reason: { type: String, required: true }
});

const PackingRejMesSchema = new mongoose.Schema({
  // date: { type: String, required: true },
    date: {
    type: Date,
    required: true,
    default: () => new Date().toISOString(),
  }, 
  items: [rejectionItemSchema],
  totalPackingRej: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PackingRejMes = mongoose.models.RejectionEntry || mongoose.model("PackingRejMes", PackingRejMesSchema);

export default PackingRejMes;
