import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * @throws {Error} If connection fails
 */
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prophecy_hub';

        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
