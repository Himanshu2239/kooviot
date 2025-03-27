// import mongoose from "mongoose";
// const { Schema } = mongoose;

// const rejectionSchema = new Schema({
//     userId : {
//       type:  Schema.Types.ObjectId,
//       ref: "User",
//       required: true
//     },
//     Date : {
//       type: Date,
//       required: true,
//       default: () => new Date.toISOString()
//     },
//     lineRejection: {
//        type: Number,
//        require: true,
//     },
//     packingRejection:{
//         type: Number,
//         require: true
//     },
//     scrap:{
//         type : Number,
//         require: true
//     }
// },{
//   timestamps: true
// }
// )

// export const rejection = mongoose.model("rejection",  rejectionSchema);

import mongoose from "mongoose";
const { Schema } = mongoose;

const rejectionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,  // ✅ Changed 'Date' to 'date'
      required: true,
      default: () => new Date(),  // ✅ Fixed default value
    },
   lineRejection: {
      type: Number,
      default: 0,
      set: v => v ?? 0, // Converts null/undefined to 0
    },
    packingRejection: {
      type: Number,
      default: 0,
      set: v => v ?? 0,
    },
    scrap: {
      type: Number,
      default: 0,
      set: v => v ?? 0,
    },
  },
  {
    timestamps: true,
  }
);

export const rejection = mongoose.model("Rejection", rejectionSchema);
