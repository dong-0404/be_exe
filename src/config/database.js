const mongoose = require('mongoose');
const config = require('./env');

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        try {
            // Mongoose connection options
            const options = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            };

            this.connection = await mongoose.connect(config.mongoUri, options);

            console.log(`✅ MongoDB connected successfully: ${this.connection.connection.host}`);

            // Handle connection events
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️  MongoDB disconnected');
            });

            // Graceful shutdown
            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });

            return this.connection;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            process.exit(1);
        }
    }

    async disconnect() {
        if (this.connection) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        }
    }

    getConnection() {
        return this.connection;
    }
}

module.exports = new Database();
