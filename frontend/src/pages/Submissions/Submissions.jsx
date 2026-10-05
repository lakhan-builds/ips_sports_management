import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submissionsApi } from '../../api/submissions';
import { selectionsApi } from '../../api/selections';
import { sportsApi } from '../../api/sports';
import { branchesApi } from '../../api/branches';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  FileSpreadsheet,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  Building2,
  FileCheck
} from 'lucide-react';

export default function Submissions() {
  const [searchParams] = useSearchParams();
  const initialSport = searchParams.get('sport') || '';
  const initialForm = searchParams.get('form') || '';

  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [sports, setSports] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState(initialSport);
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [selectedSub, setSelectedSub] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSelectConfirmOpen, setIsSelectConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [selectionNotes, setSelectionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const params = {
        search,
        sport: sportFilter,
        branch: branchFilter,
        status: statusFilter,
      };
      if (initialForm) params.form = initialForm;

      const [subData, sData, bData] = await Promise.all([
        submissionsApi.list(params),
        sportsApi.list({ is_active: 'true' }),
        branchesApi.list({ is_active: 'true' })
      ]);
      setSubmissions(Array.isArray(subData) ? subData : (subData.results || []));
      setSports(Array.isArray(sData) ? sData : (sData.results || []));
      setBranches(Array.isArray(bData) ? bData : (bData.results || []));
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [search, sportFilter, branchFilter, statusFilter]);

  const openDetails = (sub) => {
    setSelectedSub(sub);
    setIsDetailOpen(true);
  };

  const triggerSelect = (sub) => {
    setSelectedSub(sub);
    setSelectionNotes('');
    setIsSelectConfirmOpen(true);
  };

  const triggerReject = (sub) => {
    setSelectedSub(sub);
    setIsRejectConfirmOpen(true);
  };

  const handleConfirmSelect = async () => {
    if (!selectedSub) return;
    setProcessing(true);
    try {
      await selectionsApi.select(selectedSub.id, selectionNotes);
      setIsSelectConfirmOpen(false);
      setIsDetailOpen(false);
      loadSubmissions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to select student.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedSub) return;
    setProcessing(true);
    try {
      await selectionsApi.unselect(selectedSub.id, 'Marked as Not Selected during trials');
      setIsRejectConfirmOpen(false);
      setIsDetailOpen(false);
      loadSubmissions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update selection status.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Trial Submissions</h1>
          <p className="text-xs text-slate-500 mt-1">Review student profiles, responses, and execute selections</p>
        </div>
        <a
          href={submissionsApi.exportCsvUrl({
            sport: sportFilter,
            branch: branchFilter,
            status: statusFilter,
            search
          })}
          download
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Submissions CSV</span>
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name, enrollment, email..."
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Evaluation</option>
          <option value="SELECTED">Selected</option>
          <option value="NOT_SELECTED">Not Selected</option>
        </select>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <LoadingSpinner text="Loading submissions..." />
      ) : submissions.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Sport & Form</th>
                  <th className="px-6 py-3.5">Branch</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{sub.student_name}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        Enrollment: {sub.enrollment_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-xs">{sub.sport_name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{sub.form_title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {sub.branch_code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {sub.submitted_at?.split('T')[0]}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetails(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Full Data</span>
                        </button>

                        {sub.status !== 'SELECTED' ? (
                          <button
                            onClick={() => triggerSelect(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>SELECT</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerReject(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>NOT SELECTED</span>
                          </button>
                        )}
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
          title="No registrations found"
          description="Submissions received through dynamic registration forms will appear here."
        />
      )}

      {/* Student Details & Evaluation Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Student Full Profile & Registration Data"
        maxWidth="max-w-2xl"
      >
        {selectedSub && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
            {/* Header snapshot summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedSub.student_name}</h3>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 font-medium">
                  <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Enrollment: {selectedSub.enrollment_number}
                  </span>
                  <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Branch: {selectedSub.branch_code}
                  </span>
                  {selectedSub.semester && (
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                      Semester: {selectedSub.semester}
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge status={selectedSub.status} />
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-medium truncate">{selectedSub.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium">{selectedSub.phone}</span>
              </div>
            </div>

            {/* Dynamic Form Responses */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Submitted Form Responses</span>
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {selectedSub.answers?.length > 0 ? (
                  selectedSub.answers.map((ans) => (
                    <div key={ans.id} className="p-3.5 hover:bg-slate-50/50">
                      <div className="text-[11px] font-bold uppercase text-slate-400">{ans.field_label}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-800 whitespace-pre-wrap">
                        {ans.value || '—'}
                      </div>
                      {ans.file_upload && (
                        <a
                          href={ans.file_upload}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium"
                        >
                          View Attachment ↗
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs text-slate-400 text-center">No extra custom fields for this form.</div>
                )}
              </div>
            </div>

            {/* Actions inside modal */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerReject(selectedSub)}
                  className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg"
                >
                  Mark Not Selected
                </button>
                <button
                  type="button"
                  onClick={() => triggerSelect(selectedSub)}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  SELECT STUDENT
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Select Student Confirmation & Notes Modal */}
      <Modal
        isOpen={isSelectConfirmOpen}
        onClose={() => setIsSelectConfirmOpen(false)}
        title={`Confirm Selection: ${selectedSub?.student_name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
            Selecting this candidate will preserve a <strong>permanent snapshot</strong> of their original submission, timestamp, and answers according to institutional selection compliance.
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Trial Notes / Assessment (Optional)
            </label>
            <textarea
              rows={3}
              value={selectionNotes}
              onChange={(e) => setSelectionNotes(e.target.value)}
              placeholder="e.g. Demonstrated exceptional ball distribution and defensive positioning."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSelectConfirmOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={handleConfirmSelect}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {processing ? 'Saving...' : 'Confirm Selection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation */}
      <Modal
        isOpen={isRejectConfirmOpen}
        onClose={() => setIsRejectConfirmOpen(false)}
        title={`Mark Not Selected: ${selectedSub?.student_name}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            This student will be marked as Not Selected for this trial. Any active selection record will be updated.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRejectConfirmOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={handleConfirmReject}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
            >
              {processing ? 'Updating...' : 'Confirm Not Selected'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
