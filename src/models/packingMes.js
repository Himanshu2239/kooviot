
// const PackingMesSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: 'User',
//   },
//   date: {
//     type: Date,
//     required: true,
//   },
//   batchId: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   materialCode: {
//     type: String,
//     required: true,
//   },
//   grade: {
//     type: String,
//     required: true,
//   },
//   pieces: {
//     type: Number,
//     required: true,
//   },
//   lotNo: {
//     type: String,
//     required: true,
//   },
//   packingType: {
//     type: String,
//     required: true,
//   },
//   gloveCount: {
//     type: String,
//     required: true,
//   },
// }, {
//   timestamps: true,
// });

// module.exports = mongoose.model('PackingEntry', PackingEntrySchema);

import mongoose from "mongoose";


const packingItemSchema = new mongoose.Schema({
  batchId: { type: String, required: true,trim: true },
  materialCode: { type: String, required: true },
  grade: { type: String, required: true },
  pieces: { type: Number, required: true },
  // lotNo: { type: String, required: true, trim:true },
  packingType: { type: String, required: true },
  gloveCount: { type: Number, required: true },
});

const packingSchema = new mongoose.Schema({
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().toISOString(),
  },  
  totalPacking: { type: Number, required: true },
  items: [packingItemSchema],
 }, { timestamps: true });


export const PackingMes = mongoose.model("PackingMes", packingSchema);
