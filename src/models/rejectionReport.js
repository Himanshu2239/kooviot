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
      required: true,  // ✅ Fixed 'require' to 'required'
    },
    packingRejection: {
      type: Number,
      required: true,  // ✅ Fixed 'require' to 'required'
    },
    scrap: {
      type: Number,
      required: true,  // ✅ Fixed 'require' to 'required'
    },
  },
  {
    timestamps: true,
  }
);

export const rejection = mongoose.model("Rejection", rejectionSchema);
