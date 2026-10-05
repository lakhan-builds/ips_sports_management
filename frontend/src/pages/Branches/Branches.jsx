import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchesApi } from '../../api/branches';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Building2, Plus, Edit2, Trash2, Users } from 'lucide-react';

export default function Branches() {
  const { isAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', description: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const data = await branchesApi.list();
      setBranches(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error("Failed to load branches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const openCreate = () => {
    setEditingBranch(null);
    setFormData({ code: '', name: '', description: '', is_active: true });
    setIsModalOpen(true);
  };

  const openEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      code: branch.code,
      name: branch.name,
      description: branch.description,
      is_active: branch.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBranch) {
        await branchesApi.update(editingBranch.id, formData);
      } else {
        await branchesApi.create(formData);
      }
      setIsModalOpen(false);
      loadBranches();
    } catch (err) {
      console.error("Failed to save branch:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    try {
      await branchesApi.delete(id);
      loadBranches();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Branches</h1>
          <p className="text-xs text-slate-500 mt-1">Academic departments and branch coordinator assignments</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Branch</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading branches..." />
      ) : branches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-extrabold font-mono text-sm">
                      {b.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{b.name}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">Code: {b.code}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(b)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {b.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  {b.coordinators_count ?? 0} Coordinators
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No branches defined" description="Add academic branches to allow coordinator assignments." />
      )}

      {/* Add / Edit Branch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? 'Edit Branch' : 'Add New Branch'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Branch Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CSE, ECE, ME"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Branch Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Computer Science & Engineering"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Department information..."
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
              {submitting ? 'Saving...' : 'Save Branch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
