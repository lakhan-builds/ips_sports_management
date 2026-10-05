import React, { useState, useEffect } from 'react';
import { usersApi } from '../../api/users';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { ShieldAlert, Search, Clock, UserCheck } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await usersApi.auditLogs();
      setLogs(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log =>
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.description?.toLowerCase().includes(search.toLowerCase()) ||
    log.user_username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security & Activity Audit Log</h1>
          <p className="text-xs text-slate-500 mt-1">Immutable ledger of administrative changes, password resets, and selections</p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search action, description, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border-none bg-slate-50 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading audit logs..." />
      ) : filteredLogs.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Target</th>
                  <th className="px-6 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                      {log.created_at?.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-bold text-slate-900 font-sans">{log.user_username || 'System'}</span>
                      {log.user_role && (
                        <span className="block text-[10px] text-indigo-600 font-sans">{log.user_role}</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {log.object_type} #{log.object_id}
                    </td>
                    <td className="px-6 py-3 text-slate-700 font-sans">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState title="No audit entries" description="Security and operational actions will be tracked automatically." />
      )}
    </div>
  );
}
