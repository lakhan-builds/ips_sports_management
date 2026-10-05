import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formsApi } from '../../api/forms';
import { sportsApi } from '../../api/sports';
import { branchesApi } from '../../api/branches';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  FileText,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Edit,
  ExternalLink,
  Search,
  ListPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea (Multi-line)' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown Menu' },
  { value: 'radio', label: 'Single Choice (Radio)' },
  { value: 'checkbox', label: 'Multiple Choice / Declaration (Checkbox)' },
  { value: 'file', label: 'File / Image Attachment' },
];

export default function Forms() {
  const { user, isStudentCoordinator } = useAuth();
  const navigate = useNavigate();
  const [formsList, setFormsList] = useState([]);
  const [sports, setSports] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form builder fields state
  const [formMeta, setFormMeta] = useState({
    title: '',
    sport: '',
    branch: '',
    description: '',
    status: 'DRAFT',
    deadline: '',
  });

  const [fields, setFields] = useState([]);

  const loadForms = async () => {
    setLoading(true);
    try {
      const [fData, sData, bData] = await Promise.all([
        formsApi.list({ search, status: statusFilter }),
        sportsApi.list({ is_active: 'true' }),
        branchesApi.list({ is_active: 'true' })
      ]);
      setFormsList(Array.isArray(fData) ? fData : (fData.results || []));
      setSports(Array.isArray(sData) ? sData : (sData.results || []));
      setBranches(Array.isArray(bData) ? bData : (bData.results || []));
    } catch (err) {
      console.error("Failed to load forms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, [search, statusFilter]);

  const openNewFormBuilder = () => {
    setEditingForm(null);
    setFormMeta({
      title: '',
      sport: sports[0]?.id || '',
      branch: branches[0]?.id || '',
      description: '',
      status: 'PUBLISHED',
      deadline: '',
    });
    setFields([
      { label: 'Playing Position', field_name: 'position', field_type: 'dropdown', placeholder: 'Select position', is_required: true, options: 'Goalkeeper, Defender, Midfielder, Forward', order: 0 },
      { label: 'Past Experience', field_name: 'experience', field_type: 'textarea', placeholder: 'Tournament achievements...', is_required: false, options: '', order: 1 },
    ]);
    setIsBuilderOpen(true);
  };

  const openEditFormBuilder = (f) => {
    setEditingForm(f);
    setFormMeta({
      title: f.title,
      sport: f.sport,
      branch: f.branch || '',
      description: f.description,
      status: f.status,
      deadline: f.deadline ? f.deadline.split('T')[0] : '',
    });
    setFields(
      f.fields.map((fld, idx) => ({
        id: fld.id,
        label: fld.label,
        field_name: fld.field_name,
        field_type: fld.field_type,
        placeholder: fld.placeholder || '',
        is_required: fld.is_required,
        options: Array.isArray(fld.options) ? fld.options.join(', ') : '',
        order: fld.order ?? idx,
      }))
    );
    setIsBuilderOpen(true);
  };

  const addField = () => {
    const nextOrder = fields.length;
    setFields([
      ...fields,
      {
        label: 'New Question',
        field_name: `field_${Date.now()}`,
        field_type: 'text',
        placeholder: '',
        is_required: false,
        options: '',
        order: nextOrder,
      }
    ]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= fields.length) return;
    const reordered = [...fields];
    const temp = reordered[index];
    reordered[index] = reordered[newIdx];
    reordered[newIdx] = temp;
    setFields(reordered.map((item, idx) => ({ ...item, order: idx })));
  };

  const updateField = (index, key, val) => {
    const updated = [...fields];
    updated[index][key] = val;
    // Auto-generate field_name if user edits label
    if (key === 'label') {
      updated[index].field_name = val.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40);
    }
    setFields(updated);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formattedFields = fields.map((f, idx) => ({
      id: f.id,
      label: f.label,
      field_name: f.field_name || `field_${idx}`,
      field_type: f.field_type,
      placeholder: f.placeholder,
      is_required: Boolean(f.is_required),
      options: ['dropdown', 'radio', 'checkbox'].includes(f.field_type)
        ? (typeof f.options === 'string' ? f.options.split(',').map(s => s.trim()).filter(Boolean) : f.options)
        : [],
      order: idx,
    }));

    const payload = {
      ...formMeta,
      fields: formattedFields,
    };
    if (!payload.deadline) delete payload.deadline;
    if (!payload.branch) delete payload.branch;

    try {
      if (editingForm) {
        await formsApi.update(editingForm.id, payload);
      } else {
        await formsApi.create(payload);
      }
      setIsBuilderOpen(false);
      loadForms();
    } catch (err) {
      console.error("Failed to save dynamic form:", err);
      alert(err.response?.data?.message || "Failed to save form.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await formsApi.publish(id);
      loadForms();
    } catch (err) {
      console.error("Publish failed:", err);
    }
  };

  const handleClose = async (id) => {
    try {
      await formsApi.close(id);
      loadForms();
    } catch (err) {
      console.error("Close failed:", err);
    }
  };

  const handleReopen = async (id) => {
    try {
      await formsApi.reopen(id);
      loadForms();
    } catch (err) {
      console.error("Reopen failed:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Archive / Delete this form? Existing student submissions and selections will remain safely preserved.")) return;
    try {
      await formsApi.delete(id);
      loadForms();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dynamic Registration Forms</h1>
          <p className="text-xs text-slate-500 mt-1">Design customizable trial audition forms with flexible questions</p>
        </div>
        {!isStudentCoordinator && (
          <button
            onClick={openNewFormBuilder}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Dynamic Form</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search forms by title, sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border-none bg-slate-50 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CLOSED">Closed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Forms Table */}
      {loading ? (
        <LoadingSpinner text="Loading forms..." />
      ) : formsList.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Form Name</th>
                  <th className="px-6 py-3.5">Sport</th>
                  <th className="px-6 py-3.5">Branch</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Fields</th>
                  <th className="px-6 py-3.5">Submissions</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formsList.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{f.title}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">{f.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {f.sport_details?.name}
                    </td>
                    <td className="px-6 py-4">
                      {f.branch_details ? (
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {f.branch_details.code}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">All Branches</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {f.fields?.length ?? 0} custom fields
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/submissions?form=${f.id}`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition"
                      >
                        <span>{f.submissions_count ?? 0} Submissions</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isStudentCoordinator && (
                          <>
                            {f.status === 'PUBLISHED' ? (
                              <button
                                onClick={() => handleClose(f.id)}
                                title="Close Form Submissions"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            ) : f.status === 'CLOSED' ? (
                              <button
                                onClick={() => handleReopen(f.id)}
                                title="Reopen Form Submissions"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePublish(f.id)}
                                title="Publish Form"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => openEditFormBuilder(f)}
                              title="Edit Form"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(f.id)}
                              title="Archive Form"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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
          title="No forms found"
          description="Create your first dynamic form to start collecting trial registrations."
          actionLabel="Create Dynamic Form"
          onAction={openNewFormBuilder}
        />
      )}

      {/* Dynamic Form Builder Modal */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title={editingForm ? 'Edit Dynamic Form' : 'Dynamic Form Builder'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
          {/* Metadata Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Form Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Form Title *</label>
                <input
                  type="text"
                  required
                  value={formMeta.title}
                  onChange={(e) => setFormMeta({ ...formMeta, title: e.target.value })}
                  placeholder="e.g. Football Varsity Trial Registration"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Sport *</label>
                <select
                  required
                  value={formMeta.sport}
                  onChange={(e) => setFormMeta({ ...formMeta, sport: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                  value={formMeta.branch}
                  onChange={(e) => setFormMeta({ ...formMeta, branch: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Status *</label>
                <select
                  value={formMeta.status}
                  onChange={(e) => setFormMeta({ ...formMeta, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="PUBLISHED">Published (Accepting submissions)</option>
                  <option value="DRAFT">Draft (Coordinators only)</option>
                  <option value="CLOSED">Closed (Submissions disabled)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Description / Guidelines</label>
              <textarea
                rows={2}
                value={formMeta.description}
                onChange={(e) => setFormMeta({ ...formMeta, description: e.target.value })}
                placeholder="Guidelines, criteria, dates, reporting details..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Form Fields Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Dynamic Questions & Fields</h4>
                <p className="text-xs text-slate-500">Student full name, enrollment, branch, email, and phone are always included by default.</p>
              </div>
              <button
                type="button"
                onClick={addField}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition border border-indigo-200"
              >
                <ListPlus className="w-4 h-4" />
                <span>Add Question Field</span>
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((fld, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row gap-3 items-start">
                  {/* Order buttons */}
                  <div className="flex sm:flex-col gap-1 items-center justify-center shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveField(idx, -1)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <button
                      type="button"
                      disabled={idx === fields.length - 1}
                      onClick={() => moveField(idx, 1)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Main field inputs */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Question Label *</label>
                      <input
                        type="text"
                        required
                        value={fld.label}
                        onChange={(e) => updateField(idx, 'label', e.target.value)}
                        placeholder="e.g. Preferred Playing Position"
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Input Type</label>
                      <select
                        value={fld.field_type}
                        onChange={(e) => updateField(idx, 'field_type', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {FIELD_TYPES.map(ft => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Placeholder */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Placeholder</label>
                      <input
                        type="text"
                        value={fld.placeholder}
                        onChange={(e) => updateField(idx, 'placeholder', e.target.value)}
                        placeholder="Help text in input"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Options if dropdown / radio / checkbox */}
                    {['dropdown', 'radio', 'checkbox'].includes(fld.field_type) && (
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                          Choices (comma-separated) *
                        </label>
                        <input
                          type="text"
                          required
                          value={fld.options}
                          onChange={(e) => updateField(idx, 'options', e.target.value)}
                          placeholder="e.g. Right Foot, Left Foot, Both"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {/* Required Checkbox */}
                    <div className="flex items-center gap-2 pt-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fld.is_required}
                          onChange={(e) => updateField(idx, 'is_required', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Required Question</span>
                      </label>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeField(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                    title="Remove Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Saving Form...' : 'Save & Build Form'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
