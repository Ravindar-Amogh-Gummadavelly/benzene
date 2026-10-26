import { db } from '../prisma/db.ts';

/**
 * Format a Verification record into a rich JSON response suitable for the Verification UI.
 */
function formatVerificationRecord(ver, fdr, institution, verifier) {
  if (!ver) return null;

  const issueDateObj = fdr?.issueDate ? new Date(fdr.issueDate.toString()) : null;
  const maturityDateObj = fdr?.maturityDate ? new Date(fdr.maturityDate.toString()) : null;

  let daysRemaining = null;
  if (maturityDateObj) {
    const now = new Date();
    const diffTime = maturityDateObj.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const numAmount = fdr ? parseFloat(fdr.amount) : 0;
  const formattedAmount = isNaN(numAmount)
    ? fdr?.amount || '₹0'
    : '₹' + numAmount.toLocaleString('en-IN');

  let tenure = '5 Years';
  if (issueDateObj && maturityDateObj) {
    const yearsDiff = Math.round(
      (maturityDateObj.getTime() - issueDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
    if (yearsDiff > 0) tenure = `${yearsDiff} Years`;
  }

  // Map backend verification status enum to user-friendly label
  let displayStatus = 'Pending Verification';
  if (ver.status === 'VERIFIED') displayStatus = 'Verified';
  else if (ver.status === 'DISCREPANCY') displayStatus = 'Discrepancy';
  else if (ver.status === 'REJECTED') displayStatus = 'Rejected';

  return {
    id: ver.id,
    fdrRecordId: ver.fdrRecordId,
    fdrNumber: fdr?.fdrNumber || `FDR-REC-${ver.fdrRecordId}`,
    institution: institution?.name || 'Institutional Depository',
    institutionId: institution?.id || fdr?.institutionId,
    applicationId: institution?.code || 'AICTE-REG',
    bank: fdr?.bankName || 'Scheduled Commercial Bank',
    branch: fdr?.branchName || 'Main Branch',
    amount: formattedAmount,
    numericAmount: numAmount,
    submittedDate: ver.createdAt ? new Date(ver.createdAt.toString()).toISOString().split('T')[0] : 'Today',
    issueDate: issueDateObj ? issueDateObj.toISOString().split('T')[0] : null,
    maturityDate: maturityDateObj ? maturityDateObj.toISOString().split('T')[0] : null,
    daysRemaining,
    tenure,
    type: 'Fresh Security Deposit',
    status: displayStatus,
    rawStatus: ver.status,
    fdrStatus: fdr?.status || 'UNDER_VERIFICATION',
    notes: ver.remarks || 'Awaiting scrutiny of physical FDR copy & bank lien certificate.',
    verifiedAt: ver.verifiedAt,
    verifier: verifier ? { id: verifier.id, name: verifier.name, role: verifier.role } : null,
    fdrDetails: fdr || null,
    institutionDetails: institution || null,
  };
}

export const verificationService = {
  /**
   * Helper to ensure an officer User exists for verifierId.
   */
  async getOrCreateDefaultVerifier() {
    let officer = await db.orm.public.User.first();
    if (!officer) {
      officer = await db.orm.public.User.create({
        email: 'officer@aicte-india.org',
        name: 'Dr. Amit K. Sharma (AICTE Director)',
        passwordHash: 'secret-hash-pre-auth',
        role: 'AICTE_OFFICER',
      });
    }
    return officer;
  },

  /**
   * Safe sync: Ensure every FDR that is in UNDER_VERIFICATION, SUBMITTED, DISCREPANCY,
   * or has no verification record has a corresponding Verification row.
   */
  async syncPendingVerifications() {
    const fdrs = await db.orm.public.FdrRecord.include('verifications').all();
    const verifier = await this.getOrCreateDefaultVerifier();

    for (const fdr of fdrs) {
      if (!fdr.verifications || fdr.verifications.length === 0) {
        let defaultVerStatus = 'PENDING';
        if (fdr.status === 'ACTIVE' || fdr.status === 'APPROVED') {
          defaultVerStatus = 'VERIFIED';
        } else if (fdr.status === 'DISCREPANCY') {
          defaultVerStatus = 'DISCREPANCY';
        }

        await db.orm.public.Verification.create({
          status: defaultVerStatus,
          fdrRecordId: fdr.id,
          verifierId: verifier.id,
          remarks:
            defaultVerStatus === 'DISCREPANCY'
              ? 'Discrepancy noted during bureau check.'
              : defaultVerStatus === 'VERIFIED'
              ? 'Verified and approved deposit.'
              : 'Initial submission enrolled for scrutiny.',
        });
      }
    }
  },

  /**
   * GET /api/verifications with optional filters: status, search, institutionId
   */
  async getAllVerifications({ status, search, institutionId } = {}) {
    // Sync any unlinked FDRs to guarantee consistency
    await this.syncPendingVerifications();

    let verifications = await db.orm.public.Verification
      .include('fdrRecord')
      .include('verifier')
      .all();

    // Fetch institutions in batch for quick lookup
    const institutions = await db.orm.public.Institution.all();
    const instMap = new Map(institutions.map((i) => [i.id, i]));

    let results = verifications.map((v) => {
      const fdr = v.fdrRecord;
      const inst = fdr?.institutionId ? instMap.get(fdr.institutionId) : null;
      return formatVerificationRecord(v, fdr, inst, v.verifier);
    });

    // Apply status filter
    if (status && status !== 'All') {
      const s = status.toUpperCase().replace(/ /g, '_');
      results = results.filter((item) => {
        if (s === 'PENDING' || s === 'PENDING_VERIFICATION') {
          return item.rawStatus === 'PENDING';
        }
        if (s === 'VERIFIED') return item.rawStatus === 'VERIFIED';
        if (s === 'DISCREPANCY') return item.rawStatus === 'DISCREPANCY';
        if (s === 'REJECTED') return item.rawStatus === 'REJECTED';
        return item.rawStatus === s;
      });
    }

    // Apply institutionId filter
    if (institutionId && institutionId !== 'All') {
      const pId = parseInt(institutionId, 10);
      if (!isNaN(pId)) {
        results = results.filter((item) => item.institutionId === pId);
      }
    }

    // Apply search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter((item) => {
        return (
          item.fdrNumber?.toLowerCase().includes(q) ||
          item.institution?.toLowerCase().includes(q) ||
          item.bank?.toLowerCase().includes(q) ||
          item.notes?.toLowerCase().includes(q)
        );
      });
    }

    return results;
  },

  /**
   * GET /api/verifications/:id
   */
  async getVerificationById(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid verification ID.');
      err.statusCode = 400;
      throw err;
    }

    const ver = await db.orm.public.Verification
      .include('fdrRecord')
      .include('verifier')
      .where({ id: parsedId })
      .first();

    if (!ver) return null;

    let inst = null;
    if (ver.fdrRecord?.institutionId) {
      inst = await db.orm.public.Institution.where({ id: ver.fdrRecord.institutionId }).first();
    }

    return formatVerificationRecord(ver, ver.fdrRecord, inst, ver.verifier);
  },

  /**
   * POST /api/verifications/:id/approve
   * Transitions Verification: PENDING -> VERIFIED
   * Transitions associated FdrRecord: UNDER_VERIFICATION/SUBMITTED -> APPROVED (or ACTIVE)
   */
  async approveVerification(id, { remarks } = {}) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid verification ID.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await db.orm.public.Verification.include('fdrRecord').where({ id: parsedId }).first();
    if (!existing) {
      const err = new Error(`Verification with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const nowInstant = globalThis.Temporal.Instant.from(new Date().toISOString());

    // 1. Update verification
    await db.orm.public.Verification.where({ id: parsedId }).update({
      status: 'VERIFIED',
      remarks: remarks?.trim() || existing.remarks || 'Verification approved by AICTE Officer.',
    });

    // 2. Update associated FDR record to APPROVED
    if (existing.fdrRecordId) {
      await db.orm.public.FdrRecord.where({ id: existing.fdrRecordId }).update({
        status: 'APPROVED',
      });
    }

    return this.getVerificationById(parsedId);
  },

  /**
   * POST /api/verifications/:id/discrepancy
   * Body: { remarks: "..." }
   * Transitions Verification: PENDING -> DISCREPANCY
   * Transitions associated FdrRecord: -> DISCREPANCY
   */
  async raiseDiscrepancy(id, { remarks } = {}) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid verification ID.');
      err.statusCode = 400;
      throw err;
    }

    if (!remarks || typeof remarks !== 'string' || !remarks.trim()) {
      const err = new Error('Discrepancy remarks are required and cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await db.orm.public.Verification.include('fdrRecord').where({ id: parsedId }).first();
    if (!existing) {
      const err = new Error(`Verification with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    // 1. Update verification
    await db.orm.public.Verification.where({ id: parsedId }).update({
      status: 'DISCREPANCY',
      remarks: remarks.trim(),
    });

    // 2. Update associated FDR record to DISCREPANCY
    if (existing.fdrRecordId) {
      await db.orm.public.FdrRecord.where({ id: existing.fdrRecordId }).update({
        status: 'DISCREPANCY',
      });
    }

    return this.getVerificationById(parsedId);
  },

  /**
   * POST /api/verifications/:id/reject
   * Body: { remarks: "..." }
   * Transitions Verification: PENDING -> REJECTED
   * Transitions associated FdrRecord: -> DISCREPANCY or SUBMITTED
   */
  async rejectVerification(id, { remarks } = {}) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid verification ID.');
      err.statusCode = 400;
      throw err;
    }

    if (!remarks || typeof remarks !== 'string' || !remarks.trim()) {
      const err = new Error('Rejection reason/remarks are required and cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await db.orm.public.Verification.include('fdrRecord').where({ id: parsedId }).first();
    if (!existing) {
      const err = new Error(`Verification with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    // 1. Update verification
    await db.orm.public.Verification.where({ id: parsedId }).update({
      status: 'REJECTED',
      remarks: remarks.trim(),
    });

    // 2. Update associated FDR record to DISCREPANCY (denoting action required/deficiency)
    if (existing.fdrRecordId) {
      await db.orm.public.FdrRecord.where({ id: existing.fdrRecordId }).update({
        status: 'DISCREPANCY',
      });
    }

    return this.getVerificationById(parsedId);
  },
};
