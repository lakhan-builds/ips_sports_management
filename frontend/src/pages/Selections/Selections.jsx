import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { selectionsApi } from '../../api/selections';
import { sportsApi } from '../../api/sports';
import { branchesApi } from '../../api/branches';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  UserCheck,
  Search,
  Download,
  Eye,
  RotateCcw,
  Calendar,
  Building2,
  Trophy,
  History,
  FileCheck
} from 'lucide-react';

export default function Selections() {
  const { user } = useAuth();
  const [selections, setSelections] = useState([]);
  const [sports, setSports] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Snapshot modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);

  const loadSelections = async () => {
    setLoading(true);
    try {
      const [selData, sData, bData] = await Promise.all([
        selectionsApi.list({ search, sport: sportFilter, branch: branchFilter }),
        sportsApi.list({ is_active: 'true' }),
        branchesApi.list({ is_active: 'true' })
      ]);
      setSelections(Array.isArray(selData) ? selData : (selData.results || []));
      setSports(Array.isArray(sData) ? sData : (sData.results || []));
      setBranches(Array.isArray(bData) ? bData : (bData.results || []));
    } catch (err) {
      console.error("Failed to load selections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSelections();
  }, [search, sportFilter, branchFilter]);

  const openSnapshot = (item) => {
    setSelectedItem(item);
    setIsSnapshotOpen(true);
  };

  const handleUnselect = async (item) => {
    if (!window.confirm(`Remove ${item.student_name} from official selections?`)) return;
    try {
      await selectionsApi.unselect(item.submission, 'Revoked from selections list');
      loadSelections();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unselect student.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Selected Students Roster</h1>
          <p className="text-xs text-slate-500 mt-1">Official varsity team rosters with preserved historical submission snapshots</p>
        </div>
        <a
          href={selectionsApi.exportCsvUrl({
            sport: sportFilter,
            branch: branchFilter,
            search
          })}
          download
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Selections CSV</span>
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name or enrollment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border-none bg-slate-50 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 outline-none"
        >
          <option value="">All Sports</option>
          {sports.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 outline-none"
        >
          <option value="">All Branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
          ))}
        </select>
      </div>

      {/* Selections Table */}
      {loading ? (
        <LoadingSpinner text="Loading selections..." />
      ) : selections.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Selected Student</th>
                  <th className="px-6 py-3.5">Sport</th>
                  <th className="px-6 py-3.5">Branch</th>
                  <th className="px-6 py-3.5">Selected By</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selections.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{item.student_name}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            Enrollment: {item.enrollment_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-indigo-500" />
                        {item.sport_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.branch_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {item.selected_by_name || 'Coordinator'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {item.selected_at?.replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openSnapshot(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                          title="Inspect preserved submission snapshot"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Snapshot</span>
                        </button>
                        <button
                          onClick={() => handleUnselect(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove selection"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
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
          title="No students selected yet"
          description="Candidates evaluated and selected in trials will be listed here with immutable audit snapshots."
        />
      )}

      {/* Snapshot Modal */}
      <Modal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
        title="Official Selection Snapshot (Permanent Record)"
        maxWidth="max-w-2xl"
      >
        {selectedItem && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Officially Selected Candidate
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedItem.student_name}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      {selectedItem.enrollment_number}
                    </span>
                    <span className="font-semibold bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {selectedItem.sport_name} • {selectedItem.branch_code}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-emerald-800">
                  <div className="font-semibold">Selected By: {selectedItem.selected_by_name || 'Coordinator'}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{selectedItem.selected_at?.replace('T', ' ').slice(0, 19)}</div>
                </div>
              </div>

              {selectedItem.notes && (
                <div className="mt-3 pt-3 border-t border-emerald-200 text-xs text-emerald-900">
                  <span className="font-bold">Evaluation Notes: </span>
                  <span>{selectedItem.notes}</span>
                </div>
              )}
            </div>

            {/* Preserved Original Submission Snapshot */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Preserved Original Submission Snapshot
                </h4>
              </div>

              {selectedItem.snapshot_data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400">Form: </span>
                      <span className="font-semibold text-slate-800">{selectedItem.snapshot_data.form_title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Email: </span>
                      <span className="font-semibold text-slate-800">{selectedItem.snapshot_data.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone: </span>
                      <span className="font-semibold text-slate-800">{selectedItem.snapshot_data.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Original Submission Time: </span>
                      <span className="font-semibold text-slate-800">{selectedItem.snapshot_data.submitted_at?.replace('T', ' ').slice(0, 19)}</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {selectedItem.snapshot_data.answers?.map((ans, idx) => (
                      <div key={idx} className="p-3">
                        <div className="text-[11px] font-bold text-slate-400 uppercase">{ans.field_label}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">{ans.value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-xs text-slate-400 bg-slate-50 rounded-xl">No snapshot payload stored.</div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSnapshotOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
