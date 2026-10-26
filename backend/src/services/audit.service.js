import { db } from '../prisma/db.ts';

/**
 * Format an AuditLog database record into a clean JSON response.
 */
function formatAuditLog(log) {
  if (!log) return null;

  const createdAtDate = log.createdAt ? new Date(log.createdAt.toString()) : new Date();

  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    details: log.details,
    userId: log.userId,
    user: log.user ? { id: log.user.id, name: log.user.name, email: log.user.email, role: log.user.role } : null,
    actorName: log.user?.name || 'Bureau Officer / System',
    timestamp: createdAtDate.toISOString(),
    formattedDate: createdAtDate.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
  };
}

export const auditService = {
  /**
   * Helper to write an AuditLog record.
   */
  async log({ action, entityType, entityId, details, userId }) {
    try {
      const nowIso = new Date().toISOString();
      return await db.orm.public.AuditLog.create({
        action,
        entityType,
        entityId: entityId || null,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        userId: userId || null,
        createdAt: nowIso,
      });
    } catch (e) {
      console.warn('AuditLog logging error:', e.message);
      return null;
    }
  },

  /**
   * GET /api/audit-logs
   * Filters: entityType, entityId, action, search, fromDate, toDate
   */
  async getAllAuditLogs({ entityType, entityId, action, search, fromDate, toDate } = {}) {
    let query = db.orm.public.AuditLog.include('user');

    if (entityType && entityType.trim() && entityType !== 'All') {
      query = query.where({ entityType: entityType.trim() });
    }

    if (entityId) {
      const parsed = parseInt(entityId, 10);
      if (!isNaN(parsed)) {
        query = query.where({ entityId: parsed });
      }
    }

    if (action && action.trim() && action !== 'All') {
      query = query.where({ action: action.trim() });
    }

    let records = await query.all();

    // In-memory filters for dates and search text
    if (fromDate) {
      const fromTime = new Date(fromDate).getTime();
      records = records.filter((r) => {
        const time = r.createdAt ? new Date(r.createdAt.toString()).getTime() : 0;
        return time >= fromTime;
      });
    }

    if (toDate) {
      const toTime = new Date(toDate).getTime();
      records = records.filter((r) => {
        const time = r.createdAt ? new Date(r.createdAt.toString()).getTime() : 0;
        return time <= toTime;
      });
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      records = records.filter((r) => {
        return (
          r.action?.toLowerCase().includes(q) ||
          r.entityType?.toLowerCase().includes(q) ||
          r.details?.toLowerCase().includes(q) ||
          r.user?.name?.toLowerCase().includes(q) ||
          String(r.entityId).includes(q)
        );
      });
    }

    // Sort descending by id (latest logs first)
    records.sort((a, b) => b.id - a.id);

    return records.map(formatAuditLog);
  },

  /**
   * GET /api/audit-logs/:id
   */
  async getAuditLogById(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid Audit Log ID.');
      err.statusCode = 400;
      throw err;
    }

    const log = await db.orm.public.AuditLog
      .include('user')
      .where({ id: parsedId })
      .first();

    return log ? formatAuditLog(log) : null;
  },
};
