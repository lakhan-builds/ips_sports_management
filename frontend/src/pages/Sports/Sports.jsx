import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sportsApi } from '../../api/sports';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Trophy, Plus, Edit2, Trash2, Calendar, FileText } from 'lucide-react';

export default function Sports() {
  const { isAdmin } = useAuth();
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'trophy', is_active: true });
  const [submitting, setSubmitting] = useState(false);

  const loadSports = async () => {
    setLoading(true);
    try {
      const data = await sportsApi.list();
      setSports(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error("Failed to load sports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSports();
  }, []);

  const openCreate = () => {
    setEditingSport(null);
    setFormData({ name: '', description: '', icon: 'trophy', is_active: true });
    setIsModalOpen(true);
  };

  const openEdit = (sport) => {
    setEditingSport(sport);
    setFormData({
      name: sport.name,
      description: sport.description,
      icon: sport.icon || 'trophy',
      is_active: sport.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSport) {
        await sportsApi.update(editingSport.id, formData);
      } else {
        await sportsApi.create(formData);
      }
      setIsModalOpen(false);
      loadSports();
    } catch (err) {
      console.error("Failed to save sport:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sport?")) return;
    try {
      await sportsApi.delete(id);
      loadSports();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sports Roster</h1>
          <p className="text-xs text-slate-500 mt-1">Database-driven university sports categories and trial links</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sport</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading sports..." />
      ) : sports.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sports.map((sport) => (
            <div
              key={sport.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{sport.name}</h3>
                      <span className="text-[11px] font-mono text-slate-400">slug: {sport.slug}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(sport)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sport.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {sport.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {sport.trials_count ?? 0} Trials
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  {sport.forms_count ?? 0} Forms
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No sports registered" description="Add sports categories to organize trials and student registrations." />
      )}

      {/* Add / Edit Sport Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSport ? 'Edit Sport' : 'Add New Sport'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Sport Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Football, Cricket, Badminton"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tournament format, eligibility, venue information..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Sport'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
