import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../../api/dashboard';
import { submissionsApi } from '../../api/submissions';
import { selectionsApi } from '../../api/selections';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { BarChart3, Download, Trophy, Building2, TrendingUp, Users } from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getStats();
        setData(res.data);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Generating analytics & reports..." />;
  }

  const sportsSummary = data?.sports_summary || [];
  const maxSubmissions = Math.max(...sportsSummary.map(s => s.submissions_count), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Sports Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Registrations, selections, and turnout breakdown by sport and branch</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={submissionsApi.exportCsvUrl()}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>All Registrations CSV</span>
          </a>
          <a
            href={selectionsApi.exportCsvUrl()}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>All Selections CSV</span>
          </a>
        </div>
      </div>

      {/* Main Bar Chart Breakdown by Sport */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-indigo-600" />
              <span>Registrations vs. Official Selections by Sport</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Comparative participation rates across tournament categories</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded bg-indigo-500 inline-block"></span>
              Registrations
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
              Selections
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {sportsSummary.map((item) => {
            const subWidth = Math.round((item.submissions_count / maxSubmissions) * 100);
            const selWidth = Math.round((item.selections_count / maxSubmissions) * 100);
            return (
              <div key={item.sport_id} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{item.sport_name}</span>
                  <span className="text-slate-500 font-mono">
                    <span className="text-indigo-600 font-bold">{item.submissions_count}</span> registered •{' '}
                    <span className="text-emerald-600 font-bold">{item.selections_count}</span> selected
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5">
                  <div
                    style={{ width: `${Math.max(subWidth, 2)}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                  />
                  <div
                    style={{ width: `${Math.max(selWidth, 2)}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
