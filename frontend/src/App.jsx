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
import ComingSoonPage from './components/ComingSoonPage';
import FdrDetailsModal from './components/FdrDetailsModal';
import VerificationReviewModal from './components/VerificationReviewModal';
import NewFdrModal from './components/NewFdrModal';

import {
  INITIAL_FDR_LIST,
  INITIAL_VERIFICATIONS,
  INITIAL_RENEWALS,
  INITIAL_RELEASE_REQUESTS,
  INITIAL_NOTIFICATIONS,
} from './data/mockData';

import { fetchVerifications } from './services/verificationApi';
import { fetchRenewals } from './services/renewalApi';
import { fetchReleases } from './services/releaseApi';
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

  // Live counts from backend API
  const [pendingVerCount, setPendingVerCount] = useState(1);
  const [expiringRenewalsCount, setExpiringRenewalsCount] = useState(0);
  const [pendingReleaseCount, setPendingReleaseCount] = useState(0);

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

  // Sync pending verification count, upcoming maturities count, and pending release count
  useEffect(() => {
    async function updateCounts() {
      try {
        const queue = await fetchVerifications({ status: 'PENDING' });
        setPendingVerCount(queue.length);
      } catch (e) {
        // Safe fallback if network hiccups
      }

      try {
        const renList = await fetchRenewals({ urgency: 'DUE_30_DAYS' });
        setExpiringRenewalsCount(renList.length);
      } catch (e) {
        // Safe fallback
      }

      try {
        const relList = await fetchReleases({ status: 'Pending Approval' });
        setPendingReleaseCount(relList.length);
      } catch (e) {
        // Safe fallback
      }
    }
    updateCounts();
  }, [verificationRefreshTrigger, fdrRefreshTrigger, renewalRefreshTrigger, releaseRefreshTrigger]);

  // Dashboard KPI definitions
  const dynamicKpiCards = [
    {
      id: 'total-fdrs',
      title: 'Total FDRs',
      value: '1,248',
      subtext: '+34 from last quarter',
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
      value: '1,086',
      subtext: '87% compliant in system',
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
      value: String(expiringRenewalsCount || 42),
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
      value: String(pendingVerCount),
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
      value: '18',
      subtext: 'Flagged by bank / institution',
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
      value: String(pendingReleaseCount),
      subtext: 'Matured / Closure requested',
      trend: 'purple',
      icon: 'FileBadge',
      onClick: () => {
        setActiveNav('release-requests');
      },
    },
  ];

  // Navigation handler
  const handleNavClick = (id, label) => {
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
    showToast(`FDR ${created.fdrNumber} created successfully in PostgreSQL!`);
    setSelectedFdrId(created.id);
  };

  // Verification action completed handler (from review modal)
  const handleVerificationActionComplete = (actionType, updatedRecord) => {
    setVerificationRefreshTrigger((prev) => prev + 1);
    setFdrRefreshTrigger((prev) => prev + 1);

    if (actionType === 'approve') {
      showToast(`Verification APPROVED! FDR ${updatedRecord.fdrNumber} is now Active.`);
    } else if (actionType === 'discrepancy') {
      showToast(`Discrepancy notice issued for ${updatedRecord.fdrNumber}.`);
    } else if (actionType === 'reject') {
      showToast(`Verification REJECTED for ${updatedRecord.fdrNumber}.`);
    }
  };

  // Release status update (Mock module)
  const handleUpdateReleaseStatus = (reqId, newStatus) => {
    setReleaseRequests((prev) =>
      prev.map((req) => (req.id === reqId ? { ...req, status: newStatus } : req))
    );
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
        verificationCount={pendingVerCount}
        renewalsCount={42}
        releaseCount={pendingReleaseCount}
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
          fdrList={INITIAL_FDR_LIST}
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

          {/* VIEW: DASHBOARD */}
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

              {/* 4. FDR STATUS OVERVIEW */}
              <section aria-label="Status Distribution Overview">
                <StatusOverview
                  onSelectFilter={(status) => {
                    setFdrListFilter(status);
                    setActiveNav('fdr-management');
                  }}
                />
              </section>

              {/* 5. UPCOMING MATURITIES TABLE */}
              <section aria-label="Upcoming Maturities Schedule">
                <UpcomingMaturitiesTable onAction={handleAction} />
              </section>

              {/* 6 & 7. TWO-COLUMN SPLIT: PENDING VERIFICATION + RECENT ACTIVITY */}
              <section
                aria-label="Pending Verification and Audit Logs"
                className="grid grid-cols-1 gap-6 lg:grid-cols-12"
              >
                <div className="lg:col-span-7">
                  <PendingVerificationSection
                    verifications={INITIAL_VERIFICATIONS}
                    onAction={handleAction}
                  />
                </div>
                <div className="lg:col-span-5">
                  <RecentActivity onAction={handleAction} />
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
              }}
              onViewFdrByNumber={(fdrNum) => setSelectedFdrId(fdrNum)}
            />
          )}

          {/* VIEW: COMING SOON PAGES */}
          {activeNav === 'reports' && (
            <ComingSoonPage
              title="Reports &amp; Analytics Module"
              description="Comprehensive institutional compliance reports, bank-wise lien exposures, and annual audit reconciliations."
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {activeNav === 'audit-logs' && (
            <ComingSoonPage
              title="Immutable Bureau Audit Logs"
              description="Chronological event log tracking lien endorsements, officer approvals, and bank verification certificates."
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

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
      {/* 1. FDR Details Dossier Modal (Connected to GET /api/fdr/:id) */}
      {selectedFdrId && (
        <FdrDetailsModal
          fdrId={selectedFdrId}
          onClose={() => setSelectedFdrId(null)}
          onActionFeedback={showToast}
        />
      )}

      {/* 2. Verification Review Modal (Connected to real verification API) */}
      {selectedVerificationId && (
        <VerificationReviewModal
          verificationId={selectedVerificationId}
          onClose={() => setSelectedVerificationId(null)}
          onActionComplete={handleVerificationActionComplete}
        />
      )}

      {/* 3. Add New FDR Modal (Connected to POST /api/fdr) */}
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
