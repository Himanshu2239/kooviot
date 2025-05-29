import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    batchId: { type: String, required: true },
    materialCode: { type: String, required: true },
    grade: { type: String, required: true },
    packagingType: { type: String, required: true },
    lotNo: { type: String, trim:true },    // Not required
    pieces: { type: Number, required: true },
    customer: { type: String, required: true , trim: true},
});

const dispatchSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        date: { type: Date, required: true },
        invoiceNo: { type: String, required: true, trim:true},
        items: { type: [itemSchema], required: true },
        totalPieces: { type: Number, required: true },
    },
    { timestamps: true }
);

const DispatchOutMes = mongoose.models.Dispatch || mongoose.model("DispatchOutMes", dispatchSchema);
export default DispatchOutMes;
