import mongoose from 'mongoose';

const cronLogSchema = new mongoose.Schema({
    runDate: { type: Date, default: Date.now },
    platform: { type: String, required: true },
    status: { type: String, enum: ['Success', 'Failed', 'Partial', 'Running'], default: 'Success' },
    summary: { type: String },
    events: [{
        eventType: { type: String, enum: ['Updated', 'Private', 'Failed', 'Error', 'Unchanged'] },
        productTitle: String,
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        details: String
    }],
    createdAt: { type: Date, expires: '30d', default: Date.now } // TTL index for 30 days
});

export default mongoose.model('CronLog', cronLogSchema);
