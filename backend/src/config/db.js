import mongoose from 'mongoose';
import { logger } from './logger.js';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      throw new Error('MONGODB_URI environment variable is not defined.');
    }

    const options = {
      autoIndex: true, // Build indexes (production should set this to false, but hackathon/startup needs it active)
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    mongoose.connection.on('connected', () => {
      logger.info('Mongoose default connection open to Database');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Mongoose default connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose default connection disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose default connection disconnected through app termination');
      process.exit(0);
    });

    const db = await mongoose.connect(connStr, options);
    logger.info(`MongoDB Connected: ${db.connection.host}`);
    return db;
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};
