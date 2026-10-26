import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import KpiCard from './components/KpiCard';
import StatusOverview from './components/StatusOverview';
import UpcomingMaturitiesTable from './components/UpcomingMaturitiesTable';
import PendingVerificationSection from './components/PendingVerificationSection';
import RecentActivity from './components/RecentActivity';
import FdrManagementPage from './components/FdrManagementPage';
import VerificationPage from './components/VerificationPage';
import RenewalsPage from './components/RenewalsPage';
import ReleaseRequestsPage from './components/ReleaseRequestsPage';
import ReportsPage from './components/ReportsPage';
import AuditLogsPage from './components/AuditLogsPage';
import ComingSoonPage from './components/ComingSoonPage';
import FdrDetailsModal from './components/FdrDetailsModal';
import VerificationReviewModal from './components/VerificationReviewModal';
import NewFdrModal from './components/NewFdrModal';

import { INITIAL_NOTIFICATIONS } from './data/mockData';
import { fetchDashboardStats } from './services/dashboardApi';
import { CheckCircle2, X } from 'lucide-react';

function App() {
  // Navigation & UI States
  const [activeNav, setActiveNav] = useState('dashboard');
  const [fdrListFilter, setFdrListFilter] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Triggers to refresh lists when records are added, verified, renewed, or released
  const [fdrRefreshTrigger, setFdrRefreshTrigger] = useState(0);
  const [verificationRefreshTrigger, setVerificationRefreshTrigger] = useState(0);
  const [renewalRefreshTrigger, setRenewalRefreshTrigger] = useState(0);
  const [releaseRefreshTrigger, setReleaseRefreshTrigger] = useState(0);
  const [globalRefreshTrigger, setGlobalRefreshTrigger] = useState(0);

  // Real Dashboard Stats from PostgreSQL
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Modals
  const [selectedFdrId, setSelectedFdrId] = useState(null);
  const [selectedVerificationId, setSelectedVerificationId] = useState(null);
  const [isAddFdrOpen, setIsAddFdrOpen] = useState(false);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sync real dashboard statistics from GET /api/dashboard/stats
  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        setStatsLoading(true);
        const stats = await fetchDashboardStats();
        if (isMounted) {
          setDashboardStats(stats);
        }
      } catch (e) {
        console.error('Failed to load dashboard stats:', e);
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [
    verificationRefreshTrigger,
    fdrRefreshTrigger,
    renewalRefreshTrigger,
    releaseRefreshTrigger,
    globalRefreshTrigger,
  ]);

  // Real Dashboard KPI definitions derived from PostgreSQL
  const dynamicKpiCards = [
    {
      id: 'total-fdrs',
      title: 'Total FDRs',
      value: dashboardStats ? String(dashboardStats.totalFdrs) : '...',
      subtext: dashboardStats ? `${dashboardStats.totalSecuredAmountFormatted} secured` : 'PostgreSQL Live Source',
      trend: 'neutral',
      icon: 'Layers',
      onClick: () => {
        setFdrListFilter('All');
        setActiveNav('fdr-management');
      },
    },
    {
      id: 'active-fdrs',
      title: 'Active FDRs',
      value: dashboardStats ? String(dashboardStats.activeFdrs) : '...',
      subtext: dashboardStats && dashboardStats.totalFdrs > 0
        ? `${Math.round((dashboardStats.activeFdrs / dashboardStats.totalFdrs) * 100)}% compliant in system`
        : 'Active Lien Deposits',
      trend: 'positive',
      icon: 'ShieldCheck',
      onClick: () => {
        setFdrListFilter('ACTIVE');
        setActiveNav('fdr-management');
      },
    },
    {
      id: 'expiring-soon',
      title: 'Expiring in 30 Days',
      value: dashboardStats ? String(dashboardStats.expiringIn30Days) : '...',
      subtext: 'Requires renewal notices',
      trend: 'warning',
      icon: 'Clock',
      onClick: () => {
        setActiveNav('renewals');
      },
    },
    {
      id: 'pending-verification',
      title: 'Pending Verification',
      value: dashboardStats ? String(dashboardStats.pendingVerifications) : '...',
      subtext: 'Awaiting bureau officer check',
      trend: 'info',
      icon: 'FileCheck',
      onClick: () => {
        setActiveNav('verification');
      },
    },
    {
      id: 'discrepancies',
      title: 'Discrepancies',
      value: dashboardStats ? String(dashboardStats.discrepancies) : '...',
      subtext: 'Flagged by bank / officer',
      trend: 'negative',
      icon: 'AlertTriangle',
      onClick: () => {
        setFdrListFilter('DISCREPANCY');
        setActiveNav('fdr-management');
      },
    },
    {
      id: 'release-requests',
      title: 'Release Requests',
      value: dashboardStats ? String(dashboardStats.pendingReleaseRequests) : '...',
      subtext: dashboardStats?.releasedFdrs ? `${dashboardStats.releasedFdrs} already released` : 'Pending Approval',
      trend: 'purple',
      icon: 'FileBadge',
      onClick: () => {
        setActiveNav('release-requests');
      },
    },
  ];

  // Navigation handler
  const handleNavClick = (id) => {
    setActiveNav(id);
    setSidebarOpen(false);
    if (id === 'fdr-management') {
      setFdrListFilter('All');
    }
  };

  // Handle successful creation of real FDR in PostgreSQL
  const handleFdrCreatedSuccess = (created) => {
    setIsAddFdrOpen(false);
    setFdrRefreshTrigger((prev) => prev + 1);
    setVerificationRefreshTrigger((prev) => prev + 1);
    setGlobalRefreshTrigger((prev) => prev + 1);
    showToast(`FDR ${created.fdrNumber} created successfully in PostgreSQL!`);
    setSelectedFdrId(created.id);
  };

  // Verification action completed handler (from review modal)
  const handleVerificationActionComplete = (actionType, updatedRecord) => {
    setVerificationRefreshTrigger((prev) => prev + 1);
    setFdrRefreshTrigger((prev) => prev + 1);
    setGlobalRefreshTrigger((prev) => prev + 1);

    if (actionType === 'approve') {
      showToast(`Verification APPROVED! FDR ${updatedRecord.fdrNumber} is now Active.`);
    } else if (actionType === 'discrepancy') {
      showToast(`Discrepancy notice issued for ${updatedRecord.fdrNumber}.`);
    } else if (actionType === 'reject') {
      showToast(`Verification REJECTED for ${updatedRecord.fdrNumber}.`);
    }
  };

  // Generic action handler from child components
  const handleAction = (type, payload) => {
    if (type === 'view_fdr') {
      setSelectedFdrId(payload);
    } else if (type === 'review_record') {
      setSelectedVerificationId(payload.id);
    } else if (type === 'view_all_maturities') {
      setActiveNav('renewals');
    } else if (type === 'view_all_verifications') {
      setActiveNav('verification');
    } else if (type === 'view_audit_trail') {
      setActiveNav('audit-logs');
    } else {
      showToast(payload || type);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans antialiased">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          aria-label="Close menu"
        />
      )}

      {/* 1. Left Sidebar */}
      <Sidebar
        activeItem={activeNav}
        onItemClick={handleNavClick}
        isOpen={sidebarOpen}
        verificationCount={dashboardStats?.pendingVerifications || 0}
        renewalsCount={dashboardStats?.expiringIn30Days || 0}
        releaseCount={dashboardStats?.pendingReleaseRequests || 0}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        {/* 2. Top Header */}
        <TopHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={(target, filter) => {
            if (filter) setFdrListFilter(filter);
            setActiveNav(target);
          }}
          onViewFdr={(item) => setSelectedFdrId(item.id || item.fdrNumber)}
          notifications={notifications}
          onActionFeedback={showToast}
          unreadCount={notifications.filter((n) => n.unread).length}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Statutory Subtitle strip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <span className="font-semibold px-2 py-0.5 rounded bg-blue-700 text-white text-[11px] uppercase tracking-wider">
                Official
              </span>
              <span>
                All India Council for Technical Education — Statutory Body under Ministry of Education, Govt. of India
              </span>
            </div>
            <div className="font-medium text-blue-800">
              Lien Validation &amp; Tri-party Verification Active
            </div>
          </div>

          {/* PAGE ROUTING BASED ON activeNav */}

          {/* VIEW: DASHBOARD (FULLY BACKED BY REAL POSTGRESQL APIS) */}
          {activeNav === 'dashboard' && (
            <>
              {/* 3. KPI CARDS */}
              <section aria-label="KPI Cards Grid">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {dynamicKpiCards.map((kpi) => (
                    <KpiCard
                      key={kpi.id}
                      title={kpi.title}
                      value={kpi.value}
                      subtext={kpi.subtext}
                      trend={kpi.trend}
                      icon={kpi.icon}
                      onClick={kpi.onClick}
                    />
                  ))}
                </div>
              </section>

              {/* 4. FDR STATUS OVERVIEW (REAL POSTGRESQL DATA) */}
              <section aria-label="Status Distribution Overview">
                <StatusOverview
                  refreshTrigger={globalRefreshTrigger}
                  onSelectFilter={(status) => {
                    setFdrListFilter(status);
                    setActiveNav('fdr-management');
                  }}
                />
              </section>

              {/* 5. UPCOMING MATURITIES TABLE (REAL POSTGRESQL DATA) */}
              <section aria-label="Upcoming Maturities Schedule">
                <UpcomingMaturitiesTable
                  refreshTrigger={globalRefreshTrigger}
                  onAction={handleAction}
                />
              </section>

              {/* 6 & 7. TWO-COLUMN SPLIT: PENDING VERIFICATION + RECENT ACTIVITY (REAL POSTGRESQL DATA) */}
              <section
                aria-label="Pending Verification and Audit Logs"
                className="grid grid-cols-1 gap-6 lg:grid-cols-12"
              >
                <div className="lg:col-span-7">
                  <PendingVerificationSection
                    refreshTrigger={globalRefreshTrigger}
                    onAction={handleAction}
                  />
                </div>
                <div className="lg:col-span-5">
                  <RecentActivity
                    refreshTrigger={globalRefreshTrigger}
                    onAction={handleAction}
                  />
                </div>
              </section>
            </>
          )}

          {/* VIEW: FDR MANAGEMENT (CONNECTED TO REAL POSTGRESQL API) */}
          {activeNav === 'fdr-management' && (
            <FdrManagementPage
              initialFilter={fdrListFilter}
              refreshTrigger={fdrRefreshTrigger}
              onViewFdr={(id) => setSelectedFdrId(id)}
              onAddNewFdr={() => setIsAddFdrOpen(true)}
            />
          )}

          {/* VIEW: VERIFICATION QUEUE (CONNECTED TO REAL POSTGRESQL API) */}
          {activeNav === 'verification' && (
            <VerificationPage
              refreshTrigger={verificationRefreshTrigger}
              onReview={(verId) => setSelectedVerificationId(verId)}
            />
          )}

          {/* VIEW: RENEWALS (CONNECTED TO REAL POSTGRESQL API) */}
          {activeNav === 'renewals' && (
            <RenewalsPage
              refreshTrigger={renewalRefreshTrigger}
              onActionFeedback={(msg) => {
                showToast(msg);
                setFdrRefreshTrigger((prev) => prev + 1);
                setRenewalRefreshTrigger((prev) => prev + 1);
                setGlobalRefreshTrigger((prev) => prev + 1);
              }}
              onViewFdrByNumber={(fdrNum) => setSelectedFdrId(fdrNum)}
            />
          )}

          {/* VIEW: RELEASE REQUESTS (CONNECTED TO REAL POSTGRESQL API) */}
          {activeNav === 'release-requests' && (
            <ReleaseRequestsPage
              refreshTrigger={releaseRefreshTrigger}
              onActionFeedback={(msg) => {
                showToast(msg);
                setFdrRefreshTrigger((prev) => prev + 1);
                setReleaseRefreshTrigger((prev) => prev + 1);
                setGlobalRefreshTrigger((prev) => prev + 1);
              }}
              onViewFdrByNumber={(fdrNum) => setSelectedFdrId(fdrNum)}
            />
          )}

          {/* VIEW: REAL REPORTS PAGE */}
          {activeNav === 'reports' && (
            <ReportsPage onActionFeedback={showToast} />
          )}

          {/* VIEW: REAL AUDIT LOGS PAGE */}
          {activeNav === 'audit-logs' && (
            <AuditLogsPage onActionFeedback={showToast} />
          )}

          {/* VIEW: SETTINGS COMING SOON */}
          {activeNav === 'settings' && (
            <ComingSoonPage
              title="Bureau &amp; Portal Settings"
              description="Configure statutory FDR threshold amounts, notice trigger periods, and bank API integration credentials."
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} All India Council for Technical Education (AICTE), Regulation Bureau. All Rights Reserved.</p>
        </footer>
      </div>

      {/* MODALS */}
      {/* 1. FDR Details Dossier Modal with Database-backed Documents */}
      {selectedFdrId && (
        <FdrDetailsModal
          fdrId={selectedFdrId}
          onClose={() => {
            setSelectedFdrId(null);
            setGlobalRefreshTrigger((prev) => prev + 1);
          }}
          onActionFeedback={showToast}
        />
      )}

      {/* 2. Verification Review Modal */}
      {selectedVerificationId && (
        <VerificationReviewModal
          verificationId={selectedVerificationId}
          onClose={() => setSelectedVerificationId(null)}
          onActionComplete={handleVerificationActionComplete}
        />
      )}

      {/* 3. Add New FDR Modal */}
      {isAddFdrOpen && (
        <NewFdrModal
          onClose={() => setIsAddFdrOpen(false)}
          onSuccess={handleFdrCreatedSuccess}
        />
      )}

      {/* Floating Interactive Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl transition-all">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 rounded text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
