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
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import FdrDetailsModal from './components/FdrDetailsModal';
import VerificationReviewModal from './components/VerificationReviewModal';
import NewFdrModal from './components/NewFdrModal';

import { INITIAL_NOTIFICATIONS } from './data/mockData';
import { fetchDashboardStats } from './services/dashboardApi';
import { fetchCurrentUser } from './services/authApi';
import { getStoredToken, setStoredToken, removeStoredToken } from './services/apiClient';
import { CheckCircle2, X, ShieldAlert } from 'lucide-react';

function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [authLoading, setAuthLoading] = useState(true);

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

  // Initial user session verification
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      const stored = getStoredToken();
      if (!stored) {
        if (isMounted) setAuthLoading(false);
        return;
      }

      try {
        const user = await fetchCurrentUser();
        if (isMounted) {
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Session expired or invalid:', err);
        removeStoredToken();
        if (isMounted) {
          setCurrentUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    initAuth();

    // Listen for unauthorized events across all API requests
    const handleUnauthorized = () => {
      removeStoredToken();
      setCurrentUser(null);
      setToken(null);
      showToast('Session expired. Please sign in again.');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Sync real dashboard statistics from GET /api/dashboard/stats
  useEffect(() => {
    if (!currentUser) return;
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
    currentUser,
    verificationRefreshTrigger,
    fdrRefreshTrigger,
    renewalRefreshTrigger,
    releaseRefreshTrigger,
    globalRefreshTrigger,
  ]);

  // Handle successful login
  const handleLoginSuccess = (user, authToken) => {
    setStoredToken(authToken);
    setToken(authToken);
    setCurrentUser(user);
    setActiveNav('dashboard');
    showToast(`Welcome back, ${user.name}!`);
  };

  // Handle logout
  const handleLogout = () => {
    removeStoredToken();
    setToken(null);
    setCurrentUser(null);
    setActiveNav('dashboard');
    showToast('Signed out successfully.');
  };

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
      title: 'Active Deposits',
      value: dashboardStats ? String(dashboardStats.activeFdrs) : '...',
      subtext: 'Lien active with Council',
      trend: 'up',
      icon: 'CheckCircle2',
      onClick: () => {
        setFdrListFilter('ACTIVE');
        setActiveNav('fdr-management');
      },
    },
    {
      id: 'pending-verif',
      title: 'Pending Verification',
      value: dashboardStats ? String(dashboardStats.pendingVerifications) : '...',
      subtext: 'Awaiting bureau officer review',
      trend: 'alert',
      icon: 'Clock',
      onClick: () => {
        if (currentUser?.role === 'INSTITUTION_USER') {
          setFdrListFilter('UNDER_VERIFICATION');
          setActiveNav('fdr-management');
        } else {
          setActiveNav('verification');
        }
      },
    },
    {
      id: 'maturing-soon',
      title: 'Expiring in 30 Days',
      value: dashboardStats ? String(dashboardStats.expiringIn30Days) : '...',
      subtext: 'Renewal action required',
      trend: 'down',
      icon: 'AlertTriangle',
      onClick: () => {
        setActiveNav('renewals');
      },
    },
    {
      id: 'release-req',
      title: 'Release Requests',
      value: dashboardStats ? String(dashboardStats.pendingReleaseRequests) : '...',
      subtext: 'NOC approval in progress',
      trend: 'neutral',
      icon: 'ArrowUpRight',
      onClick: () => {
        setActiveNav('release-requests');
      },
    },
  ];

  // Dynamic status counts derived directly from PostgreSQL
  const dynamicStatusCounts = dashboardStats?.statusCounts || {
    ACTIVE: 0,
    UNDER_VERIFICATION: 0,
    SUBMITTED: 0,
    APPROVED: 0,
    EXPIRING_SOON: 0,
    DISCREPANCY: 0,
    RELEASE_REQUESTED: 0,
    RELEASED: 0,
    EXPIRED: 0,
  };

  const handleNavClick = (navId) => {
    if (navId === 'logout') {
      handleLogout();
      return;
    }
    setActiveNav(navId);
    setSidebarOpen(false);
  };

  const handleStatusFilterClick = (statusKey) => {
    setFdrListFilter(statusKey);
    setActiveNav('fdr-management');
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
      if (currentUser?.role === 'INSTITUTION_USER') {
        setFdrListFilter('UNDER_VERIFICATION');
        setActiveNav('fdr-management');
      } else {
        setActiveNav('verification');
      }
    } else if (type === 'view_audit_trail') {
      if (currentUser?.role === 'INSTITUTION_USER') {
        showToast('Audit trail is restricted to Council Regulatory Officers.');
      } else {
        setActiveNav('audit-logs');
      }
    } else {
      showToast(payload || type);
    }
  };

  // If loading session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
          AICTE FDR Portal &bull; Initializing Security Session...
        </p>
      </div>
    );
  }

  // If not authenticated, render LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

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

      {/* 1. Left Sidebar (Role-Aware) */}
      <Sidebar
        activeItem={activeNav}
        onItemClick={handleNavClick}
        isOpen={sidebarOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
        verificationCount={dashboardStats?.pendingVerifications || 0}
        renewalsCount={dashboardStats?.expiringIn30Days || 0}
        releaseCount={dashboardStats?.pendingReleaseRequests || 0}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        {/* 2. Top Header (With logged in user badge) */}
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
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* 3. Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* VIEW: DASHBOARD */}
          {activeNav === 'dashboard' && (
            <>
              {/* Institution User Scoping Banner */}
              {currentUser.role === 'INSTITUTION_USER' && currentUser.institution && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-xs">
                  <div>
                    <span className="font-bold">Institutional Account Active: </span>
                    <span>{currentUser.institution.name} ({currentUser.institution.code})</span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      All statistics, records, and renewal queues are scoped exclusively to your institutional ledger.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-200/60 text-emerald-900 font-bold rounded-md uppercase tracking-wider text-[10px]">
                    Isolated Scope
                  </span>
                </div>
              )}

              {/* KPI Cards Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

              {/* Status Overview Banner */}
              <StatusOverview
                statusCounts={dynamicStatusCounts}
                onSelectFilter={handleStatusFilterClick}
              />

              {/* Action Modules Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Pending Verification Section */}
                <div className="lg:col-span-7">
                  <PendingVerificationSection
                    onReviewRecord={(rec) => {
                      if (currentUser.role === 'INSTITUTION_USER') {
                        setSelectedFdrId(rec.fdrRecordId || rec.fdrNumber);
                      } else {
                        setSelectedVerificationId(rec.id);
                      }
                    }}
                    onViewAll={() => {
                      if (currentUser.role === 'INSTITUTION_USER') {
                        setFdrListFilter('UNDER_VERIFICATION');
                        setActiveNav('fdr-management');
                      } else {
                        setActiveNav('verification');
                      }
                    }}
                    refreshTrigger={verificationRefreshTrigger}
                  />
                </div>

                {/* Upcoming Maturities */}
                <div className="lg:col-span-5">
                  <UpcomingMaturitiesTable
                    onAction={handleAction}
                    onRenewFdr={(fdr) => {
                      showToast(`Navigating to Renewal dossier for ${fdr.fdrNumber}`);
                      setActiveNav('renewals');
                    }}
                    refreshTrigger={renewalRefreshTrigger}
                  />
                </div>
              </div>

              {/* Recent Activity Audit Stream (Only for AICTE Officer, Approver, Admin) */}
              {currentUser.role !== 'INSTITUTION_USER' && (
                <div className="w-full">
                  <RecentActivity
                    onAction={handleAction}
                    refreshTrigger={globalRefreshTrigger}
                  />
                </div>
              )}
            </>
          )}

          {/* VIEW: FDR MANAGEMENT */}
          {activeNav === 'fdr-management' && (
            <FdrManagementPage
              onViewFdr={(fdr) => setSelectedFdrId(fdr.id || fdr.fdrNumber)}
              onAddNewFdr={() => setIsAddFdrOpen(true)}
              initialFilter={fdrListFilter}
              refreshTrigger={fdrRefreshTrigger}
            />
          )}

          {/* VIEW: VERIFICATION (Only AICTE_OFFICER and ADMIN) */}
          {activeNav === 'verification' && (
            currentUser.role === 'INSTITUTION_USER' || currentUser.role === 'APPROVING_OFFICER' ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800">Verification Access Restricted</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Only designated AICTE Bureau Verification Officers have access to review and approve FDR records.
                </p>
              </div>
            ) : (
              <VerificationPage
                onReviewItem={(item) => setSelectedVerificationId(item.id)}
                refreshTrigger={verificationRefreshTrigger}
                onActionFeedback={(msg) => {
                  showToast(msg);
                  setFdrRefreshTrigger((prev) => prev + 1);
                  setVerificationRefreshTrigger((prev) => prev + 1);
                  setGlobalRefreshTrigger((prev) => prev + 1);
                }}
              />
            )
          )}

          {/* VIEW: RENEWALS & MATURITY TRACKING */}
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

          {/* VIEW: RELEASE REQUESTS */}
          {activeNav === 'release-requests' && (
            <ReleaseRequestsPage
              currentUser={currentUser}
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
            currentUser.role === 'INSTITUTION_USER' ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800">Reports Restricted</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Council-wide reports are restricted to AICTE Bureau Officers.
                </p>
              </div>
            ) : (
              <ReportsPage onActionFeedback={showToast} />
            )
          )}

          {/* VIEW: REAL AUDIT LOGS PAGE */}
          {activeNav === 'audit-logs' && (
            currentUser.role === 'INSTITUTION_USER' ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800">Audit Logs Restricted</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Regulatory audit logs are accessible only by Council Officers and System Administrators.
                </p>
              </div>
            ) : (
              <AuditLogsPage onActionFeedback={showToast} />
            )
          )}

          {/* VIEW: SETTINGS & USER MANAGEMENT */}
          {activeNav === 'settings' && (
            <SettingsPage
              currentUser={currentUser}
              onShowToast={showToast}
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
