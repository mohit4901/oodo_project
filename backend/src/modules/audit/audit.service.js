import { AuditLog } from './audit.model.js';

class AuditService {
  /**
   * Log an operational action
   * @param {Object} logData - The details of the audit log
   */
  async log(logData) {
    try {
      const auditEntry = new AuditLog({
        user: logData.user || null,
        action: logData.action,
        entity: logData.entity,
        entityId: logData.entityId || null,
        oldValue: logData.oldValue || null,
        newValue: logData.newValue || null,
        ipAddress: logData.ipAddress || null,
      });
      return await auditEntry.save();
    } catch (err) {
      // Fail silently to prevent crashing critical business transactions due to audit failures
      console.error('Failed to write audit log:', err);
    }
  }

  /**
   * Get paginated and filtered audit logs
   */
  async getLogs({ filter = {}, page = 1, limit = 50, sort = { timestamp: -1 } }) {
    const skip = (page - 1) * limit;

    const query = AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = AuditLog.countDocuments(filter);
    const [data, totalLogs] = await Promise.all([query, total]);

    return {
      logs: data,
      pagination: {
        total: totalLogs,
        page,
        limit,
        pages: Math.ceil(totalLogs / limit),
      },
    };
  }
}

export const auditService = new AuditService();
export default auditService;
