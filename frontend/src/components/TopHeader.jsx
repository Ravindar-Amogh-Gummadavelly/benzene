import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  Shield,
  Calendar,
  User,
  LogOut,
  Settings,
  HelpCircle,
  CheckCheck,
  X,
  Building,
} from 'lucide-react';

export default function TopHeader({
  onToggleSidebar,
  onNavigate,
  onViewFdr,
  notifications,
  fdrList = [],
  onActionFeedback,
  unreadCount = 0,
  currentUser,
  onLogout,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    if (!val.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const query = val.toLowerCase().trim();
    const matches = (fdrList || [])
      .filter(
        (f) =>
          f.fdrNumber?.toLowerCase().includes(query) ||
          f.institution?.toLowerCase().includes(query) ||
          f.bank?.toLowerCase().includes(query)
      )
      .slice(0, 5);
    setSearchResults(matches);
    setShowSearchResults(true);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const role = currentUser?.role || 'INSTITUTION_USER';

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      {/* Left Title Area */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              AICTE Security Deposit &amp; FDR Portal
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              <Shield className="h-3 w-3 text-blue-700" /> Bureau System
            </span>
          </div>
          <p className="hidden text-xs text-slate-500 sm:block">
            {currentUser?.institution
              ? `Scoped to: ${currentUser.institution.name}`
              : 'All-India Regulatory Oversight & Lien Verification'}
          </p>
        </div>
      </div>

      {/* Right Tools Area */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Bar with live popup */}
        <div ref={searchRef} className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchTerm.trim() && setShowSearchResults(true)}
            placeholder="Search FDR number, institute, bank..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 lg:w-80"
          />

          {showSearchResults && (
            <div className="absolute left-0 mt-2 w-96 rounded-xl border border-slate-200 bg-white shadow-xl p-2 z-50 text-xs">
              <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                <span>Matching FDR Records ({searchResults.length})</span>
                <button
                  type="button"
                  onClick={() => setShowSearchResults(false)}
                  className="hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {searchResults.length > 0 ? (
                <div className="mt-1 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setShowSearchResults(false);
                        onViewFdr(item);
                      }}
                      className="w-full text-left p-2 hover:bg-slate-50 rounded transition-colors flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold text-slate-900 truncate">
                          {item.fdrNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {item.institution}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.bank} • {item.amount}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-700 shrink-0">
                        View Dossier →
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-center text-slate-400">
                  No matching FDR records found for &quot;{searchTerm}&quot;.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Date Stamp */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>{todayFormatted}</span>
        </div>

        {/* Notification Icon & Panel */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-2xl z-50 text-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <span className="font-bold text-slate-900">System Notifications</span>
                <button
                  type="button"
                  onClick={() => onActionFeedback('Marked all notifications as read')}
                  className="text-[11px] font-semibold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate(notif.targetNav, notif.filter);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onNavigate(notif.targetNav, notif.filter)}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors block text-left"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-xs">{notif.title}</p>
                      <span className="text-[10px] text-slate-400">{notif.time}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1 leading-snug">{notif.message}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 bg-slate-50 p-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('dashboard');
                  }}
                  className="text-[11px] font-semibold text-blue-700 hover:underline"
                >
                  View dashboard overview →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Interactive Menu */}
        <div ref={profileRef} className="relative flex items-center pl-2 border-l border-slate-200">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white shadow-xs">
              {getInitials(currentUser?.name)}
            </div>
            <div className="hidden text-left xl:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser?.name || 'Authenticated User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  role === 'ADMIN'
                    ? 'bg-amber-100 text-amber-800'
                    : role === 'AICTE_OFFICER'
                    ? 'bg-blue-100 text-blue-800'
                    : role === 'APPROVING_OFFICER'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {role}
                </span>
              </div>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-12 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-2xl z-50 text-xs overflow-hidden">
              <div className="bg-slate-900 text-white p-3.5">
                <p className="font-bold text-sm truncate">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-300 truncate">{currentUser?.email}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="rounded bg-blue-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    {role}
                  </span>
                  {currentUser?.institution && (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 truncate max-w-[130px]">
                      {currentUser.institution.code}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-left"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>Account &amp; Security</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-left"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>Portal Preferences</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onActionFeedback('Help Desk: AICTE FDR Help & Lien Protocol Manual v3.2');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors text-left"
                >
                  <HelpCircle className="h-4 w-4 text-slate-500" />
                  <span>Regulatory Help &amp; SOP</span>
                </button>
              </div>

              <div className="border-t border-slate-100 p-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-700 hover:bg-rose-50 transition-colors text-left font-semibold cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
