import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Building2,
  Calendar,
  FileText,
  FileSpreadsheet,
  UserCheck,
  BarChart3,
  ShieldAlert,
  Compass,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role;

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SPORTS_COORDINATOR', 'BRANCH_COORDINATOR', 'STUDENT_COORDINATOR'] },
    { name: 'User Management', path: '/users', icon: Users, roles: ['ADMIN', 'SPORTS_COORDINATOR'] },
    { name: 'Student Coordinators', path: '/student-coordinators', icon: Users, roles: ['BRANCH_COORDINATOR'] },
    { name: 'Sports', path: '/sports', icon: Trophy, roles: ['ADMIN', 'STUDENT_COORDINATOR'] },
    { name: 'Branches', path: '/branches', icon: Building2, roles: ['ADMIN', 'SPORTS_COORDINATOR'] },
    { name: 'Trials & Posters', path: '/trials', icon: Calendar, roles: ['ADMIN', 'SPORTS_COORDINATOR', 'BRANCH_COORDINATOR'] },
    { name: 'Forms', path: '/forms', icon: FileText, roles: ['ADMIN', 'SPORTS_COORDINATOR', 'BRANCH_COORDINATOR', 'STUDENT_COORDINATOR'] },
    { name: 'Submissions', path: '/submissions', icon: FileSpreadsheet, roles: ['ADMIN', 'SPORTS_COORDINATOR', 'BRANCH_COORDINATOR', 'STUDENT_COORDINATOR'] },
    { name: 'Selected Students', path: '/selections', icon: UserCheck, roles: ['ADMIN', 'SPORTS_COORDINATOR', 'BRANCH_COORDINATOR', 'STUDENT_COORDINATOR'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'SPORTS_COORDINATOR', 'BRANCH_COORDINATOR'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, roles: ['ADMIN', 'SPORTS_COORDINATOR'] },
    { name: 'Public Trial Portal', path: '/public-trials', icon: Compass, roles: ['ADMIN', 'SPORTS_COORDINATOR', 'BRANCH_COORDINATOR', 'STUDENT_COORDINATOR'] },
  ];

  const filteredNavItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Sports Portal</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Management PWA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose?.()}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}
              `}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Role Card at bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400 border border-slate-700">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || user?.username}</p>
              <span className="inline-block text-[10px] font-medium text-indigo-400 uppercase tracking-wider">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
