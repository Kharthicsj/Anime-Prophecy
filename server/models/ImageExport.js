import mongoose from 'mongoose';

const imageExportSchema = new mongoose.Schema({
    exportDate: { type: Date, default: Date.now },
    scheduledDate: { type: Date, default: null },
    productCount: { type: Number, required: true },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Delete records automatically after 30 days (30 * 24 * 60 * 60 seconds)
imageExportSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('ImageExport', imageExportSchema);
