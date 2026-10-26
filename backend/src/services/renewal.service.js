import { db } from '../prisma/db.ts';

/**
 * Calculate maturity urgency and remaining days from a maturity date.
 */
export function calculateMaturityMetrics(maturityDateInput) {
  if (!maturityDateInput) {
    return {
      daysRemaining: null,
      isExpired: false,
      urgency: 'NORMAL', // 'OVERDUE' | 'URGENT' | 'APPROACHING' | 'NORMAL'
      urgencyLabel: 'Normal',
      urgencyCategory: 'LATER', // 'OVERDUE' | 'DUE_7_DAYS' | 'DUE_30_DAYS' | 'DUE_60_DAYS' | 'LATER'
    };
  }

  const matDate = new Date(maturityDateInput.toString());
  const now = new Date();
  
  // Calculate difference in whole calendar days
  const diffTime = matDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let urgency = 'NORMAL';
  let urgencyLabel = 'Normal';
  let urgencyCategory = 'LATER';
  let isExpired = false;

  if (daysRemaining < 0) {
    isExpired = true;
    urgency = 'OVERDUE';
    urgencyLabel = 'Overdue / Matured';
    urgencyCategory = 'OVERDUE';
  } else if (daysRemaining <= 7) {
    urgency = 'URGENT';
    urgencyLabel = 'Due in ≤ 7 Days';
    urgencyCategory = 'DUE_7_DAYS';
  } else if (daysRemaining <= 30) {
    urgency = 'URGENT';
    urgencyLabel = 'Due in ≤ 30 Days';
    urgencyCategory = 'DUE_30_DAYS';
  } else if (daysRemaining <= 60) {
    urgency = 'APPROACHING';
    urgencyLabel = 'Due in ≤ 60 Days';
    urgencyCategory = 'DUE_60_DAYS';
  } else {
    urgency = 'NORMAL';
    urgencyLabel = 'Normal';
    urgencyCategory = 'LATER';
  }

  return {
    daysRemaining,
    isExpired,
    urgency,
    urgencyLabel,
    urgencyCategory,
  };
}

/**
 * Format a renewal item for the frontend UI.
 * Can represent a Renewal record, or an FDR record with its latest renewal information.
 */
function formatRenewalItem(fdr, institution, renewal = null, allRenewals = []) {
  if (!fdr) return null;

  const issueDateObj = fdr.issueDate ? new Date(fdr.issueDate.toString()) : null;
  const currentMaturityObj = fdr.maturityDate ? new Date(fdr.maturityDate.toString()) : null;
  const metrics = calculateMaturityMetrics(fdr.maturityDate);

  const numAmount = parseFloat(fdr.amount);
  const formattedAmount = isNaN(numAmount)
    ? fdr.amount || '₹0'
    : '₹' + numAmount.toLocaleString('en-IN');

  const history = allRenewals.map((r) => ({
    id: r.id,
    oldMaturityDate: r.oldMaturityDate ? new Date(r.oldMaturityDate.toString()).toISOString().split('T')[0] : null,
    newMaturityDate: r.newMaturityDate ? new Date(r.newMaturityDate.toString()).toISOString().split('T')[0] : null,
    renewedAt: r.renewedAt ? new Date(r.renewedAt.toString()).toISOString() : null,
    remarks: r.remarks || null,
    createdAt: r.createdAt ? new Date(r.createdAt.toString()).toISOString() : null,
  }));

  // Has this FDR undergone renewals?
  const hasRenewals = history.length > 0;
  const latestRenewal = hasRenewals ? history[history.length - 1] : null;

  // Derive human-readable renewal status
  let status = 'Pending Renewal Notice';
  if (latestRenewal?.newMaturityDate) {
    status = 'Renewed';
  } else if (metrics.isExpired) {
    status = 'Overdue for Renewal';
  } else if (metrics.urgencyCategory === 'DUE_7_DAYS' || metrics.urgencyCategory === 'DUE_30_DAYS') {
    status = 'Approaching Maturity';
  } else {
    status = 'Active Term';
  }

  return {
    id: renewal?.id || `fdr-${fdr.id}`,
    renewalId: renewal?.id || null,
    fdrRecordId: fdr.id,
    fdrNumber: fdr.fdrNumber,
    institution: institution?.name || 'Institutional Depository',
    institutionId: institution?.id || fdr.institutionId,
    institutionCode: institution?.code || 'AICTE-REG',
    bank: fdr.bankName,
    branch: fdr.branchName || 'Main Branch',
    amount: formattedAmount,
    numericAmount: numAmount,
    issueDate: issueDateObj ? issueDateObj.toISOString().split('T')[0] : null,
    currentMaturityDate: currentMaturityObj ? currentMaturityObj.toISOString().split('T')[0] : null,
    daysRemaining: metrics.daysRemaining,
    isExpired: metrics.isExpired,
    urgency: metrics.urgency,
    urgencyLabel: metrics.urgencyLabel,
    urgencyCategory: metrics.urgencyCategory,
    status: status,
    fdrStatus: fdr.status,
    proposedTenure: '3 - 5 Years (Statutory Extension)',
    requestNotes: renewal?.remarks || (metrics.isExpired ? 'FDR reached term expiration. Mandatory statutory extension or claim deed required.' : `Term expires in ${metrics.daysRemaining} days. Lien endorsement in favor of AICTE must be extended.`),
    renewalHistory: history,
    latestRenewal: latestRenewal,
    fdrDetails: fdr,
    institutionDetails: institution,
  };
}

export const renewalService = {
  /**
   * GET /api/renewals
   * Returns list of FDR records and their renewal status with filters:
   * status, search, institutionId, urgency
   */
  async getAllRenewals({ status, search, institutionId, urgency } = {}) {
    const fdrs = await db.orm.public.FdrRecord
      .include('renewals')
      .all();

    const institutions = await db.orm.public.Institution.all();
    const instMap = new Map(institutions.map((i) => [i.id, i]));

    let results = fdrs.map((fdr) => {
      const inst = fdr.institutionId ? instMap.get(fdr.institutionId) : null;
      const fdrRenewals = fdr.renewals || [];
      const latestRenewal = fdrRenewals.length > 0 ? fdrRenewals[fdrRenewals.length - 1] : null;
      return formatRenewalItem(fdr, inst, latestRenewal, fdrRenewals);
    });

    // Urgency filter: 'OVERDUE' | 'DUE_7_DAYS' | 'DUE_30_DAYS' | 'DUE_60_DAYS' | 'LATER'
    if (urgency && urgency !== 'ALL') {
      const u = urgency.toUpperCase();
      results = results.filter((item) => {
        if (u === 'EXPIRING_30' || u === '30_DAYS') {
          return item.urgencyCategory === 'DUE_7_DAYS' || item.urgencyCategory === 'DUE_30_DAYS' || item.urgencyCategory === 'OVERDUE';
        }
        return item.urgencyCategory === u || item.urgency === u;
      });
    }

    // Status filter
    if (status && status !== 'All') {
      const s = status.toLowerCase();
      results = results.filter((item) => {
        return item.status.toLowerCase().includes(s) || item.fdrStatus.toLowerCase() === s;
      });
    }

    // Institution filter
    if (institutionId && institutionId !== 'All') {
      const pId = parseInt(institutionId, 10);
      if (!isNaN(pId)) {
        results = results.filter((item) => item.institutionId === pId);
      }
    }

    // Search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter((item) => {
        return (
          item.fdrNumber?.toLowerCase().includes(q) ||
          item.institution?.toLowerCase().includes(q) ||
          item.bank?.toLowerCase().includes(q) ||
          item.requestNotes?.toLowerCase().includes(q)
        );
      });
    }

    // Sort by daysRemaining ascending (most urgent first)
    results.sort((a, b) => {
      if (a.daysRemaining === null) return 1;
      if (b.daysRemaining === null) return -1;
      return a.daysRemaining - b.daysRemaining;
    });

    return results;
  },

  /**
   * GET /api/renewals/:id
   * Supports either Renewal ID (integer) or FDR record ID (integer)
   */
  async getRenewalById(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid renewal or FDR ID.');
      err.statusCode = 400;
      throw err;
    }

    // Try finding Renewal first
    let renewal = await db.orm.public.Renewal
      .include('fdrRecord')
      .where({ id: parsedId })
      .first();

    let fdr = null;
    if (renewal && renewal.fdrRecord) {
      fdr = renewal.fdrRecord;
    } else {
      // Otherwise check if ID is an FDR record ID
      fdr = await db.orm.public.FdrRecord
        .include('renewals')
        .where({ id: parsedId })
        .first();
    }

    if (!fdr) {
      return null;
    }

    let inst = null;
    if (fdr.institutionId) {
      inst = await db.orm.public.Institution.where({ id: fdr.institutionId }).first();
    }

    const allRenewals = await db.orm.public.Renewal
      .where({ fdrRecordId: fdr.id })
      .all();

    const currentRenewal = renewal || (allRenewals.length > 0 ? allRenewals[allRenewals.length - 1] : null);

    return formatRenewalItem(fdr, inst, currentRenewal, allRenewals);
  },

  /**
   * POST /api/renewals/:id
   * Create a new Renewal entry for an FDR record and optionally extend its maturity date.
   * Body: {
   *   newMaturityDate: "YYYY-MM-DD",
   *   remarks: "...",
   *   updateFdrStatus: "ACTIVE" | "APPROVED" (optional)
   * }
   */
  async createRenewal(fdrOrRenewalId, { newMaturityDate, remarks, updateFdrStatus } = {}) {
    const parsedId = parseInt(fdrOrRenewalId, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid ID provided for renewal.');
      err.statusCode = 400;
      throw err;
    }

    // Resolve FDR record
    let fdr = await db.orm.public.FdrRecord.where({ id: parsedId }).first();
    if (!fdr) {
      const ren = await db.orm.public.Renewal.where({ id: parsedId }).first();
      if (ren) {
        fdr = await db.orm.public.FdrRecord.where({ id: ren.fdrRecordId }).first();
      }
    }

    if (!fdr) {
      const err = new Error(`FDR Record with ID '${fdrOrRenewalId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    let parsedNewMaturity = null;
    let newMaturityInstant = null;
    if (newMaturityDate) {
      parsedNewMaturity = new Date(newMaturityDate);
      if (isNaN(parsedNewMaturity.getTime())) {
        const err = new Error('Invalid newMaturityDate format. Please use YYYY-MM-DD.');
        err.statusCode = 400;
        throw err;
      }
      newMaturityInstant = globalThis.Temporal.Instant.from(parsedNewMaturity.toISOString());
    }

    const oldMaturityInstant = fdr.maturityDate;
    const nowIsoString = new Date().toISOString();

    // Create Renewal record
    const createdRenewal = await db.orm.public.Renewal.create({
      fdrRecordId: fdr.id,
      oldMaturityDate: oldMaturityInstant,
      newMaturityDate: newMaturityInstant,
      renewedAt: nowIsoString,
      remarks: remarks?.trim() || 'FDR deposit term renewed with AICTE lien continuity.',
    });

    // Update FdrRecord if newMaturityDate was provided
    if (newMaturityInstant) {
      const updateData = {
        maturityDate: newMaturityInstant,
      };

      // If FDR was EXPIRED or UNDER_VERIFICATION, transition to ACTIVE or specified status
      if (updateFdrStatus) {
        updateData.status = updateFdrStatus;
      } else if (fdr.status === 'EXPIRED') {
        updateData.status = 'ACTIVE';
      }

      await db.orm.public.FdrRecord.where({ id: fdr.id }).update(updateData);
    }

    return this.getRenewalById(createdRenewal.id);
  },

  /**
   * PUT /api/renewals/:id
   * Update an existing Renewal record.
   */
  async updateRenewal(id, { newMaturityDate, remarks } = {}) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid renewal ID.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await db.orm.public.Renewal.where({ id: parsedId }).first();
    if (!existing) {
      const err = new Error(`Renewal with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    if (remarks !== undefined) {
      updateData.remarks = remarks ? remarks.trim() : null;
    }

    if (newMaturityDate) {
      const parsed = new Date(newMaturityDate);
      if (isNaN(parsed.getTime())) {
        const err = new Error('Invalid newMaturityDate format.');
        err.statusCode = 400;
        throw err;
      }
      const newInstant = globalThis.Temporal.Instant.from(parsed.toISOString());
      updateData.newMaturityDate = newInstant;

      // Also sync to parent FDR
      await db.orm.public.FdrRecord.where({ id: existing.fdrRecordId }).update({
        maturityDate: newInstant,
      });
    }

    await db.orm.public.Renewal.where({ id: parsedId }).update(updateData);
    return this.getRenewalById(parsedId);
  },

  /**
   * POST /api/renewals/:id/complete
   * Finalize/complete renewal processing for an FDR record.
   * Body: {
   *   newMaturityDate: "YYYY-MM-DD",
   *   extensionYears: 3,
   *   remarks: "..."
   * }
   */
  async completeRenewal(id, { newMaturityDate, extensionYears = 5, remarks } = {}) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      const err = new Error('Invalid ID for completing renewal.');
      err.statusCode = 400;
      throw err;
    }

    // Check if ID is a Renewal or an FdrRecord
    let renewal = await db.orm.public.Renewal.where({ id: parsedId }).first();
    let fdr = null;
    if (renewal) {
      fdr = await db.orm.public.FdrRecord.where({ id: renewal.fdrRecordId }).first();
    } else {
      fdr = await db.orm.public.FdrRecord.where({ id: parsedId }).first();
    }

    if (!fdr) {
      const err = new Error(`Record with ID '${id}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    let calculatedNewMaturity = null;
    if (newMaturityDate) {
      calculatedNewMaturity = new Date(newMaturityDate);
    } else {
      // Calculate from existing maturity date + extensionYears
      const currentMat = new Date(fdr.maturityDate.toString());
      calculatedNewMaturity = new Date(currentMat.getFullYear() + extensionYears, currentMat.getMonth(), currentMat.getDate());
    }

    if (isNaN(calculatedNewMaturity.getTime())) {
      const err = new Error('Invalid new maturity date.');
      err.statusCode = 400;
      throw err;
    }

    const newMaturityInstant = globalThis.Temporal.Instant.from(calculatedNewMaturity.toISOString());
    const nowIsoString = new Date().toISOString();

    // 1. Create or update Renewal record
    let targetRenewalId = null;
    if (renewal) {
      await db.orm.public.Renewal.where({ id: renewal.id }).update({
        newMaturityDate: newMaturityInstant,
        renewedAt: nowIsoString,
        remarks: remarks?.trim() || `Renewal processed successfully for ${extensionYears} years extension.`,
      });
      targetRenewalId = renewal.id;
    } else {
      const created = await db.orm.public.Renewal.create({
        fdrRecordId: fdr.id,
        oldMaturityDate: fdr.maturityDate,
        newMaturityDate: newMaturityInstant,
        renewedAt: nowIsoString,
        remarks: remarks?.trim() || `Renewal processed successfully for ${extensionYears} years extension.`,
      });
      targetRenewalId = created.id;
    }

    // 2. Update FDR record with new maturity date and status ACTIVE
    await db.orm.public.FdrRecord.where({ id: fdr.id }).update({
      maturityDate: newMaturityInstant,
      status: 'ACTIVE',
    });

    // Audit Log
    try {
      await db.orm.public.AuditLog.create({
        action: 'RENEWAL_COMPLETED',
        entityType: 'Renewal',
        entityId: targetRenewalId,
        details: `Renewal #${targetRenewalId} completed for FDR ${fdr.fdrNumber}. Extended to ${calculatedNewMaturity.toISOString().split('T')[0]}.`,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('AuditLog notice (Renewal complete):', e.message);
    }

    return this.getRenewalById(targetRenewalId);
  },
};
