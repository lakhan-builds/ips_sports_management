import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No records found', description = 'There are no items to display at this time.', actionLabel, onAction, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
      <div className="p-3 bg-slate-100 rounded-full text-slate-500 mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
