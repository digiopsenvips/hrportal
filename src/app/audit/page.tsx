'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { AuditLogEntry } from '@/types';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Clock,
  Layers,
  FileText,
  Eye,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function AuditLogPage() {
  const { currentUser, permissions } = useAuth();
  const { departments, members } = useData();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterRecordType, setFilterRecordType] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Diff inspection modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    async function fetchAuditLogs() {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (currentUser.id) queryParams.set('viewerId', currentUser.id);

        const res = await fetch(`/api/audit?${queryParams.toString()}`);
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('Forbidden: Only System Developers, Society Executives, and Department Heads can inspect audit logs.');
          }
          throw new Error(`Failed to load audit logs: ${res.statusText}`);
        }
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching audit logs');
      } finally {
        setLoading(false);
      }
    }

    fetchAuditLogs();
  }, [currentUser]);

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterAction !== 'ALL' && log.action.toLowerCase() !== filterAction.toLowerCase()) {
        return false;
      }
      if (filterRecordType !== 'ALL' && log.recordType.toLowerCase() !== filterRecordType.toLowerCase()) {
        return false;
      }
      if (filterDept !== 'ALL' && log.departmentId !== filterDept) {
        return false;
      }
      if (startDate && new Date(log.timestamp) < new Date(startDate)) {
        return false;
      }
      if (endDate && new Date(log.timestamp) > new Date(endDate + 'T23:59:59')) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchUser = log.userName.toLowerCase().includes(term);
        const matchAction = log.action.toLowerCase().includes(term);
        const matchDetails = (log.details || '').toLowerCase().includes(term);
        const matchReason = (log.reason || '').toLowerCase().includes(term);
        const matchRecordId = (log.recordId || '').toLowerCase().includes(term);
        if (!matchUser && !matchAction && !matchDetails && !matchReason && !matchRecordId) {
          return false;
        }
      }
      return true;
    });
  }, [logs, filterAction, filterRecordType, filterDept, startDate, endDate, searchTerm]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No audit logs available to export.');
      return;
    }

    const headers = ['Timestamp', 'Correlation ID', 'User Name', 'Role', 'Department', 'Action', 'Record Type', 'Record ID', 'Reason', 'Details', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.correlationId || ''}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${departments.find((d) => d.id === l.departmentId)?.name || l.departmentId || 'Society-wide'}"`,
      `"${l.action}"`,
      `"${l.recordType}"`,
      `"${l.recordId || ''}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `enactus_audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Permission Gate: Show unauthorized block if not developer / dept_head / president
  const canAccess = permissions.canAccessAuditLogs;

  if (!currentUser || !canAccess || error) {
    return (
      <div className="rounded-3xl border border-[#E3EBE7] bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-[#263832]">Audit Log Access Restricted</h2>
        <p className="mx-auto mt-2 max-w-md text-xs text-[#82918B]">
          {error || 'According to organization security policy, audit logs are accessible only to verified System Developers, Core Executives, and Department Heads for their respective hubs.'}
        </p>
        <p className="mt-4 text-xs font-semibold text-[#637d74]">
          Logged in as: <span className="font-bold text-[#263832]">{currentUser?.name} ({currentUser?.roleTitle})</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Immutable Society Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">System Audit & Activity Trail</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Tamper-resistant append-only event logs tracking MoMs, meeting schedules, attendance markers, and administrative approvals.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-xl border border-[#E3EBE7] bg-white px-4 py-2.5 text-xs font-bold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition shadow-sm"
        >
          <Download className="h-4 w-4 text-[#2FC3A5]" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#82918B]" />
            <input
              type="text"
              placeholder="Search user, reason, record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] pl-9 pr-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
            />
          </div>

          {/* Action Type */}
          <div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
            >
              <option value="ALL">All Event Actions</option>
              <option value="MOM_CREATE">MoM Created</option>
              <option value="MOM_PUBLISH">MoM Published</option>
              <option value="MOM_EDIT_REQUEST">MoM Edit Requested</option>
              <option value="MOM_EDIT_APPROVED">MoM Edit Approved (Unlocked)</option>
              <option value="MOM_EDIT_REJECTED">MoM Edit Rejected</option>
              <option value="MOM_EDIT_AFTER_PUBLISH">MoM Edited Post-Publish</option>
              <option value="ATTENDANCE_BULK_MARK">Attendance Recorded</option>
              <option value="MEMBER_STATUS_CHANGE">Member Status Change</option>
            </select>
          </div>

          {/* Record Type */}
          <div>
            <select
              value={filterRecordType}
              onChange={(e) => setFilterRecordType(e.target.value)}
              className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
            >
              <option value="ALL">All Record Types</option>
              <option value="MOM">MoM</option>
              <option value="ATTENDANCE">Attendance</option>
              <option value="MEETING">Meeting</option>
              <option value="TASK">Task</option>
              <option value="MEMBER">Member Lifecycle</option>
              <option value="EXPORT">Data Export</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              disabled={!permissions.canAccessAllAuditLogs}
              className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5] disabled:opacity-60"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filters & Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E3EBE7]/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#82918B] font-medium">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-[#E3EBE7] bg-[#F7F9F7] px-2.5 py-1 text-xs text-[#263832]"
            />
            <span className="text-[#82918B]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-[#E3EBE7] bg-[#F7F9F7] px-2.5 py-1 text-xs text-[#263832]"
            />
          </div>

          <div className="font-semibold text-[#0D5143]">
            Showing {filteredLogs.length} verified audit event(s)
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E3EBE7] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E3EBE7] bg-[#F7F9F7] text-[#263832] font-bold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Record</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EBE7]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#82918B]">
                    Loading secure audit records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#82918B]">
                    No audit records match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dept = departments.find((d) => d.id === log.departmentId);
                  const isApproval = log.action.includes('APPROVE');
                  const isReject = log.action.includes('REJECT');
                  const isEdit = log.action.includes('EDIT');

                  return (
                    <tr key={log.id} className="hover:bg-[#F7F9F7]/70 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#82918B] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString()}{' '}
                        <span className="text-[#263832]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#263832]">{log.userName}</div>
                        <div className="text-[10px] text-[#82918B]">{log.userRole}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproval
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isReject
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isEdit
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-[#E7F3D7] text-[#0D5143] border border-[#2FC3A5]/30'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#637d74]">
                        <span className="font-semibold text-[#263832]">{log.recordType}</span>
                        {log.recordId && <span className="text-[10px] block opacity-80">{log.recordId}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-[#263832]">
                          {dept ? dept.name : log.departmentId || 'Society-Wide'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[#637d74]">
                        {log.reason || log.details || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E3EBE7] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition"
                        >
                          <Eye className="h-3 w-3 text-[#2FC3A5]" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#2FC3A5]" />
                <h3 className="font-bold text-base text-[#263832]">Audit Event Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-full p-1 text-[#82918B] hover:bg-[#F7F9F7] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                <div className="text-[10px] font-bold text-[#82918B] uppercase">Event Action</div>
                <div className="font-black text-[#263832] mt-0.5">{selectedLog.action}</div>
              </div>
              <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                <div className="text-[10px] font-bold text-[#82918B] uppercase">Timestamp</div>
                <div className="font-mono text-[#263832] mt-0.5">{new Date(selectedLog.timestamp).toISOString()}</div>
              </div>
              <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                <div className="text-[10px] font-bold text-[#82918B] uppercase">Operator</div>
                <div className="font-bold text-[#263832] mt-0.5">{selectedLog.userName} ({selectedLog.userRole})</div>
                <div className="text-[10px] text-[#82918B] font-mono mt-0.5">ID: {selectedLog.userId}</div>
              </div>
              <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                <div className="text-[10px] font-bold text-[#82918B] uppercase">Target Record</div>
                <div className="font-bold text-[#263832] mt-0.5">{selectedLog.recordType}</div>
                <div className="text-[10px] text-[#82918B] font-mono mt-0.5">ID: {selectedLog.recordId || 'N/A'}</div>
              </div>
            </div>

            {selectedLog.reason && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs">
                <div className="font-bold text-amber-900 mb-0.5">Mandatory Justification / Reason:</div>
                <p className="text-amber-800">{selectedLog.reason}</p>
              </div>
            )}

            {selectedLog.details && (
              <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-xs">
                <div className="font-bold text-[#263832] mb-0.5">Event Details & Description:</div>
                <p className="text-[#637d74]">{selectedLog.details}</p>
              </div>
            )}

            {selectedLog.changedFields && Object.keys(selectedLog.changedFields).length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#263832]">Field Difference (Before vs After):</div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-[#E3EBE7] bg-white p-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#E3EBE7] text-left text-[10px] text-[#82918B]">
                        <th className="py-1 px-2">Field</th>
                        <th className="py-1 px-2">Before</th>
                        <th className="py-1 px-2">After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedLog.changedFields).map(([fKey, fDiff]) => (
                        <tr key={fKey} className="border-b border-[#E3EBE7]/50 font-mono text-[11px]">
                          <td className="py-1 px-2 font-bold text-[#263832]">{fKey}</td>
                          <td className="py-1 px-2 text-rose-600 bg-rose-50/50">{JSON.stringify(fDiff.before)}</td>
                          <td className="py-1 px-2 text-emerald-600 bg-emerald-50/50">{JSON.stringify(fDiff.after)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#E3EBE7] text-[11px] text-[#82918B]">
              <div>Correlation ID: <span className="font-mono text-[#263832]">{selectedLog.correlationId || 'N/A'}</span></div>
              <div>IP: <span className="font-mono text-[#263832]">{selectedLog.ipAddress || '127.0.0.1'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
