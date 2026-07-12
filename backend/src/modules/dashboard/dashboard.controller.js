import { catchAsync } from '../../utils/catchAsync.js';
import { dashboardService } from './dashboard.service.js';

export const getDashboardSummary = catchAsync(async (req, res) => {
  const { vehicleType, region, status } = req.query;

  const dashboardData = await dashboardService.getDashboardData({
    vehicleType,
    region,
    status,
  });

  res.status(200).json({
    success: true,
    message: 'Dashboard summary retrieved successfully',
    data: dashboardData,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});
