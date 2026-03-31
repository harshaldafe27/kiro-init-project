const mongoose = require('mongoose');

const connectDB = async () => {
    let uri = process.env.MONGO_URI;

    // If no MONGO_URI or it points to localhost, use in-memory MongoDB
    if (!uri || uri.includes('localhost') || uri.includes('127.0.0.1')) {
        try {
            const {
                MongoMemoryServer
            } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();
            console.log('Using in-memory MongoDB (no local MongoDB required)');
            console.log('In-memory DB URI:', uri);
        } catch (err) {
            console.error('Failed to start in-memory MongoDB:', err.message);
            process.exit(1);
        }
    }

    try {
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;