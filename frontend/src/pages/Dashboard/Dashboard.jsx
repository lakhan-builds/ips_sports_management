import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Trophy,
  Building2,
  Users,
  Calendar,
  FileText,
  FileSpreadsheet,
  UserCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getStats();
        setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard statistics..." />;
  }

  const role = user?.role;
  const stats = data?.stats || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>{user?.role_display || role?.replace('_', ' ')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <p className="mt-2 text-sm text-indigo-100/80 leading-relaxed">
            {role === 'ADMIN' && 'System overview of sports trials, branch coordination, dynamic forms, and student selections.'}
            {role === 'SPORTS_COORDINATOR' && 'Manage university sports calendars, branch coordinators, trials, and selection rosters.'}
            {role === 'BRANCH_COORDINATOR' && 'Coordinate trials, dynamic registration forms, and student coordinators for your branch.'}
            {role === 'STUDENT_COORDINATOR' && 'Review submissions, evaluate student performance, and make official trial selections.'}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-8 translate-y-8 pointer-events-none">
          <Trophy className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Role Scoped Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'ADMIN' && (
          <>
            <StatCard title="Total Sports" value={stats.total_sports} icon={Trophy} color="indigo" />
            <StatCard title="Total Branches" value={stats.total_branches} icon={Building2} color="blue" />
            <StatCard title="Active Coordinators" value={stats.total_coordinators} icon={Users} color="emerald" />
            <StatCard title="Total Trials" value={stats.total_trials} icon={Calendar} color="amber" />
            <StatCard title="Active Forms" value={stats.active_forms} icon={FileText} color="purple" />
            <StatCard title="Form Registrations" value={stats.total_submissions} icon={FileSpreadsheet} color="blue" />
            <StatCard title="Selected Students" value={stats.total_selected_students} icon={UserCheck} color="emerald" />
          </>
        )}

        {role === 'SPORTS_COORDINATOR' && (
          <>
            <StatCard title="Active Branches" value={stats.total_branches} icon={Building2} color="blue" />
            <StatCard title="Published Trials" value={stats.active_trials} icon={Calendar} color="indigo" />
            <StatCard title="Active Forms" value={stats.active_forms} icon={FileText} color="purple" />
            <StatCard title="Total Registrations" value={stats.total_submissions} icon={FileSpreadsheet} color="amber" />
            <StatCard title="Selected Students" value={stats.total_selected_students} icon={UserCheck} color="emerald" />
            <StatCard title="Branch Coordinators" value={stats.branch_coordinators} icon={Users} color="blue" />
          </>
        )}

        {role === 'BRANCH_COORDINATOR' && (
          <>
            <StatCard title="Assigned Branches" value={stats.assigned_branches_count} icon={Building2} color="blue" />
            <StatCard title="Active Trials" value={stats.active_trials} icon={Calendar} color="indigo" />
            <StatCard title="Active Forms" value={stats.active_forms} icon={FileText} color="purple" />
            <StatCard title="Total Submissions" value={stats.total_submissions} icon={FileSpreadsheet} color="amber" />
            <StatCard title="Selected Students" value={stats.total_selected_students} icon={UserCheck} color="emerald" />
            <StatCard title="Student Coordinators" value={stats.student_coordinators} icon={Users} color="blue" />
          </>
        )}

        {role === 'STUDENT_COORDINATOR' && (
          <>
            <StatCard title="Available Sports" value={stats.available_sports} icon={Trophy} color="indigo" />
            <StatCard title="Active Forms" value={stats.active_forms} icon={FileText} color="purple" />
            <StatCard title="Branch Registrations" value={stats.total_submissions} icon={FileSpreadsheet} color="amber" />
            <StatCard title="Selected Students" value={stats.total_selected_students} icon={UserCheck} color="emerald" />
          </>
        )}
      </div>

      {/* STUDENT COORDINATOR SPECIFIC: Available Sports Selector */}
      {role === 'STUDENT_COORDINATOR' && data?.sports_summary && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sports Trial Categories</h2>
              <p className="text-xs text-slate-500">Select a sport to inspect forms, registrations, and make student selections</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.sports_summary.map((item) => (
              <div
                key={item.sport_id}
                onClick={() => navigate(`/submissions?sport=${encodeURIComponent(item.sport_name)}`)}
                className="group cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-indigo-600 group-hover:scale-105 transition">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition">
                        {item.sport_name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {item.submissions_count} registrations • {item.selections_count} selected
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Upcoming Trials & Recent Selections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent / Upcoming Trials */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-800">Active Trials</h2>
              </div>
              <Link to="/trials" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {data?.recent_trials?.length > 0 ? (
                data.recent_trials.map((trial) => (
                  <div key={trial.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{trial.title}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="font-medium text-indigo-600">{trial.sport_details?.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {trial.venue}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {trial.trial_date}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={trial.status} />
                  </div>
                ))
              ) : (
                <EmptyState title="No active trials" description="Schedule trials to invite student participants." />
              )}
            </div>
          </div>
        </div>

        {/* Recent Selections */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-800">Recent Student Selections</h2>
              </div>
              <Link to="/selections" className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {data?.recent_selections?.length > 0 ? (
                data.recent_selections.map((sel) => (
                  <div key={sel.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{sel.student_name}</h4>
                      <p className="text-xs text-slate-500">
                        Enrollment: <span className="font-mono text-slate-700">{sel.enrollment_number}</span> • Branch: {sel.branch_code}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        Selected for {sel.sport_name} by {sel.selected_by_name || 'Coordinator'}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      SELECTED
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState title="No selections yet" description="Evaluate trial registrations to mark selected candidates." />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
