import { catchAsync } from '../../utils/catchAsync.js';
import { tripService } from './trip.service.js';

export const createTrip = catchAsync(async (req, res) => {
  const trip = await tripService.createTrip(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Trip booked successfully in Draft state',
    data: trip,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const dispatchTrip = catchAsync(async (req, res) => {
  const trip = await tripService.dispatchTrip(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Trip dispatched successfully. Vehicle and driver status updated.',
    data: trip,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const completeTrip = catchAsync(async (req, res) => {
  const trip = await tripService.completeTrip(req.params.id, req.body, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Trip completed successfully. Odometer, vehicle status, and fuel logged.',
    data: trip,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const cancelTrip = catchAsync(async (req, res) => {
  const trip = await tripService.cancelTrip(req.params.id, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Trip cancelled successfully. Vehicle and driver availability restored.',
    data: trip,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const getTrips = catchAsync(async (req, res) => {
  const { search, page, limit, sort, status } = req.query;

  const result = await tripService.getAllTrips({
    search,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
    sort,
    status,
  });

  res.status(200).json({
    success: true,
    message: 'Trips retrieved successfully',
    data: result.trips,
    errors: null,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const getTripById = catchAsync(async (req, res) => {
  const trip = await tripService.getTripById(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Trip details retrieved successfully',
    data: trip,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});
