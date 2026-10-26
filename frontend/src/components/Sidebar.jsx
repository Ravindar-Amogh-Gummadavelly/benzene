import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  FileBarChart2,
  History,
  Settings,
  Shield,
  LogOut,
  Building2,
} from 'lucide-react';

export default function Sidebar({
  activeItem = 'dashboard',
  onItemClick,
  isOpen = true,
  verificationCount = 27,
  renewalsCount = 42,
  releaseCount = 11,
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fdr-management', label: 'FDR Management', icon: FileSpreadsheet },
    { id: 'verification', label: 'Verification', icon: CheckCircle2, badge: verificationCount > 0 ? String(verificationCount) : null },
    { id: 'renewals', label: 'Renewals', icon: RefreshCw, badge: renewalsCount > 0 ? String(renewalsCount) : null },
    { id: 'release-requests', label: 'Release Requests', icon: ArrowUpRight, badge: releaseCount > 0 ? String(releaseCount) : null },
    { id: 'reports', label: 'Reports', icon: FileBarChart2 },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 bg-slate-900 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-xs">
          <Shield className="h-5 w-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-bold tracking-tight text-white truncate">
            AICTE FDR Portal
          </span>
          <span className="text-[10px] font-medium text-slate-300 tracking-wider uppercase truncate">
            Regulation Bureau
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick && onItemClick(item.id, item.label)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${
                      isActive ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive
                        ? 'bg-blue-200/80 text-blue-900'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Institution Info Card */}
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Building2 className="h-4 w-4 text-blue-700" />
            <span>AICTE Headquarters</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
            Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
          </p>
        </div>
      </div>

      {/* User / Profile Area */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/80">
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-white transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white ring-2 ring-blue-100">
              AK
            </div>
            <div className="overflow-hidden text-left">
              <p className="truncate text-xs font-semibold text-slate-900">
                Dr. Amit K. Sharma
              </p>
              <p className="truncate text-[11px] text-slate-500">
                Director (Regulation)
              </p>
            </div>
          </div>
          <button
            type="button"
            title="Sign Out"
            onClick={() => onItemClick && onItemClick('logout', 'Sign Out')}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
