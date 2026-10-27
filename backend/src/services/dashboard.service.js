import { db } from '../prisma/db.ts';

export const dashboardService = {
  /**
   * Calculate real dashboard stats from PostgreSQL, optionally scoped by institutionId.
   */
  async getStats({ institutionId } = {}) {
    let query = db.orm.public.FdrRecord.include('institution');
    if (institutionId) {
      query = query.where({ institutionId: parseInt(institutionId, 10) });
    }

    const fdrs = await query.all();
    const verifications = await db.orm.public.Verification.include('fdrRecord').all();
    const renewals = await db.orm.public.Renewal.include('fdrRecord').all();
    const releases = await db.orm.public.ReleaseRequest.include('fdrRecord').all();

    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    const sixtyDaysAhead = new Date();
    sixtyDaysAhead.setDate(sixtyDaysAhead.getDate() + 60);

    let activeCount = 0;
    let underVerificationCount = 0;
    let discrepancyCount = 0;
    let expiringIn30DaysCount = 0;
    let expiringIn60DaysCount = 0;
    let expiredCount = 0;
    let releaseRequestedCount = 0;
    let releasedCount = 0;
    let totalSecuredAmount = 0;

    for (const fdr of fdrs) {
      const numAmount = parseFloat(fdr.amount) || 0;
      totalSecuredAmount += numAmount;

      const st = fdr.status;
      if (st === 'ACTIVE' || st === 'APPROVED') activeCount++;
      else if (st === 'UNDER_VERIFICATION' || st === 'SUBMITTED') underVerificationCount++;
      else if (st === 'DISCREPANCY') discrepancyCount++;
      else if (st === 'RELEASE_REQUESTED') releaseRequestedCount++;
      else if (st === 'RELEASED') releasedCount++;
      else if (st === 'EXPIRED') expiredCount++;

      if (fdr.maturityDate) {
        const matDate = new Date(fdr.maturityDate.toString());
        if (matDate < now && st !== 'RELEASED') {
          // Overdue
        } else if (matDate >= now && matDate <= thirtyDaysAhead && st !== 'RELEASED') {
          expiringIn30DaysCount++;
          expiringIn60DaysCount++;
        } else if (matDate >= now && matDate <= sixtyDaysAhead && st !== 'RELEASED') {
          expiringIn60DaysCount++;
        }
      }
    }

    // Scoped pending verifications
    const scopedVerifications = institutionId
      ? verifications.filter((v) => v.fdrRecord?.institutionId === parseInt(institutionId, 10))
      : verifications;
    const pendingVerifications = scopedVerifications.filter((v) => v.status === 'PENDING').length;

    // Scoped pending releases
    const scopedReleases = institutionId
      ? releases.filter((r) => r.fdrRecord?.institutionId === parseInt(institutionId, 10))
      : releases;
    const pendingReleases = scopedReleases.filter(
      (r) => !r.approvedAt && (!r.remarks || !r.remarks.startsWith('[REJECTED]'))
    ).length;

    // Status breakdown percentages
    const totalFdrs = fdrs.length;
    const calcPct = (cnt) => (totalFdrs > 0 ? Math.round((cnt / totalFdrs) * 100) : 0);

    const statusDistribution = [
      {
        label: 'Active',
        statusKey: 'ACTIVE',
        count: activeCount,
        percentage: calcPct(activeCount),
        color: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        bgLight: 'bg-emerald-50/60',
      },
      {
        label: 'Under Verification',
        statusKey: 'UNDER_VERIFICATION',
        count: underVerificationCount,
        percentage: calcPct(underVerificationCount),
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
        bgLight: 'bg-blue-50/60',
      },
      {
        label: 'Expiring Soon',
        statusKey: 'EXPIRING',
        count: expiringIn30DaysCount,
        percentage: calcPct(expiringIn30DaysCount),
        color: 'bg-amber-500',
        textColor: 'text-amber-700',
        bgLight: 'bg-amber-50/60',
      },
      {
        label: 'Discrepancy',
        statusKey: 'DISCREPANCY',
        count: discrepancyCount,
        percentage: calcPct(discrepancyCount),
        color: 'bg-rose-500',
        textColor: 'text-rose-700',
        bgLight: 'bg-rose-50/60',
      },
      {
        label: 'Release Requested',
        statusKey: 'RELEASE_REQUESTED',
        count: releaseRequestedCount,
        percentage: calcPct(releaseRequestedCount),
        color: 'bg-purple-500',
        textColor: 'text-purple-700',
        bgLight: 'bg-purple-50/60',
      },
      {
        label: 'Released',
        statusKey: 'RELEASED',
        count: releasedCount,
        percentage: calcPct(releasedCount),
        color: 'bg-slate-400',
        textColor: 'text-slate-600',
        bgLight: 'bg-slate-50',
      },
    ];

    return {
      totalFdrs,
      activeFdrs: activeCount,
      underVerification: underVerificationCount,
      pendingVerifications,
      expiringIn30Days: expiringIn30DaysCount,
      expiringIn60Days: expiringIn60DaysCount,
      discrepancies: discrepancyCount,
      pendingReleaseRequests: pendingReleases,
      releasedFdrs: releasedCount,
      totalSecuredAmount,
      totalSecuredAmountFormatted: '₹' + totalSecuredAmount.toLocaleString('en-IN'),
      statusDistribution,
    };
  },
};
