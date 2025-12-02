const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./config');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });

        logger.info(`MongoDB Conectado: ${conn.connection.host}`);

        // Configurações do mongoose
        mongoose.set("debug", process.env.NODE_ENV === "development");
    } catch (error) {
        logger.error(`Erro ao conectar MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;

