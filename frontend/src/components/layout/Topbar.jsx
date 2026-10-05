import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, KeyRound, ExternalLink } from 'lucide-react';
import Modal from '../common/Modal';
import { authApi } from '../../api/auth';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isError: false });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters long.', isError: true });
      return;
    }

    setLoading(true);
    setMsg({ text: '', isError: false });
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setMsg({ text: 'Password updated successfully!', isError: false });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMsg({ text: '', isError: false });
      }, 1500);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update password.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Institutional Portal</span>
            <h2 className="text-sm font-bold text-slate-800">Sports Management System</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Public Portal Link */}
          <a
            href="/public-trials"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200"
          >
            <span>Public Trials View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Change Password button */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition border border-slate-200"
            title="Change Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Password</span>
          </button>

          {/* User badge */}
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 leading-tight">{user?.username}</span>
            <span className="text-[10px] text-slate-500 font-medium">{user?.role?.replace('_', ' ')}</span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Your Password"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {msg.text && (
            <div className={`p-3 rounded-lg text-xs font-medium ${msg.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {msg.text}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (min 6 characters)</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
