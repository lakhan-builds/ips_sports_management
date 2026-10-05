import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">{value ?? 0}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.indigo}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1 font-medium">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
