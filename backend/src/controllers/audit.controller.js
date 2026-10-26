import { auditService } from '../services/audit.service.js';

export const auditController = {
  /**
   * GET /api/audit-logs
   */
  async getAll(req, res) {
    try {
      const { entityType, entityId, action, search, fromDate, toDate } = req.query;
      const logs = await auditService.getAllAuditLogs({
        entityType,
        entityId,
        action,
        search,
        fromDate,
        toDate,
      });

      return res.status(200).json({
        status: 'ok',
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching audit logs.',
      });
    }
  },

  /**
   * GET /api/audit-logs/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const log = await auditService.getAuditLogById(id);

      if (!log) {
        return res.status(404).json({
          status: 'error',
          message: `Audit log with ID '${id}' not found.`,
        });
      }

      return res.status(200).json({
        status: 'ok',
        data: log,
      });
    } catch (error) {
      console.error('Error fetching audit log by ID:', error);
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Internal server error while fetching audit log.',
      });
    }
  },
};
