'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { calculateMemberAttendance } from '@/lib/calculations';
import { AttendanceRecord, AttendanceStatus, Meeting } from '@/types';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Download,
  AlertTriangle,
  History,
  Search,
  Filter,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export default function AttendancePage() {
  const { currentUser, permissions } = useAuth();
  const {
    departments,
    members,
    meetings,
    attendance,
    correctionRequests,
    settings,
    recordAttendance,
    reviewAttendanceCorrection,
  } = useData();

  const [activeTab, setActiveTab] = useState<'sheet' | 'members' | 'corrections'>('sheet');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(
    meetings[0]?.id || ''
  );
  const [searchMember, setSearchMember] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [auditLogModalRecord, setAuditLogModalRecord] = useState<AttendanceRecord | null>(null);

  // Selected Meeting
  const currentMeeting = meetings.find((m) => m.id === selectedMeetingId) || meetings[0];

  // Eligible members for the selected meeting
  const eligibleMembers = useMemo(() => {
    if (!currentMeeting) return [];
    if (currentMeeting.departmentId === 'ALL') {
      return members.filter((m) => m.status === 'Active');
    }
    return members.filter(
      (m) =>
        m.primaryDepartmentId === currentMeeting.departmentId ||
        m.assignedDepartmentId === currentMeeting.departmentId ||
        currentMeeting.attendeeMemberIds.includes(m.id)
    );
  }, [currentMeeting, members]);

  // Attendance map for quick lookup: memberId -> AttendanceRecord
  const meetingAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    if (!currentMeeting) return map;
    for (const record of attendance) {
      if (record.meetingId === currentMeeting.id) {
        map.set(record.memberId, record);
      }
    }
    return map;
  }, [currentMeeting, attendance]);

  // Bulk mark all present
  const handleMarkAllPresent = async () => {
    if (!currentMeeting || !currentUser) return;
    const records = eligibleMembers.map((m) => ({
      memberId: m.id,
      status: 'Present' as AttendanceStatus,
      notes: 'Bulk marked Present',
    }));

    await recordAttendance({
      meetingId: currentMeeting.id,
      departmentId: currentMeeting.departmentId,
      markedById: currentUser.id,
      records,
    });
  };

  // Mark individual member status
  const handleSetMemberStatus = async (memberId: string, status: AttendanceStatus) => {
    if (!currentMeeting || !currentUser) return;
    await recordAttendance({
      meetingId: currentMeeting.id,
      departmentId: currentMeeting.departmentId,
      memberId,
      status,
      markedById: currentUser.id,
    });
  };

  // Export attendance sheet to CSV
  const handleExportAttendanceCSV = () => {
    if (!currentMeeting) return;
    const rows = [
      ['Meeting Title', currentMeeting.title],
      ['Date', currentMeeting.date],
      ['Mode', currentMeeting.mode],
      ['Venue', currentMeeting.location],
      [],
      ['Member ID', 'Name', 'Role', 'Status', 'Marked At'],
    ];

    for (const member of eligibleMembers) {
      const rec = meetingAttendanceMap.get(member.id);
      rows.push([
        member.memberId,
        member.name,
        member.roleTitle,
        rec ? rec.status : 'Not Marked',
        rec ? new Date(rec.markedAt).toLocaleTimeString() : 'N/A',
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `attendance_${currentMeeting.title.replace(/\s+/g, '_')}_${currentMeeting.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-emerald-400" />
            <span>Attendance & Quorum Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Meeting-wise attendance logs, audit trails, quorum calculations, and member correction reviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAttendanceCSV}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Export Meeting Attendance</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('sheet')}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
            activeTab === 'sheet'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Meeting Attendance Sheet
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
            activeTab === 'members'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Member Quorum & Percentages
        </button>
        <button
          onClick={() => setActiveTab('corrections')}
          className={`relative border-b-2 px-5 py-3 text-xs font-bold transition ${
            activeTab === 'corrections'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Correction Tickets
          {correctionRequests.filter((r) => r.status === 'Pending').length > 0 && (
            <span className="ml-2 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white">
              {correctionRequests.filter((r) => r.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: MEETING ATTENDANCE SHEET */}
      {activeTab === 'sheet' && (
        <div className="space-y-6">
          {/* Meeting Selector & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex-1 max-w-md">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select Meeting to Take / Inspect Attendance:
              </label>
              <select
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
              >
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.date} • {m.title} ({m.departmentId})
                  </option>
                ))}
              </select>
            </div>

            {permissions.canMarkAttendance && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
                >
                  Mark All Present
                </button>
              </div>
            )}
          </div>

          {/* Meeting Information Summary Card */}
          {currentMeeting && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Meeting Date:</span>
                <div className="font-bold text-white">{currentMeeting.date} ({currentMeeting.startTime} - {currentMeeting.endTime})</div>
              </div>
              <div>
                <span className="text-slate-400">Venue / Mode:</span>
                <div className="font-bold text-amber-400">{currentMeeting.mode} • {currentMeeting.location}</div>
              </div>
              <div>
                <span className="text-slate-400">Department:</span>
                <div className="font-bold text-white">{currentMeeting.departmentId}</div>
              </div>
              <div>
                <span className="text-slate-400">Quorum Progress:</span>
                <div className="font-bold text-emerald-400">
                  {meetingAttendanceMap.size} / {eligibleMembers.length} marked
                </div>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-800/60 uppercase text-[10px] font-bold tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Role / Department</th>
                    <th className="px-4 py-3">Attendance Status</th>
                    <th className="px-4 py-3">Audit Details</th>
                    {permissions.canMarkAttendance && (
                      <th className="px-4 py-3 text-right">Quick Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {eligibleMembers.map((member) => {
                    const record = meetingAttendanceMap.get(member.id);
                    const status = record?.status || 'Not Marked';

                    return (
                      <tr key={member.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-bold text-white">{member.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{member.memberId}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-200">{member.roleTitle}</div>
                          <div className="text-[10px] text-amber-400">{member.primaryDepartmentId}</div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              status === 'Present'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : status === 'Late'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : status === 'Excused'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : status === 'On Leave'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : status === 'Absent'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {record ? (
                            <button
                              onClick={() => setAuditLogModalRecord(record)}
                              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400"
                            >
                              <History className="h-3.5 w-3.5" />
                              <span>{record.auditTrail.length} edits logged</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">Unrecorded</span>
                          )}
                        </td>

                        {permissions.canMarkAttendance && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleSetMemberStatus(member.id, 'Present')}
                                className="rounded px-2 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleSetMemberStatus(member.id, 'Late')}
                                className="rounded px-2 py-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950"
                              >
                                Late
                              </button>
                              <button
                                onClick={() => handleSetMemberStatus(member.id, 'Absent')}
                                className="rounded px-2 py-1 text-[10px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-slate-950"
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleSetMemberStatus(member.id, 'Excused')}
                                className="rounded px-2 py-1 text-[10px] font-bold bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-slate-950"
                              >
                                Excused
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBER QUORUM & PERCENTAGES */}
      {activeTab === 'members' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-800/60 uppercase text-[10px] font-bold tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Attendance %</th>
                  <th className="px-4 py-3">Present</th>
                  <th className="px-4 py-3">Late</th>
                  <th className="px-4 py-3">Absent</th>
                  <th className="px-4 py-3">Excused (Excluded)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => {
                  const stats = calculateMemberAttendance(m.id, attendance, meetings, settings);
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-white">{m.name}</td>
                      <td className="px-4 py-3 text-slate-300">{m.primaryDepartmentId}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-black font-mono text-sm ${
                            stats.percentage >= 75
                              ? 'text-emerald-400'
                              : stats.percentage >= 60
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {stats.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">{stats.present}</td>
                      <td className="px-4 py-3 text-amber-400">{stats.late}</td>
                      <td className="px-4 py-3 text-rose-400">{stats.absent}</td>
                      <td className="px-4 py-3 text-blue-400">{stats.excused}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CORRECTION TICKETS */}
      {activeTab === 'corrections' && (
        <div className="space-y-4">
          {correctionRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center text-xs text-slate-400">
              No attendance correction requests submitted.
            </div>
          ) : (
            correctionRequests.map((req) => {
              const member = members.find((m) => m.id === req.memberId);
              const meeting = meetings.find((m) => m.id === req.meetingId);

              return (
                <div
                  key={req.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{member?.name}</span>
                      <span className="text-xs text-slate-400">({member?.memberId})</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          req.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : req.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-slate-300">
                      Meeting: <strong className="text-white">{meeting?.title || req.meetingId}</strong> • Current: <span className="text-rose-400 font-bold">{req.currentStatus}</span> → Requested: <span className="text-emerald-400 font-bold">{req.requestedStatus}</span>
                    </div>

                    <p className="mt-2 text-xs text-slate-400 italic">
                      "{req.reason}"
                    </p>
                  </div>

                  {permissions.canReviewAttendanceCorrections && req.status === 'Pending' && currentUser && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => reviewAttendanceCorrection(req.id, 'Approved', currentUser.id)}
                        className="rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                      >
                        Approve Correction
                      </button>
                      <button
                        onClick={() => reviewAttendanceCorrection(req.id, 'Rejected', currentUser.id)}
                        className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Audit Log Modal */}
      {auditLogModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">Attendance Audit Log Trail</h3>
            <p className="text-xs text-slate-400 mb-4">
              Detailed historical changes, editor identities, and revision justifications.
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-xs">
                <div className="text-slate-400 font-mono text-[10px]">Initial Recording</div>
                <div className="font-bold text-white mt-1">Marked by {members.find((m) => m.id === auditLogModalRecord.markedById)?.name || 'HR'}</div>
                <div className="text-slate-400 text-[10px] mt-0.5">{new Date(auditLogModalRecord.markedAt).toLocaleString()}</div>
              </div>

              {auditLogModalRecord.auditTrail.map((log, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-xs">
                  <div className="text-amber-400 font-mono text-[10px]">Change #{idx + 1}</div>
                  <div className="text-white mt-1">
                    {log.previousStatus} → <strong className="text-emerald-400">{log.newStatus}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    By: {members.find((m) => m.id === log.changedById)?.name || 'Leadership'} • Reason: {log.reason}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setAuditLogModalRecord(null)}
                className="rounded-xl bg-slate-800 px-4 py-1.5 text-xs text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
