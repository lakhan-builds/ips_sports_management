import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { trialsApi } from '../../api/trials';
import { sportsApi } from '../../api/sports';
import { branchesApi } from '../../api/branches';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  Trophy,
  Building2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Search
} from 'lucide-react';

export default function Trials() {
  const { user, isStudentCoordinator } = useAuth();
  const [trials, setTrials] = useState([]);
  const [sports, setSports] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrial, setEditingTrial] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    sport: '',
    branch: '',
    trial_date: '',
    start_time: '09:00',
    end_time: '13:00',
    venue: '',
    description: '',
    status: 'PUBLISHED',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadTrials = async () => {
    setLoading(true);
    try {
      const [tData, sData, bData] = await Promise.all([
        trialsApi.list({ search, sport: sportFilter }),
        sportsApi.list({ is_active: 'true' }),
        branchesApi.list({ is_active: 'true' })
      ]);
      setTrials(Array.isArray(tData) ? tData : (tData.results || []));
      setSports(Array.isArray(sData) ? sData : (sData.results || []));
      setBranches(Array.isArray(bData) ? bData : (bData.results || []));
    } catch (err) {
      console.error("Failed to load trials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrials();
  }, [search, sportFilter]);

  const openCreate = () => {
    setEditingTrial(null);
    setPosterFile(null);
    setFormData({
      title: '',
      sport: sports[0]?.id || '',
      branch: branches[0]?.id || '',
      trial_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '13:00',
      venue: '',
      description: '',
      status: 'PUBLISHED',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEdit = (t) => {
    setEditingTrial(t);
    setPosterFile(null);
    setFormData({
      title: t.title,
      sport: t.sport,
      branch: t.branch || '',
      trial_date: t.trial_date,
      start_time: t.start_time,
      end_time: t.end_time,
      venue: t.venue,
      description: t.description,
      status: t.status,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== '' && v !== null) fd.append(k, v);
    });
    if (posterFile) {
      fd.append('poster', posterFile);
    }

    try {
      if (editingTrial) {
        await trialsApi.update(editingTrial.id, fd);
      } else {
        await trialsApi.create(fd);
      }
      setIsModalOpen(false);
      loadTrials();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save trial.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishToggle = async (t) => {
    try {
      if (t.status === 'PUBLISHED') {
        await trialsApi.unpublish(t.id);
      } else {
        await trialsApi.publish(t.id);
      }
      loadTrials();
    } catch (err) {
      console.error("Toggle publish failed:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this trial notice?")) return;
    try {
      await trialsApi.delete(id);
      loadTrials();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sports Trials & Dates</h1>
          <p className="text-xs text-slate-500 mt-1">Schedule and publish official trial schedules with poster artwork</p>
        </div>
        {!isStudentCoordinator && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Trial</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title, venue, or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border-none bg-slate-50 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none"
        >
          <option value="">All Sports</option>
          {sports.map(s => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Trials Grid */}
      {loading ? (
        <LoadingSpinner text="Loading trials..." />
      ) : trials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              {/* Poster Image / Header graphic */}
              <div className="h-44 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 relative flex items-center justify-center overflow-hidden">
                {t.poster ? (
                  <img src={t.poster} alt={t.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Trophy className="w-12 h-12 text-indigo-400/50 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t.sport_details?.name}</span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <StatusBadge status={t.status} />
                </div>
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.trial_date}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">
                    <span>{t.sport_details?.name}</span>
                    <span>•</span>
                    <span>{t.branch_details ? t.branch_details.code : 'All Branches'}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{t.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {t.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{t.start_time} - {t.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                {!isStudentCoordinator && (
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handlePublishToggle(t)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                        t.status === 'PUBLISHED'
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {t.status === 'PUBLISHED' ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Unpublish</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No trials scheduled"
          description="Create your first trial date to announce tryouts to students."
          actionLabel="Schedule Trial"
          onAction={openCreate}
        />
      )}

      {/* Trial Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTrial ? 'Edit Trial Details' : 'Schedule New Sports Trial'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Trial Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Annual Varsity Football Selection Camp 2026"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Sport *</label>
              <select
                required
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select sport</option>
                {sports.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Open to All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Trial Date *</label>
              <input
                type="date"
                required
                value={formData.trial_date}
                onChange={(e) => setFormData({ ...formData, trial_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Venue / Ground *</label>
            <input
              type="text"
              required
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="e.g. Main Stadium Ground, Indoor Hall Court 2"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Description / Instructions</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kit requirements, reporting instructions, eligibility..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Upload Trial Poster</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPosterFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Trial Notice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
