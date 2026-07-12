import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { logger } from './config/logger.js';

// Catch uncaught synchronous exceptions to prevent state pollution
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down application server...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Establish connection to MongoDB
connectDB();

const server = http.createServer(app);

// Use port 5050 as requested by the user
const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
  logger.info(`TransitOps backend server listening on http://localhost:${PORT}`);
  logger.info(`API Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled asynchronous promise rejections gracefully
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down application server...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
