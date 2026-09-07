import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  Eye,
  Shield,
  Clock,
  User,
  ArrowRight,
  Database,
  Code2,
} from 'lucide-react';
import { api } from '../../api/client.ts';
import { AuditLog } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';

export const AuditLogsView: React.FC = () => {
  const [logsList, setLogsList] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Inspector Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [entityTypeFilter, actionFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({
        entityType: entityTypeFilter,
        action: actionFilter,
      });
      setLogsList(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logsList.filter((log) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      log.entityType.toLowerCase().includes(s) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(s)) ||
      log.entityId.toLowerCase().includes(s)
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('UPDATE')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (action.includes('DELETE') || action.includes('TERMINATE'))
      return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div id="audit-logs-view" className="space-y-6">
      {/* Overview Banner */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">System Activity & Audit Trail</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of state mutations, leasing transactions, and security actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, action..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Entities</option>
            <option value="building">Buildings</option>
            <option value="unit">Units</option>
            <option value="tenant">Tenants</option>
            <option value="contract">Contracts</option>
            <option value="payment">Payments</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Creates</option>
            <option value="UPDATE">Updates</option>
            <option value="DELETE">Deletes</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center p-6 text-xs text-slate-400">No audit events match your filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4 text-right">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filtered.map((log) => (
                  <tr key={log.id} id={`audit-log-row-${log.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-900">{log.userEmail || 'System'}</div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{log.userRole || 'ADMIN'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border font-sans ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-700 font-sans font-medium text-[10px]">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]" title={log.entityId}>
                      {log.entityId.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECT LOG MODAL */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Record: ${selectedLog?.action} on ${selectedLog?.entityType}`}
        subtitle={`Recorded at ${selectedLog ? new Date(selectedLog.createdAt).toLocaleString() : ''} by ${
          selectedLog?.userEmail || 'System'
        }`}
        maxWidth="3xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <div className="text-[10px] text-slate-400">Actor Role</div>
                <div className="font-bold text-slate-800">{selectedLog.userRole || 'SUPER_ADMIN'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Client IP</div>
                <div className="font-bold text-slate-800 font-mono">{selectedLog.ipAddress || '127.0.0.1'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Entity Scope</div>
                <div className="font-bold text-slate-800 uppercase">{selectedLog.entityType}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Target UUID</div>
                <div className="font-bold text-slate-800 font-mono truncate" title={selectedLog.entityId}>
                  {selectedLog.entityId.substring(0, 10)}...
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Previous State (Old Values)
                </span>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto max-h-64">
                  {selectedLog.oldValues
                    ? JSON.stringify(selectedLog.oldValues, null, 2)
                    : '// No previous record (New entity created)'}
                </pre>
              </div>
              <div>
                <span className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Mutated State (New Values)
                </span>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto max-h-64">
                  {selectedLog.newValues
                    ? JSON.stringify(selectedLog.newValues, null, 2)
                    : '// Entity deleted or nullified'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
