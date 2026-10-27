import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Building2,
  Mail,
  UserCheck,
  PlusCircle,
  KeyRound,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Search,
} from 'lucide-react';
import { fetchUsers, createUser, updateUser, seedDemoAccounts } from '../services/authApi';

export default function SettingsPage({ currentUser, onShowToast }) {
  const isAdmin = currentUser?.role === 'ADMIN';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // New user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'INSTITUTION_USER',
    password: '',
    institutionId: '1',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Edit user modal
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  const loadUsersList = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      if (onShowToast) onShowToast(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersList();
  }, [isAdmin]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreateSubmitting(true);
      setCreateError(null);

      const payload = {
        name: newUserData.name.trim(),
        email: newUserData.email.trim(),
        role: newUserData.role,
        password: newUserData.password,
        institutionId:
          newUserData.role === 'INSTITUTION_USER' && newUserData.institutionId
            ? parseInt(newUserData.institutionId, 10)
            : null,
      };

      await createUser(payload);
      if (onShowToast) onShowToast(`User "${payload.email}" created successfully.`);
      setShowCreateModal(false);
      setNewUserData({
        name: '',
        email: '',
        role: 'INSTITUTION_USER',
        password: '',
        institutionId: '1',
      });
      loadUsersList();
    } catch (err) {
      setCreateError(err.message || 'Failed to create user.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setEditSubmitting(true);
      setEditError(null);

      const payload = {
        role: editRole,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      await updateUser(editingUser.id, payload);
      if (onShowToast) onShowToast(`User "${editingUser.email}" updated successfully.`);
      setEditingUser(null);
      setEditPassword('');
      loadUsersList();
    } catch (err) {
      setEditError(err.message || 'Failed to update user.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('Reset/ensure all 4 standard demo accounts with password "password123"?')) {
      return;
    }
    try {
      setLoading(true);
      await seedDemoAccounts();
      if (onShowToast) onShowToast('Standard demo accounts synced successfully.');
      loadUsersList();
    } catch (err) {
      if (onShowToast) onShowToast(`Sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Portal Settings &amp; Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Role-Based Access Control (RBAC), user directory, and security profile
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReseed}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Demo Accounts</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create User</span>
            </button>
          </div>
        )}
      </div>

      {/* User Profile Card (Visible to all roles) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-blue-600" />
          <span>Current Session Profile</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <span className="text-slate-500 block text-[11px] font-semibold uppercase">Full Name</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">
              {currentUser?.name || 'Authorized User'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <span className="text-slate-500 block text-[11px] font-semibold uppercase">Email</span>
            <span className="font-mono text-slate-800 text-xs mt-0.5 block truncate">
              {currentUser?.email}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <span className="text-slate-500 block text-[11px] font-semibold uppercase">Assigned Role</span>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                currentUser?.role === 'ADMIN'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : currentUser?.role === 'AICTE_OFFICER'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : currentUser?.role === 'APPROVING_OFFICER'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {currentUser?.role}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <span className="text-slate-500 block text-[11px] font-semibold uppercase">Institution Scope</span>
            <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">
              {currentUser?.institution ? currentUser.institution.name : 'All Institutions (National)'}
            </span>
          </div>
        </div>
      </div>

      {/* ADMIN ONLY: User Management Table */}
      {isAdmin ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Authorized Portal Users ({filteredUsers.length})</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Manage user credentials, system roles, and institutional data-isolation scopes
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or email..."
                  className="h-8 pl-8 pr-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 px-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Roles</option>
                <option value="INSTITUTION_USER">INSTITUTION_USER</option>
                <option value="AICTE_OFFICER">AICTE_OFFICER</option>
                <option value="APPROVING_OFFICER">APPROVING_OFFICER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading user accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No portal users found matching filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Institution Scope</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.name || 'Unnamed User'}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'AICTE_OFFICER'
                            ? 'bg-blue-100 text-blue-800'
                            : u.role === 'APPROVING_OFFICER'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.institution ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]" title={u.institution.name}>
                              {u.institution.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Global / Not Scoped</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setEditRole(u.role);
                            setEditPassword('');
                            setEditError(null);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                        >
                          Edit / Reset Pass
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-xs">
          <ShieldCheck className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-700 text-sm">Role-Restricted Administration</h3>
          <p className="mt-1 max-w-md mx-auto leading-relaxed">
            User administration, role assignment, and global credentials management require Administrator privileges. Contact an AICTE System Administrator for elevated access requests.
          </p>
        </div>
      )}

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 overflow-hidden">
            <h2 className="text-base font-bold text-slate-900 mb-1">Create Authorized User</h2>
            <p className="text-xs text-slate-500 mb-4">
              Add a new authenticated user with specific role permissions.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Prof. Rajesh Kumar"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="user@institute.edu.in"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="INSTITUTION_USER">INSTITUTION_USER (Scoped to Institute)</option>
                  <option value="AICTE_OFFICER">AICTE_OFFICER (Verification Reviewer)</option>
                  <option value="APPROVING_OFFICER">APPROVING_OFFICER (Release Approver)</option>
                  <option value="ADMIN">ADMIN (Full System Access)</option>
                </select>
              </div>

              {newUserData.role === 'INSTITUTION_USER' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institution ID Scope
                  </label>
                  <input
                    type="number"
                    value={newUserData.institutionId}
                    onChange={(e) => setNewUserData({ ...newUserData, institutionId: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    ID 1 maps to Indian Institute of Technology, Bombay.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User / Reset Password */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 overflow-hidden">
            <h2 className="text-base font-bold text-slate-900 mb-1">Edit User Profile</h2>
            <p className="text-xs text-slate-500 mb-4">
              Updating account for <span className="font-bold text-slate-800">{editingUser.email}</span>
            </p>

            {editError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="INSTITUTION_USER">INSTITUTION_USER</option>
                  <option value="AICTE_OFFICER">AICTE_OFFICER</option>
                  <option value="APPROVING_OFFICER">APPROVING_OFFICER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reset Password (Leave blank to keep existing)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="New password or leave blank"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {editSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
