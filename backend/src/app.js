import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { httpLogger } from './config/logger.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { NotFoundError } from './errors/NotFoundError.js';

// Feature routers imports
import authRouter from './modules/auth/auth.routes.js';
import auditRouter from './modules/audit/audit.routes.js';
import dashboardRouter from './modules/dashboard/dashboard.routes.js';
import vehicleRouter from './modules/vehicle-registry/vehicle.routes.js';
import driverRouter from './modules/driver-safety-profile/driver.routes.js';
import tripRouter from './modules/trip-dispatcher/trip.routes.js';
import maintenanceRouter from './modules/maintenance/maintenance.routes.js';
import expenseRouter from './modules/fuel-expense-management/expense.routes.js';
import reportRouter from './modules/reports-analysis/report.routes.js';
import settingsRouter from './modules/settings-rbac/settings.routes.js';

const app = express();

// Security Headers middleware
app.use(helmet());

// Cross-Origin Resource Sharing middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Gzip compression middleware
app.use(compression());

// Body parser middlewares
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'transitops_cookie_signer_key'));

// HTTP request logging middleware
app.use(httpLogger);

// Serving static uploads securely
app.use('/uploads', express.static('uploads'));

// API Version 1 central routing entries
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/audits', auditRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/vehicles', vehicleRouter);
app.use('/api/v1/drivers', driverRouter);
app.use('/api/v1/trips', tripRouter);
app.use('/api/v1/maintenance', maintenanceRouter);
app.use('/api/v1/expenses', expenseRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/settings', settingsRouter);

// Fallback 404 handler for unmatched routes
app.use('*', (req, res, next) => {
  next(new NotFoundError(`Cannot find path '${req.originalUrl}' on this server`));
});

// Centralized operational error catching boundary middleware
app.use(globalErrorHandler);

export default app;
