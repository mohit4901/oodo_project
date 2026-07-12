import { catchAsync } from '../../utils/catchAsync.js';
import { maintenanceService } from './maintenance.service.js';

export const createLog = catchAsync(async (req, res) => {
  const log = await maintenanceService.createMaintenanceLog(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Vehicle logged into maintenance successfully. Status updated to In Shop.',
    data: log,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const closeLog = catchAsync(async (req, res) => {
  const log = await maintenanceService.closeMaintenanceLog(req.params.id, req.body, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Maintenance closed successfully. Vehicle status restored and expense recorded.',
    data: log,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const getLogs = catchAsync(async (req, res) => {
  const { vehicleId, status, page, limit } = req.query;

  const result = await maintenanceService.getAllLogs({
    vehicleId,
    status,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
  });

  res.status(200).json({
    success: true,
    message: 'Maintenance logs retrieved successfully',
    data: result.logs,
    errors: null,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const getLogById = catchAsync(async (req, res) => {
  const log = await maintenanceService.getLogById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Maintenance log details retrieved successfully',
    data: log,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});
