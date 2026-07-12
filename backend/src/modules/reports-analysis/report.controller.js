import { catchAsync } from '../../utils/catchAsync.js';
import { reportService } from './report.service.js';

export const getPerformanceReport = catchAsync(async (req, res) => {
  const { type, region } = req.query;

  const report = await reportService.getPerformanceReport({ type, region });

  res.status(200).json({
    success: true,
    message: 'Performance report generated successfully',
    data: report,
    errors: null,
    pagination: null,
    timestamp: new Date().toISOString(),
  });
});

export const exportPerformanceReportCSV = catchAsync(async (req, res) => {
  const { type, region } = req.query;

  const csvContent = await reportService.exportPerformanceReportCSV({ type, region });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=transitops-fleet-roi-report.csv');
  
  res.status(200).send(csvContent);
});
