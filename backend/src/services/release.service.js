import { db } from '../prisma/db.ts';

/**
 * Format a ReleaseRequest row into a rich JSON response suitable for the portal UI.
 */
function formatReleaseRequest(request, fdr, institution) {
  if (!request) return null;

  const numAmount = fdr ? parseFloat(fdr.amount) : 0;
  const formattedAmount = isNaN(numAmount)
    ? fdr?.amount || '₹0'
    : '₹' + numAmount.toLocaleString('en-IN');

  const issueDateObj = fdr?.issueDate ? new Date(fdr.issueDate.toString()) : null;
  const maturityDateObj = fdr?.maturityDate ? new Date(fdr.maturityDate.toString()) : null;

  let daysRemaining = null;
  if (maturityDateObj) {
    const now = new Date();
    const diffTime = maturityDateObj.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Derive request status
  // 1. If approvedAt is set and FDR is RELEASED -> Approved
  // 2. If approvedAt is set and FDR is not RELEASED (e.g. remarks start with [REJECTED]) -> Rejected
  // 3. Otherwise -> Pending Approval
  let status = 'Pending Approval';
  let rawStatus = 'PENDING';
  let cleanRemarks = request.remarks || '';

  if (request.approvedAt) {
    if (cleanRemarks.startsWith('[REJECTED]')) {
      status = 'Rejected';
      rawStatus = 'REJECTED';
      cleanRemarks = cleanRemarks.replace(/^\[REJECTED\]\s*/, '');
    } else {
      status = 'Approved';
      rawStatus = 'APPROVED';
      if (cleanRemarks.startsWith('[APPROVED]')) {
        cleanRemarks = cleanRemarks.replace(/^\[APPROVED\]\s*/, '');
      }
    }
  } else if (fdr?.status === 'RELEASED') {
    status = 'Approved';
    rawStatus = 'APPROVED';
  }

  return {
    id: request.id,
    fdrRecordId: request.fdrRecordId,
    fdrNumber: fdr?.fdrNumber || `FDR-REC-${request.fdrRecordId}`,
    institution: institution?.name || 'Institutional Depository',
    institutionId: institution?.id || fdr?.institutionId,
    institutionCode: institution?.code || 'AICTE-REG',
    bank: fdr?.bankName || 'Scheduled Commercial Bank',
    branch: fdr?.branchName || 'Main Branch',
    amount: formattedAmount,
    numericAmount: numAmount,
    requestDate: request.requestedAt
      ? new Date(request.requestedAt.toString()).toISOString().split('T')[0]
      : 'Today',
    approvedAt: request.approvedAt ? new Date(request.approvedAt.toString()).toISOString() : null,
    issueDate: issueDateObj ? issueDateObj.toISOString().split('T')[0] : null,
    maturityDate: maturityDateObj ? maturityDateObj.toISOString().split('T')[0] : null,
    daysRemaining,
    fdrStatus: fdr?.status || 'RELEASE_REQUESTED',
    status: status,
    rawStatus: rawStatus,
    reason: cleanRemarks || 'Institutional compliance completed; NOC requested for lien revocation.',
    remarks: cleanRemarks,
    rawRemarks: request.remarks,
    applicantName: institution ? `Registrar, ${institution.name}` : 'Institutional Registrar',
    nocStatus:
      rawStatus === 'APPROVED'
        ? 'Council NOC Issued; Lien Release Certificate dispatched to Bank.'
        : rawStatus === 'REJECTED'
        ? 'Release NOC Denied. Deficiencies recorded in audit log.'
        : 'Under Scrutiny at AICTE Regulation Bureau.',
    documents: [
      { name: 'Formal Closure / Relief Resolution.pdf', size: '2.4 MB' },
      { name: 'Original Bank FDR Deposit Deed.pdf', size: '1.8 MB' },
      { name: 'Lien Revocation Undertaking.pdf', size: '940 KB' },
    ],
    fdrDetails: fdr || null,
    institutionDetails: institution || null,
  };
}

export const releaseService = {
  /**
   * Helper to write an AuditLog record.
   */
  async logAudit({ action, entityId, details, userId }) {
    try {
      const nowIso = new Date().toISOString();
      await db.orm.public.AuditLog.create({
        action,
        entityType: 'ReleaseRequest',
        entityId: entityId || null,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        userId: userId || null,
        createdAt: nowIso,
      });
    } catch (e) {
      console.warn('AuditLog creation notice:', e.message);
    }
  },

  /**
   * GET /api/releases
   * Returns all release requests with filters: status, search, institutionId, fdrNumber
   */
  async getAllReleases({ status, search, institutionId, fdrNumber } = {}) {
    const requests = await db.orm.public.ReleaseRequest
      .include('fdrRecord')
      .all();

    const institutions = await db.orm.public.Institution.all();
    const instMap = new Map(institutions.map((i) => [i.id, i]));

    let results = requests.map((req) => {
      const fdr = req.fdrRecord;
      const inst = fdr?.institutionId ? instMap.get(fdr.institutionId) : null;
      return formatReleaseRequest(req, fdr, inst);
    });

    // Status filter: 'Pending Approval' | 'Approved' | 'Rejected' | 'All'
    if (status && status !== 'All') {
      const s = status.toLowerCase();
      results = results.filter((item) => {
        return (
          item.status.toLowerCase() === s ||
          item.rawStatus.toLowerCase() === s ||
          item.status.toLowerCase().replace(/ /g, '_') === s
        );
      });
    }

    // Institution filter
    if (institutionId && institutionId !== 'All') {
      const pId = parseInt(institutionId, 10);
      if (!isNaN(pId)) {
        results = results.filter((item) => item.institutionId === pId);
      }
    }

    // FDR Number filter
    if (fdrNumber && fdrNumber.trim()) {
      const fn = fdrNumber.trim().toLowerCase();
      results = results.filter((item) => item.fdrNumber?.toLowerCase().includes(fn));
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter((item) => {
        return (
          item.fdrNumber?.toLowerCase().includes(q) ||
          item.institution?.toLowerCase().includes(q) ||
          item.bank?.toLowerCase().includes(q) ||
          item.reason?.toLowerCase().includes(q) ||
          item.applicantName?.toLowerCase().includes(q)
        );
      });
    }

    // Sort descending by id (latest first)
    results.sort((a, b) => b.id - a.id);

    return results;
  },

  /**
   * GET /api/releases/:id
   */
  async getReleaseById(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid release request ID.');
      err.statusCode = 400;
      throw err;
    }

    const req = await db.orm.public.ReleaseRequest
      .include('fdrRecord')
      .where({ id: parsedId })
      .first();

    if (!req) return null;

    let inst = null;
    if (req.fdrRecord?.institutionId) {
      inst = await db.orm.public.Institution.where({ id: req.fdrRecord.institutionId }).first();
    }

    return formatReleaseRequest(req, req.fdrRecord, inst);
  },

  /**
   * POST /api/releases
   * Creates a new release request for an FDR.
   * Body: {
   *   fdrId: integer,
   *   remarks: string / reason
   * }
   */
  async createReleaseRequest({ fdrId, fdrNumber, remarks }, actingUserId) {
    if (!fdrId && !fdrNumber) {
      const err = new Error('fdrId or fdrNumber is required to create a release request.');
      err.statusCode = 400;
      throw err;
    }

    let fdr = null;
    if (fdrId) {
      const parsed = parseInt(fdrId, 10);
      if (!isNaN(parsed)) {
        fdr = await db.orm.public.FdrRecord.where({ id: parsed }).first();
      }
    }
    if (!fdr && fdrNumber) {
      fdr = await db.orm.public.FdrRecord.where({ fdrNumber: fdrNumber.trim() }).first();
    }

    if (!fdr) {
      const err = new Error('Associated FDR Record could not be found.');
      err.statusCode = 404;
      throw err;
    }

    // 1. Validation: FDR must not already be RELEASED
    if (fdr.status === 'RELEASED') {
      const err = new Error(`FDR ${fdr.fdrNumber} is already released / closed.`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Validation: Prevent duplicate active (pending) release requests for this FDR
    const existingRequests = await db.orm.public.ReleaseRequest
      .where({ fdrRecordId: fdr.id })
      .all();

    const activePending = existingRequests.find(
      (r) => !r.approvedAt && (!r.remarks || !r.remarks.startsWith('[REJECTED]'))
    );

    if (activePending) {
      const err = new Error(
        `An active release request (ID #${activePending.id}) is already pending approval for FDR ${fdr.fdrNumber}.`
      );
      err.statusCode = 400;
      throw err;
    }

    const nowIso = new Date().toISOString();
    const finalRemarks = remarks?.trim() || 'Request submitted for statutory security deposit release.';

    // Create ReleaseRequest row
    const created = await db.orm.public.ReleaseRequest.create({
      fdrRecordId: fdr.id,
      requestedAt: nowIso,
      remarks: finalRemarks,
    });

    // Update FDR status to RELEASE_REQUESTED
    await db.orm.public.FdrRecord.where({ id: fdr.id }).update({
      status: 'RELEASE_REQUESTED',
    });

    // Record in AuditLog
    await this.logAudit({
      action: 'RELEASE_REQUEST_CREATED',
      entityId: created.id,
      userId: actingUserId || null,
      details: `Release request #${created.id} initiated for FDR ${fdr.fdrNumber}. Reason: ${finalRemarks}`,
    });

    return this.getReleaseById(created.id);
  },

  /**
   * PUT /api/releases/:id
   * Update remarks of an existing pending release request.
   */
  async updateReleaseRequest(id, { remarks } = {}, actingUserId) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid release request ID.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await db.orm.public.ReleaseRequest.where({ id: parsedId }).first();
    if (!existing) {
      const err = new Error(`Release request with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (existing.approvedAt) {
      const err = new Error('Cannot modify a release request that has already been approved or rejected.');
      err.statusCode = 400;
      throw err;
    }

    await db.orm.public.ReleaseRequest.where({ id: parsedId }).update({
      remarks: remarks ? remarks.trim() : existing.remarks,
    });

    await this.logAudit({
      action: 'RELEASE_REQUEST_UPDATED',
      entityId: parsedId,
      userId: actingUserId || null,
      details: `Release request #${parsedId} remarks updated.`,
    });

    return this.getReleaseById(parsedId);
  },

  /**
   * POST /api/releases/:id/approve
   * Approves release request, issues NOC, and transitions FDR to RELEASED.
   */
  async approveRelease(id, { remarks } = {}, actingUserId) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid release request ID.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await db.orm.public.ReleaseRequest
      .include('fdrRecord')
      .where({ id: parsedId })
      .first();

    if (!existing) {
      const err = new Error(`Release request with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (existing.approvedAt && !existing.remarks?.startsWith('[REJECTED]')) {
      const err = new Error('This release request has already been approved.');
      err.statusCode = 400;
      throw err;
    }

    const fdr = existing.fdrRecord;
    if (fdr && fdr.status === 'RELEASED') {
      const err = new Error(`Associated FDR ${fdr.fdrNumber} is already released.`);
      err.statusCode = 400;
      throw err;
    }

    const nowIso = new Date().toISOString();
    const approvalRemarks = remarks?.trim()
      ? `[APPROVED] ${remarks.trim()}`
      : `[APPROVED] Council NOC issued. Full statutory lien released and deposit refunded.`;

    // 1. Update ReleaseRequest with approvedAt and remarks
    await db.orm.public.ReleaseRequest.where({ id: parsedId }).update({
      approvedAt: nowIso,
      remarks: approvalRemarks,
    });

    // 2. Transition FDR record to RELEASED
    if (existing.fdrRecordId) {
      await db.orm.public.FdrRecord.where({ id: existing.fdrRecordId }).update({
        status: 'RELEASED',
      });
    }

    // 3. Record AuditLog
    await this.logAudit({
      action: 'RELEASE_REQUEST_APPROVED',
      entityId: parsedId,
      userId: actingUserId || null,
      details: `Release request #${parsedId} approved for FDR ${fdr?.fdrNumber}. Remarks: ${approvalRemarks}`,
    });

    return this.getReleaseById(parsedId);
  },

  /**
   * POST /api/releases/:id/reject
   * Rejects release request with mandatory remarks, leaving FDR active/unchanged.
   */
  async rejectRelease(id, { remarks } = {}, actingUserId) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid release request ID.');
      err.statusCode = 400;
      throw err;
    }

    if (!remarks || typeof remarks !== 'string' || !remarks.trim()) {
      const err = new Error('Rejection remarks/reason are required and cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await db.orm.public.ReleaseRequest
      .include('fdrRecord')
      .where({ id: parsedId })
      .first();

    if (!existing) {
      const err = new Error(`Release request with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (existing.approvedAt) {
      const err = new Error('Cannot reject a release request that has already been processed.');
      err.statusCode = 400;
      throw err;
    }

    const nowIso = new Date().toISOString();
    const rejectionRemarks = `[REJECTED] ${remarks.trim()}`;

    // 1. Mark ReleaseRequest with approvedAt (processed timestamp) and prefixed remarks
    await db.orm.public.ReleaseRequest.where({ id: parsedId }).update({
      approvedAt: nowIso,
      remarks: rejectionRemarks,
    });

    // 2. Revert FDR record from RELEASE_REQUESTED back to ACTIVE if it was in RELEASE_REQUESTED
    if (existing.fdrRecordId) {
      const fdr = existing.fdrRecord;
      if (fdr?.status === 'RELEASE_REQUESTED') {
        await db.orm.public.FdrRecord.where({ id: existing.fdrRecordId }).update({
          status: 'ACTIVE',
        });
      }
    }

    // 3. Record in AuditLog
    await this.logAudit({
      action: 'RELEASE_REQUEST_REJECTED',
      entityId: parsedId,
      userId: actingUserId || null,
      details: `Release request #${parsedId} rejected for FDR ${existing.fdrRecord?.fdrNumber}. Reason: ${remarks.trim()}`,
    });

    return this.getReleaseById(parsedId);
  },
};
