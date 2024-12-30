import mongoose from "mongoose";
const { Schema } = mongoose;

const issueSchema = mongoose.Schema({
    // userId: {
    //     type: Schema.Types.ObjectId,
    //     ref: "User", // Reference to User model (salesperson)
    //     required: true,
    //   },
    issueNo: { type: String },
    issue: { type: String, required: true },
    assignedTo: { type: String, required: true },
    relatedTo: { type: String, required: true },
    currentStatus: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open',
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically sets the current date/time when a document is created
    }
}, {
    timestamp: true, //created at and updated at
});

//   module.exports = mongoose.model('issue', issueSchema);

export const Issues = mongoose.model("Issues", issueSchema);