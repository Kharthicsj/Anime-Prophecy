import mongoose from 'mongoose';

const pinterestExportSchema = new mongoose.Schema({
    exportDate: { type: Date, default: Date.now },
    scheduledDate: { type: Date, default: null },
    productCount: { type: Number, required: true },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('PinterestExport', pinterestExportSchema);
