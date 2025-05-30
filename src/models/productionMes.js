// import mongoose, { Schema } from 'mongoose';

// const productionMesSchema = new mongoose.Schema({
//   userId: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   date: {
//     type: Date,
//     required: true,
//     default: () => new Date().toISOString(),
//   },
//   // batchId: String,
//   shift: String,
//   line: String,
//   productionItems: [
//     {
//       batchId: {type: String, required: true, trim: true},
//       materialCode: String,
//       pieces: Number,
//     },
//   ],
//   totalPieces: Number,
//   rejTotalPieces: Number,
//   workLogItems: [
//     {
//       start: String,
//       end: String,
//       description: {
//         type: String,
//         trim: true
//       },
//       duration: {
//         type: String,
//       }
//     },
//   ],
//   totalDuration: String
// },
//   {
//     timestamps: true,
//   }
// );

// export const ProductionMes = mongoose.model("ProductionMes", productionMesSchema);


import mongoose, { Schema } from 'mongoose';
import { deflate } from 'zlib';

// Subschema for Production Items
const productionItemSchema = new Schema({
  batchId: { type: String, required: true, trim: true },
  materialCode: { type: String, required: true, trim: true },
  pieces: { type: Number, required: true, min: 0 },
  productionInKg: {type: Number, required: true}
}, { _id: false });
  
// Subschema for Work Logs
const workLogSchema = new Schema({
  start: { type: String, required: true },
  end: { type: String, required: true },
  description: { type: String, trim: true },
  duration: { type: String }
}, { _id: false });

// Main Schema
const productionMesSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  shift: { type: String, required: true, trim: true },
  line: { type: String, required: true, trim: true },

  productionItems: [productionItemSchema],
  totalPieces: { type: Number, default: 0, min: 0 },
  totalProductionInKg: {type: Number},
  lineRejection: { type: Number, default: 0, min: 0 },
  lineRejectionInkg: {type: Number, default: 0, min: 0},
  workLogItems: [workLogSchema],
  totalDuration: { type: String, default: "0h" }
}, {
  timestamps: true,
  versionKey: false
});

// Prevent model overwrite in dev (hot-reload safe)
export const ProductionMes = mongoose.models.ProductionMes || mongoose.model("ProductionMes", productionMesSchema);










