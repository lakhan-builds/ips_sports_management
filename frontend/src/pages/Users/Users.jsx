import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/users';
import { branchesApi } from '../../api/branches';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Users as UsersIcon, Plus, Search, KeyRound, Trash2, Edit3, Shield, Building2 } from 'lucide-react';

export default function Users() {
  const { user, isAdmin, isSportsCoordinator, isBranchCoordinator } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    branch_ids: [],
    notes: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [formMsg, setFormMsg] = useState({ text: '', isError: false });
  const [submitting, setSubmitting] = useState(false);

  // Role options allowed based on creator role
  const getAllowedRoles = () => {
    if (isAdmin) {
      return [
        { value: 'SPORTS_COORDINATOR', label: 'Sports Coordinator' },
        { value: 'BRANCH_COORDINATOR', label: 'Branch Coordinator' },
        { value: 'STUDENT_COORDINATOR', label: 'Student Coordinator' },
      ];
    }
    if (isSportsCoordinator) {
      return [
        { value: 'BRANCH_COORDINATOR', label: 'Branch Coordinator' },
        { value: 'STUDENT_COORDINATOR', label: 'Student Coordinator' },
      ];
    }
    if (isBranchCoordinator) {
      return [
        { value: 'STUDENT_COORDINATOR', label: 'Student Coordinator' },
      ];
    }
    return [];
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, bData] = await Promise.all([
        usersApi.list({ search, role: roleFilter }),
        branchesApi.list({ is_active: 'true' })
      ]);
      setUsersList(Array.isArray(uData) ? uData : (uData.results || []));
      setBranches(Array.isArray(bData) ? bData : (bData.results || []));
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, roleFilter]);

  const openCreateModal = () => {
    const defaultRole = getAllowedRoles()[0]?.value || 'STUDENT_COORDINATOR';
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: defaultRole,
      password: '',
      branch_ids: [],
      notes: '',
    });
    setFormMsg({ text: '', isError: false });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg({ text: '', isError: false });
    try {
      await usersApi.create(formData);
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      setFormMsg({ text: err.response?.data?.message || 'Failed to create coordinator.', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setFormMsg({ text: 'Password must be at least 6 characters.', isError: true });
      return;
    }
    setSubmitting(true);
    setFormMsg({ text: '', isError: false });
    try {
      await usersApi.resetPassword(selectedUser.id, newPassword);
      setIsResetOpen(false);
      setNewPassword('');
    } catch (err) {
      setFormMsg({ text: err.response?.data?.message || 'Failed to reset password.', isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await usersApi.delete(selectedUser.id);
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBranch = (bId) => {
    setFormData(prev => {
      const exists = prev.branch_ids.includes(bId);
      return {
        ...prev,
        branch_ids: exists ? prev.branch_ids.filter(id => id !== bId) : [...prev.branch_ids, bId]
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Coordinators & Roles</h1>
          <p className="text-xs text-slate-500 mt-1">Hierarchical user management according to institutional authority</p>
        </div>
        {getAllowedRoles().length > 0 && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Coordinator</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, username, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border-none bg-slate-50 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none"
        >
          <option value="">All Roles</option>
          <option value="SPORTS_COORDINATOR">Sports Coordinator</option>
          <option value="BRANCH_COORDINATOR">Branch Coordinator</option>
          <option value="STUDENT_COORDINATOR">Student Coordinator</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Loading coordinators..." />
      ) : usersList.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Coordinator</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Assigned Branches</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.full_name}</div>
                          <div className="text-xs text-slate-400">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {u.role_display}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.assigned_branches?.length > 0 ? (
                          u.assigned_branches.map((b) => (
                            <span key={b.id} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-medium">
                              {b.code}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Institutional / All</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div>{u.email || '—'}</div>
                      <div className="text-slate-400">{u.phone || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedUser(u); setNewPassword(''); setIsResetOpen(true); }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedUser(u); setIsDeleteOpen(true); }}
                          title="Delete Coordinator"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No coordinators found"
          description="Create coordinators to delegate branch operations."
          actionLabel="Create Coordinator"
          onAction={openCreateModal}
        />
      )}

      {/* Create Coordinator Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Coordinator"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formMsg.text && (
            <div className={`p-3 rounded-lg text-xs font-semibold ${formMsg.isError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {formMsg.text}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Role *</label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {getAllowedRoles().map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Branch assignments */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Assign Branches</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
              {branches.map(b => (
                <label key={b.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.branch_ids.includes(b.id)}
                    onChange={() => toggleBranch(b.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{b.code} ({b.name})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Coordinator'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title={`Reset Password for ${selectedUser?.username}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-slate-500">
            As a higher-authority user, you can set a new direct password for this coordinator.
          </p>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">New Password (min 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsResetOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Resetting...' : 'Confirm Reset Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete Coordinator ${selectedUser?.username}?`}
        message="This user will be deactivated and removed from active coordinator rosters. Historical selection logs and records created by them will be securely preserved."
        confirmText="Yes, Deactivate"
        confirmStyle="danger"
        loading={submitting}
      />
    </div>
  );
}
