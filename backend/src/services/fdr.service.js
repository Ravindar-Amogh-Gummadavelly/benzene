import { db } from '../prisma/db.ts';

/**
 * Format a database FdrRecord into a rich JSON response matching portal requirements.
 */
function formatFdrRecord(record) {
  if (!record) return null;

  const issueDateObj = record.issueDate ? new Date(record.issueDate.toString()) : null;
  const maturityDateObj = record.maturityDate ? new Date(record.maturityDate.toString()) : null;

  // Days remaining calculation
  let daysRemaining = null;
  if (maturityDateObj) {
    const now = new Date();
    const diffTime = maturityDateObj.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Derive verification status from latest verification relation if present
  let verificationStatus = 'PENDING';
  if (record.verifications && record.verifications.length > 0) {
    const latestVer = record.verifications[record.verifications.length - 1];
    verificationStatus = latestVer.status || 'PENDING';
  } else if (record.status === 'ACTIVE' || record.status === 'APPROVED') {
    verificationStatus = 'VERIFIED';
  } else if (record.status === 'DISCREPANCY') {
    verificationStatus = 'DISCREPANCY';
  }

  // Format currency display (e.g. ₹35,00,000)
  const numAmount = parseFloat(record.amount);
  const formattedAmount = isNaN(numAmount)
    ? record.amount
    : '₹' + numAmount.toLocaleString('en-IN');

  // Tenure calculation if not explicitly stored
  let tenure = '5 Years';
  if (issueDateObj && maturityDateObj) {
    const yearsDiff = Math.round(
      (maturityDateObj.getTime() - issueDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
    if (yearsDiff > 0) {
      tenure = `${yearsDiff} Years`;
    }
  }

  return {
    id: record.id,
    fdrNumber: record.fdrNumber,
    aicteApplicationId: record.institution?.code || null,
    institution: record.institution?.name || null,
    institutionId: record.institutionId,
    institutionDetails: record.institution || null,
    bank: record.bankName,
    bankName: record.bankName,
    branch: record.branchName,
    branchName: record.branchName,
    ifsc: record.ifsc || 'SBIN0000691',
    amount: formattedAmount,
    numericAmount: numAmount,
    issueDate: issueDateObj ? issueDateObj.toISOString().split('T')[0] : null,
    maturityDate: maturityDateObj ? maturityDateObj.toISOString().split('T')[0] : null,
    daysRemaining,
    tenure,
    status: record.status,
    verificationStatus,
    jointAccountHolder: 'Regional Officer, AICTE',
    documents: record.documents || [],
    verifications: record.verifications || [],
    renewals: record.renewals || [],
    releaseRequests: record.releaseRequests || [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Service providing database operations on FdrRecord via Prisma 8.
 */
export const fdrService = {
  /**
   * Find or resolve institution by ID or Name.
   */
  async resolveInstitution({ institutionId, institution, aicteApplicationId }) {
    if (institutionId) {
      const parsedId = parseInt(institutionId, 10);
      const existing = await db.orm.public.Institution.where({ id: parsedId }).first();
      if (existing) return existing;
    }

    if (institution) {
      const instName = institution.trim();
      const existing = await db.orm.public.Institution.where({ name: instName }).first();
      if (existing) return existing;

      // Auto-create institution if not found
      const code = aicteApplicationId || `AICTE-INST-${Date.now().toString().slice(-6)}`;
      const created = await db.orm.public.Institution.create({
        name: instName,
        code,
        address: 'Registered Institution Campus',
      });
      return created;
    }

    return null;
  },

  /**
   * Get all FDRs with optional filters (status, institutionId, search)
   */
  async getAllFdrs({ status, institutionId, search } = {}) {
    let query = db.orm.public.FdrRecord.include('institution').include('verifications');

    if (status) {
      const normalizedStatus = String(status).toUpperCase().replace(/ /g, '_');
      query = query.where({ status: normalizedStatus });
    }

    if (institutionId) {
      const parsedId = parseInt(institutionId, 10);
      if (!isNaN(parsedId)) {
        query = query.where({ institutionId: parsedId });
      }
    }

    let records = await query.all();

    // Client-side text search across institution name, bank, or fdrNumber if search param provided
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      records = records.filter((rec) => {
        const matchesFdr = rec.fdrNumber?.toLowerCase().includes(q);
        const matchesBank = rec.bankName?.toLowerCase().includes(q);
        const matchesBranch = rec.branchName?.toLowerCase().includes(q);
        const matchesInst = rec.institution?.name?.toLowerCase().includes(q);
        const matchesCode = rec.institution?.code?.toLowerCase().includes(q);
        return matchesFdr || matchesBank || matchesBranch || matchesInst || matchesCode;
      });
    }

    return records.map(formatFdrRecord);
  },

  /**
   * Get single FDR by ID or FDR Number
   */
  async getFdrById(idOrNumber) {
    const parsedId = parseInt(idOrNumber, 10);
    let record = null;

    if (!isNaN(parsedId) && String(parsedId) === String(idOrNumber)) {
      record = await db.orm.public.FdrRecord
        .include('institution')
        .include('verifications')
        .include('documents')
        .include('renewals')
        .include('releaseRequests')
        .where({ id: parsedId })
        .first();
    } else {
      record = await db.orm.public.FdrRecord
        .include('institution')
        .include('verifications')
        .include('documents')
        .include('renewals')
        .include('releaseRequests')
        .where({ fdrNumber: String(idOrNumber) })
        .first();
    }

    return record ? formatFdrRecord(record) : null;
  },

  /**
   * Create a new FDR record
   */
  async createFdr(data) {
    // 1. Check if FDR Number already exists
    const existing = await db.orm.public.FdrRecord.where({ fdrNumber: data.fdrNumber.trim() }).first();
    if (existing) {
      const error = new Error(`FDR record with number '${data.fdrNumber}' already exists.`);
      error.statusCode = 400;
      throw error;
    }

    // 2. Resolve institution
    const institution = await this.resolveInstitution({
      institutionId: data.institutionId,
      institution: data.institution || data.institutionName,
      aicteApplicationId: data.aicteApplicationId || data.applicationId,
    });

    if (!institution) {
      const error = new Error('Could not resolve institution. Please provide a valid institutionId or institution name.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Normalize amount and dates
    const cleanAmount = String(data.amount).replace(/[₹, ]/g, '');
    const issueDateInstant = globalThis.Temporal.Instant.from(new Date(data.issueDate).toISOString());
    const maturityDateInstant = globalThis.Temporal.Instant.from(new Date(data.maturityDate).toISOString());

    const normalizedStatus = data.status
      ? String(data.status).toUpperCase().replace(/ /g, '_')
      : 'SUBMITTED';

    // 4. Create in DB
    const created = await db.orm.public.FdrRecord.create({
      fdrNumber: data.fdrNumber.trim(),
      bankName: (data.bankName || data.bank).trim(),
      branchName: (data.branchName || data.branch || '').trim() || null,
      amount: cleanAmount,
      issueDate: issueDateInstant,
      maturityDate: maturityDateInstant,
      status: normalizedStatus,
      institutionId: institution.id,
    });

    // 5. Return formatted
    return this.getFdrById(created.id);
  },

  /**
   * Update an existing FDR record
   */
  async updateFdr(id, data) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const error = new Error('Invalid FDR ID.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await db.orm.public.FdrRecord.where({ id: parsedId }).first();
    if (!existing) {
      return null;
    }

    // If fdrNumber is being updated, ensure uniqueness
    if (data.fdrNumber && data.fdrNumber.trim() !== existing.fdrNumber) {
      const duplicate = await db.orm.public.FdrRecord.where({ fdrNumber: data.fdrNumber.trim() }).first();
      if (duplicate && duplicate.id !== parsedId) {
        const error = new Error(`FDR record with number '${data.fdrNumber}' already exists.`);
        error.statusCode = 400;
        throw error;
      }
    }

    const updatePayload = {};

    if (data.fdrNumber !== undefined) updatePayload.fdrNumber = data.fdrNumber.trim();
    if (data.bankName !== undefined || data.bank !== undefined) {
      updatePayload.bankName = (data.bankName || data.bank).trim();
    }
    if (data.branchName !== undefined || data.branch !== undefined) {
      updatePayload.branchName = (data.branchName || data.branch || '').trim() || null;
    }
    if (data.amount !== undefined) {
      updatePayload.amount = String(data.amount).replace(/[₹, ]/g, '');
    }
    if (data.issueDate !== undefined) {
      updatePayload.issueDate = globalThis.Temporal.Instant.from(new Date(data.issueDate).toISOString());
    }
    if (data.maturityDate !== undefined) {
      updatePayload.maturityDate = globalThis.Temporal.Instant.from(new Date(data.maturityDate).toISOString());
    }
    if (data.status !== undefined) {
      updatePayload.status = String(data.status).toUpperCase().replace(/ /g, '_');
    }
    if (data.institutionId !== undefined) {
      updatePayload.institutionId = parseInt(data.institutionId, 10);
    }

    await db.orm.public.FdrRecord.where({ id: parsedId }).update(updatePayload);

    return this.getFdrById(parsedId);
  },

  /**
   * Delete an existing FDR record
   */
  async deleteFdr(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const error = new Error('Invalid FDR ID.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await db.orm.public.FdrRecord.where({ id: parsedId }).first();
    if (!existing) {
      return false;
    }

    await db.orm.public.FdrRecord.where({ id: parsedId }).delete();
    return true;
  },

  /**
   * Compute aggregate metrics and statistics for dashboard & reporting
   */
  async getStats() {
    const all = await db.orm.public.FdrRecord.all();

    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    let activeCount = 0;
    let underVerificationCount = 0;
    let expiringIn30DaysCount = 0;
    let expiredCount = 0;
    let discrepancyCount = 0;
    let releaseRequestedCount = 0;
    let releasedCount = 0;
    let totalAmount = 0;

    for (const fdr of all) {
      const status = fdr.status;
      const numAmount = parseFloat(fdr.amount) || 0;
      totalAmount += numAmount;

      if (status === 'ACTIVE' || status === 'APPROVED') activeCount++;
      else if (status === 'UNDER_VERIFICATION' || status === 'SUBMITTED') underVerificationCount++;
      else if (status === 'DISCREPANCY') discrepancyCount++;
      else if (status === 'RELEASE_REQUESTED') releaseRequestedCount++;
      else if (status === 'RELEASED') releasedCount++;
      else if (status === 'EXPIRED') expiredCount++;

      // Check upcoming maturity
      if (fdr.maturityDate) {
        const matDate = new Date(fdr.maturityDate.toString());
        if (matDate > now && matDate <= thirtyDaysAhead && status !== 'RELEASED') {
          expiringIn30DaysCount++;
        }
      }
    }

    return {
      totalFdrs: all.length,
      activeFdrs: activeCount,
      underVerification: underVerificationCount,
      expiringIn30Days: expiringIn30DaysCount,
      expiredFdrs: expiredCount,
      discrepancies: discrepancyCount,
      releaseRequests: releaseRequestedCount,
      releasedFdrs: releasedCount,
      totalAmount,
      totalAmountFormatted: '₹' + totalAmount.toLocaleString('en-IN'),
    };
  },
};
