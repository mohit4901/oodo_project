import { catchAsync } from '../../utils/catchAsync.js';
import { driverService } from './driver.service.js';

export const createDriver = catchAsync(async (req, res) => {
  const driver = await driverService.createDriver(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Driver profile registered successfully',
    data: driver,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const getDrivers = catchAsync(async (req, res) => {
  const { search, page, limit, sort, status, licenseCategory, isExpired } = req.query;

  const result = await driverService.getAllDrivers({
    search,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
    sort,
    status,
    licenseCategory,
    isExpired,
  });

  res.status(200).json({
    success: true,
    message: 'Drivers profiles retrieved successfully',
    data: result.drivers,
    errors: null,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const getDriverById = catchAsync(async (req, res) => {
  const driver = await driverService.getDriverById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Driver profile details retrieved successfully',
    data: driver,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const updateDriver = catchAsync(async (req, res) => {
  const updatedDriver = await driverService.updateDriver(req.params.id, req.body, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Driver profile updated successfully',
    data: updatedDriver,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const deleteDriver = catchAsync(async (req, res) => {
  await driverService.deleteDriver(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Driver profile deleted successfully',
    data: null,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const getDriverSafetyStats = catchAsync(async (req, res) => {
  const stats = await driverService.getDriverSafetySummary();

  res.status(200).json({
    success: true,
    message: 'Driver safety stats retrieved successfully',
    data: stats,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});
