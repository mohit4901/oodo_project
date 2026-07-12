import { catchAsync } from '../../utils/catchAsync.js';
import { auditService } from './audit.service.js';

export const getAuditLogs = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, action, entity } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (entity) filter.entity = entity;

  const { logs, pagination } = await auditService.getLogs({
    filter,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  res.status(200).json({
    success: true,
    message: 'Audit logs retrieved successfully',
    data: logs,
    errors: null,
    pagination,
    timestamp: new Date().toISOString(),
  });
});
