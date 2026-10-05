import React from 'react';

export default function StatusBadge({ status }) {
  const norm = String(status || '').toUpperCase();

  const configs = {
    PUBLISHED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Published' },
    DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: 'Draft' },
    CLOSED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Closed' },
    ARCHIVED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Archived' },
    CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Cancelled' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending' },
    SELECTED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Selected' },
    NOT_SELECTED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', label: 'Not Selected' },
    ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Active' },
    INACTIVE: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', label: 'Inactive' },
  };

  const current = configs[norm] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border}`}>
      {current.label}
    </span>
  );
}
