import { catchAsync } from '../../utils/catchAsync.js';
import { vehicleService } from './vehicle.service.js';

export const createVehicle = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.createVehicle(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Vehicle registered successfully',
    data: vehicle,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const getVehicles = catchAsync(async (req, res) => {
  const { search, page, limit, sort, type, status, region } = req.query;

  const result = await vehicleService.getAllVehicles({
    search,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
    sort,
    type,
    status,
    region,
  });

  res.status(200).json({
    success: true,
    message: 'Vehicles retrieved successfully',
    data: result.vehicles,
    errors: null,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const getVehicleById = catchAsync(async (req, res) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Vehicle details retrieved successfully',
    data: vehicle,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const updateVehicle = catchAsync(async (req, res) => {
  const updatedVehicle = await vehicleService.updateVehicle(req.params.id, req.body, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Vehicle details updated successfully',
    data: updatedVehicle,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const deleteVehicle = catchAsync(async (req, res) => {
  await vehicleService.deleteVehicle(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Vehicle deleted successfully',
    data: null,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const getVehicleMetrics = catchAsync(async (req, res) => {
  const metrics = await vehicleService.getVehicleAnalytics();

  res.status(200).json({
    success: true,
    message: 'Vehicle metrics retrieved successfully',
    data: metrics[0] || { totalVehicles: 0, totalAcquisitionCost: 0, averageOdometer: 0 },
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});
