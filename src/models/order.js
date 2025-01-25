import mongoose from "mongoose";
const { Schema } = mongoose;

const orderSchema = mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to User model (salesperson)
        required: true,
    },
    orderId: {
        type: String,
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    salesPerson: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    noOfPcs: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    remark: {
        type: String,
        required: false
    },
    orderStatus: {
        type: String,
        // enum: ['Pending', 'Urgent', 'Normal'], // Defines the possible statuses
        default: 'Order Created'
    },
    orderDate: {
        type: String,
        default: () => new Date().toISOString().split('T')[0] // Automatically sets the current date in YYYY-MM-DD format
    }
},

{
    timestamps: true
}
);

// Create and export the model
//   module.exports = mongoose.model('Order', orderSchema);

export const Order = mongoose.model("Order", orderSchema);
