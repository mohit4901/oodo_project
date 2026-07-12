import { catchAsync } from '../../utils/catchAsync.js';
import { expenseService } from './expense.service.js';

export const logFuel = catchAsync(async (req, res) => {
  const fuelLog = await expenseService.logFuel(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Fuel transaction logged successfully and mirrored in Expense ledger.',
    data: fuelLog,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const logExpense = catchAsync(async (req, res) => {
  const expense = await expenseService.logExpense(req.body, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Expense transaction logged successfully in operational ledger.',
    data: expense,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const getFuelLogs = catchAsync(async (req, res) => {
  const { vehicleId, page, limit } = req.query;

  const result = await expenseService.getFuelLogs({
    vehicleId,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
  });

  res.status(200).json({
    success: true,
    message: 'Fuel logs retrieved successfully',
    data: result.fuelLogs,
    errors: null,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const getExpenses = catchAsync(async (req, res) => {
  const { vehicleId, category, page, limit } = req.query;

  const result = await expenseService.getExpenses({
    vehicleId,
    category,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
  });

  res.status(200).json({
    success: true,
    message: 'Expenses retrieved successfully',
    data: result.expenses,
    errors: null,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const getVehicleTotalCost = catchAsync(async (req, res) => {
  const costReport = await expenseService.getVehicleTotalOperationalCost(req.params.vehicleId);

  res.status(200).json({
    success: true,
    message: 'Vehicle total operational cost calculated successfully',
    data: costReport,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});
