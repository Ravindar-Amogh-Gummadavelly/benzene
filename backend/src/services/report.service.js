import { db } from '../prisma/db.ts';

export const reportService = {
  /**
   * 1. FDR Summary Report
   * GET /api/reports/fdr-summary
   */
  async getFdrSummaryReport({ institutionId, status } = {}) {
    let query = db.orm.public.FdrRecord.include('institution');

    if (status && status !== 'All') {
      const normalized = status.toUpperCase().replace(/ /g, '_');
      query = query.where({ status: normalized });
    }

    if (institutionId && institutionId !== 'All') {
      const pid = parseInt(institutionId, 10);
      if (!isNaN(pid)) {
        query = query.where({ institutionId: pid });
      }
    }

    const records = await query.all();

    // Grouping by Bank
    const bankMap = {};
    let totalSecuredAmount = 0;

    const formattedRecords = records.map((r) => {
      const numAmount = parseFloat(r.amount) || 0;
      totalSecuredAmount += numAmount;

      if (!bankMap[r.bankName]) {
        bankMap[r.bankName] = { bank: r.bankName, count: 0, totalAmount: 0 };
      }
      bankMap[r.bankName].count += 1;
      bankMap[r.bankName].totalAmount += numAmount;

      return {
        id: r.id,
        fdrNumber: r.fdrNumber,
        institution: r.institution?.name || 'N/A',
        institutionCode: r.institution?.code || 'N/A',
        bankName: r.bankName,
        branchName: r.branchName || 'N/A',
        amount: numAmount,
        amountFormatted: '₹' + numAmount.toLocaleString('en-IN'),
        issueDate: r.issueDate ? new Date(r.issueDate.toString()).toISOString().split('T')[0] : 'N/A',
        maturityDate: r.maturityDate ? new Date(r.maturityDate.toString()).toISOString().split('T')[0] : 'N/A',
        status: r.status,
      };
    });

    const bankBreakdown = Object.values(bankMap).map((b) => ({
      ...b,
      totalAmountFormatted: '₹' + b.totalAmount.toLocaleString('en-IN'),
    }));

    return {
      reportType: 'FDR_SUMMARY',
      generatedAt: new Date().toISOString(),
      summary: {
        totalRecords: records.length,
        totalSecuredAmount,
        totalSecuredAmountFormatted: '₹' + totalSecuredAmount.toLocaleString('en-IN'),
        banksCovered: bankBreakdown.length,
      },
      bankBreakdown,
      records: formattedRecords,
    };
  },

  /**
   * 2. Maturity / Expiry Report
   * GET /api/reports/maturity
   */
  async getMaturityReport({ timeframe = '30_DAYS' } = {}) {
    const fdrs = await db.orm.public.FdrRecord.include('institution').all();
    const now = new Date();

    const formatted = [];
    let overdueCount = 0;
    let upcomingCount = 0;
    let totalAmountAtRisk = 0;

    for (const f of fdrs) {
      if (f.status === 'RELEASED') continue;

      const matDate = f.maturityDate ? new Date(f.maturityDate.toString()) : null;
      if (!matDate) continue;

      const diffTime = matDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const numAmount = parseFloat(f.amount) || 0;

      let urgency = 'NORMAL';
      if (daysRemaining < 0) {
        urgency = 'OVERDUE';
        overdueCount++;
        totalAmountAtRisk += numAmount;
      } else if (daysRemaining <= 30) {
        urgency = 'CRITICAL';
        upcomingCount++;
        totalAmountAtRisk += numAmount;
      } else if (daysRemaining <= 60) {
        urgency = 'APPROACHING';
        upcomingCount++;
      }

      formatted.push({
        id: f.id,
        fdrNumber: f.fdrNumber,
        institution: f.institution?.name || 'N/A',
        bankName: f.bankName,
        amount: numAmount,
        amountFormatted: '₹' + numAmount.toLocaleString('en-IN'),
        maturityDate: matDate.toISOString().split('T')[0],
        daysRemaining,
        urgency,
        status: f.status,
      });
    }

    // Sort by daysRemaining ascending (overdue first, then upcoming)
    formatted.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      reportType: 'MATURITY_EXPIRY',
      generatedAt: new Date().toISOString(),
      summary: {
        totalTracked: formatted.length,
        overdueCount,
        upcomingCount,
        totalAmountAtRisk,
        totalAmountAtRiskFormatted: '₹' + totalAmountAtRisk.toLocaleString('en-IN'),
      },
      records: formatted,
    };
  },

  /**
   * 3. Verification Audit Report
   * GET /api/reports/verification
   */
  async getVerificationReport() {
    const verifications = await db.orm.public.Verification
      .include('fdrRecord')
      .include('verifier')
      .all();

    const institutions = await db.orm.public.Institution.all();
    const instMap = new Map(institutions.map((i) => [i.id, i]));

    let pendingCount = 0;
    let verifiedCount = 0;
    let discrepancyCount = 0;
    let rejectedCount = 0;

    const formatted = verifications.map((v) => {
      const fdr = v.fdrRecord;
      const inst = fdr?.institutionId ? instMap.get(fdr.institutionId) : null;
      const st = v.status;

      if (st === 'PENDING') pendingCount++;
      else if (st === 'VERIFIED') verifiedCount++;
      else if (st === 'DISCREPANCY') discrepancyCount++;
      else if (st === 'REJECTED') rejectedCount++;

      const numAmount = fdr ? parseFloat(fdr.amount) : 0;

      return {
        id: v.id,
        fdrNumber: fdr?.fdrNumber || `FDR #${v.fdrRecordId}`,
        institution: inst?.name || 'N/A',
        bankName: fdr?.bankName || 'N/A',
        amount: numAmount,
        amountFormatted: '₹' + numAmount.toLocaleString('en-IN'),
        verificationStatus: v.status,
        remarks: v.remarks || 'No remarks recorded',
        verifiedAt: v.verifiedAt ? new Date(v.verifiedAt.toString()).toISOString().split('T')[0] : null,
        verifierName: v.verifier?.name || 'Bureau Verification Officer',
      };
    });

    return {
      reportType: 'VERIFICATION_AUDIT',
      generatedAt: new Date().toISOString(),
      summary: {
        totalVerifications: verifications.length,
        pendingCount,
        verifiedCount,
        discrepancyCount,
        rejectedCount,
        complianceRate: verifications.length > 0 ? Math.round((verifiedCount / verifications.length) * 100) : 0,
      },
      records: formatted,
    };
  },

  /**
   * 4. Release & Refund Report
   * GET /api/reports/releases
   */
  async getReleaseReport() {
    const releases = await db.orm.public.ReleaseRequest
      .include('fdrRecord')
      .all();

    const institutions = await db.orm.public.Institution.all();
    const instMap = new Map(institutions.map((i) => [i.id, i]));

    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let totalRefundedAmount = 0;

    const formatted = releases.map((r) => {
      const fdr = r.fdrRecord;
      const inst = fdr?.institutionId ? instMap.get(fdr.institutionId) : null;
      const numAmount = fdr ? parseFloat(fdr.amount) : 0;

      let status = 'Pending Approval';
      if (r.approvedAt) {
        if (r.remarks?.startsWith('[REJECTED]')) {
          status = 'Rejected';
          rejectedCount++;
        } else {
          status = 'Approved';
          approvedCount++;
          totalRefundedAmount += numAmount;
        }
      } else {
        pendingCount++;
      }

      return {
        id: r.id,
        fdrNumber: fdr?.fdrNumber || `FDR #${r.fdrRecordId}`,
        institution: inst?.name || 'N/A',
        bankName: fdr?.bankName || 'N/A',
        amount: numAmount,
        amountFormatted: '₹' + numAmount.toLocaleString('en-IN'),
        requestedAt: r.requestedAt ? new Date(r.requestedAt.toString()).toISOString().split('T')[0] : 'N/A',
        approvedAt: r.approvedAt ? new Date(r.approvedAt.toString()).toISOString().split('T')[0] : null,
        status,
        remarks: r.remarks || 'No remarks recorded',
      };
    });

    return {
      reportType: 'RELEASE_REFUND',
      generatedAt: new Date().toISOString(),
      summary: {
        totalRequests: releases.length,
        approvedCount,
        pendingCount,
        rejectedCount,
        totalRefundedAmount,
        totalRefundedAmountFormatted: '₹' + totalRefundedAmount.toLocaleString('en-IN'),
      },
      records: formatted,
    };
  },
};
