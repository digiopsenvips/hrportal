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
  Users,
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
    refreshAll,
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
    await refreshAll();
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
    await refreshAll();
  };

  // Export attendance sheet to CSV with UTF-8 BOM
  const handleExportAttendanceCSV = () => {
    if (!currentMeeting) return;
    const rows = [
      ['Meeting Title', `"${currentMeeting.title}"`],
      ['Date', currentMeeting.date],
      ['Mode', currentMeeting.mode],
      ['Venue', `"${currentMeeting.location}"`],
      [],
      ['Member ID', 'Name', 'Role', 'Status', 'Marked At'],
    ];

    for (const member of eligibleMembers) {
      const rec = meetingAttendanceMap.get(member.id);
      rows.push([
        member.memberId,
        `"${member.name}"`,
        `"${member.roleTitle}"`,
        rec ? rec.status : 'Not Marked',
        rec ? new Date(rec.markedAt).toLocaleTimeString() : 'N/A',
      ]);
    }

    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${currentMeeting.title.replace(/\s+/g, '_')}_${currentMeeting.date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <ClipboardCheck className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Attendance & Quorum Tracking</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">Attendance Management</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Meeting-wise attendance logs, audit trails, quorum calculations, and member correction reviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAttendanceCSV}
            className="flex items-center gap-2 rounded-xl border border-[#E3EBE7] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition shadow-sm"
          >
            <Download className="h-4 w-4 text-[#2FC3A5]" />
            <span>Export Meeting Attendance</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E3EBE7]">
        <button
          onClick={() => setActiveTab('sheet')}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
            activeTab === 'sheet'
              ? 'border-[#2FC3A5] text-[#2FC3A5]'
              : 'border-transparent text-[#637d74] hover:text-[#263832]'
          }`}
        >
          Meeting Attendance Sheet
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition ${
            activeTab === 'members'
              ? 'border-[#2FC3A5] text-[#2FC3A5]'
              : 'border-transparent text-[#637d74] hover:text-[#263832]'
          }`}
        >
          Member Quorum & Percentages
        </button>
        <button
          onClick={() => setActiveTab('corrections')}
          className={`relative border-b-2 px-5 py-3 text-xs font-bold transition ${
            activeTab === 'corrections'
              ? 'border-[#2FC3A5] text-[#2FC3A5]'
              : 'border-transparent text-[#637d74] hover:text-[#263832]'
          }`}
        >
          <span>Correction Tickets</span>
          {correctionRequests.filter((r) => r.status === 'Pending').length > 0 && (
            <span className="ml-2 rounded-full bg-[#2FC3A5] px-2 py-0.5 text-[10px] text-white font-bold">
              {correctionRequests.filter((r) => r.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: MEETING ATTENDANCE SHEET */}
      {activeTab === 'sheet' && (
        <div className="space-y-6">
          {/* Meeting Selector & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm">
            <div className="flex-1 max-w-md">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#637d74]">
                Select Meeting to Take / Inspect Attendance:
              </label>
              <select
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
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
                  className="rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-4 py-2 text-xs font-bold text-white transition shadow-sm"
                >
                  Mark All Present
                </button>
              </div>
            )}
          </div>

          {/* Meeting Information Summary Card */}
          {currentMeeting && (
            <div className="rounded-2xl border border-[#E3EBE7] bg-white p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shadow-xs">
              <div>
                <span className="text-[#8a9e96] block text-[11px]">Meeting Date:</span>
                <div className="font-bold text-[#263832] mt-0.5">{currentMeeting.date} ({currentMeeting.startTime} - {currentMeeting.endTime})</div>
              </div>
              <div>
                <span className="text-[#8a9e96] block text-[11px]">Venue / Mode:</span>
                <div className="font-bold text-[#0D5143] mt-0.5">{currentMeeting.mode} • {currentMeeting.location}</div>
              </div>
              <div>
                <span className="text-[#8a9e96] block text-[11px]">Department:</span>
                <div className="font-bold text-[#263832] mt-0.5">{currentMeeting.departmentId}</div>
              </div>
              <div>
                <span className="text-[#8a9e96] block text-[11px]">Quorum Progress:</span>
                <div className="font-bold text-[#2FC3A5] mt-0.5">
                  {meetingAttendanceMap.size} / {eligibleMembers.length} marked
                </div>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          <div className="overflow-hidden rounded-2xl border border-[#E3EBE7] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#263832]">
                <thead className="border-b border-[#E3EBE7] bg-[#F7F9F7] uppercase text-[10px] font-bold tracking-wider text-[#637d74]">
                  <tr>
                    <th className="px-4 py-3.5">Member</th>
                    <th className="px-4 py-3.5">Role / Department</th>
                    <th className="px-4 py-3.5">Attendance Status</th>
                    <th className="px-4 py-3.5">Audit Details</th>
                    {permissions.canMarkAttendance && (
                      <th className="px-4 py-3.5 text-right">Quick Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EBE7]">
                  {eligibleMembers.map((member) => {
                    const record = meetingAttendanceMap.get(member.id);
                    const status = record?.status || 'Not Marked';

                    return (
                      <tr key={member.id} className="hover:bg-[#F7F9F7] transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-8 w-8 rounded-full object-cover border border-[#E3EBE7]"
                            />
                            <div>
                              <div className="font-bold text-[#263832]">{member.name}</div>
                              <div className="text-[10px] text-[#8a9e96] font-mono">{member.memberId}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[#263832]">{member.roleTitle}</div>
                          <div className="text-[10px] text-[#637d74]">{member.primaryDepartmentId}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              status === 'Present'
                                ? 'bg-[#E7F3D7] text-[#0D5143]'
                                : status === 'Late'
                                ? 'bg-amber-100 text-amber-800'
                                : status === 'Excused'
                                ? 'bg-blue-100 text-blue-800'
                                : status === 'On Leave'
                                ? 'bg-purple-100 text-purple-800'
                                : status === 'Absent'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-[#F7F9F7] text-[#8a9e96] border border-[#E3EBE7]'
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          {record ? (
                            <button
                              onClick={() => setAuditLogModalRecord(record)}
                              className="flex items-center gap-1 text-[11px] text-[#637d74] hover:text-[#2FC3A5] transition"
                            >
                              <History className="h-3.5 w-3.5 text-[#2FC3A5]" />
                              <span>{record.auditTrail?.length || 0} edits logged</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#8a9e96]">Unrecorded</span>
                          )}
                        </td>

                        {permissions.canMarkAttendance && (
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleSetMemberStatus(member.id, 'Present')}
                                className="rounded-lg px-2.5 py-1 text-[10px] font-bold bg-[#E7F3D7] text-[#0D5143] hover:bg-[#2FC3A5] hover:text-white transition"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleSetMemberStatus(member.id, 'Late')}
                                className="rounded-lg px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-200 transition"
                              >
                                Late
                              </button>
                              <button
                                onClick={() => handleSetMemberStatus(member.id, 'Absent')}
                                className="rounded-lg px-2.5 py-1 text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-200 transition"
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleSetMemberStatus(member.id, 'Excused')}
                                className="rounded-lg px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-200 transition"
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
        <div className="rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#263832]">
              <thead className="border-b border-[#E3EBE7] bg-[#F7F9F7] uppercase text-[10px] font-bold tracking-wider text-[#637d74]">
                <tr>
                  <th className="px-4 py-3.5">Member</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Attendance %</th>
                  <th className="px-4 py-3.5">Present</th>
                  <th className="px-4 py-3.5">Late</th>
                  <th className="px-4 py-3.5">Absent</th>
                  <th className="px-4 py-3.5">Excused (Excluded)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EBE7]">
                {members.map((m) => {
                  const stats = calculateMemberAttendance(m.id, attendance, meetings, settings);
                  return (
                    <tr key={m.id} className="hover:bg-[#F7F9F7] transition">
                      <td className="px-4 py-3.5 font-bold text-[#263832]">{m.name}</td>
                      <td className="px-4 py-3.5 text-[#637d74]">{m.primaryDepartmentId}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-black font-mono text-sm ${
                            stats.percentage >= 75
                              ? 'text-[#2FC3A5]'
                              : stats.percentage >= 60
                              ? 'text-amber-600'
                              : 'text-red-500'
                          }`}
                        >
                          {stats.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#0D5143] font-semibold">{stats.present}</td>
                      <td className="px-4 py-3.5 text-amber-700">{stats.late}</td>
                      <td className="px-4 py-3.5 text-red-600">{stats.absent}</td>
                      <td className="px-4 py-3.5 text-blue-700">{stats.excused}</td>
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
            <div className="rounded-2xl border border-[#E3EBE7] bg-white p-12 text-center text-xs text-[#8a9e96]">
              No attendance correction requests submitted.
            </div>
          ) : (
            correctionRequests.map((req) => {
              const member = members.find((m) => m.id === req.memberId);
              const meeting = meetings.find((m) => m.id === req.meetingId);

              return (
                <div
                  key={req.id}
                  className="rounded-2xl border border-[#E3EBE7] bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#263832] text-sm">{member?.name}</span>
                      <span className="text-xs text-[#8a9e96]">({member?.memberId})</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          req.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'Approved'
                            ? 'bg-[#E7F3D7] text-[#0D5143]'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-[#637d74]">
                      Meeting: <strong className="text-[#263832]">{meeting?.title || req.meetingId}</strong> • Current:{' '}
                      <span className="text-red-500 font-bold">{req.currentStatus}</span> → Requested:{' '}
                      <span className="text-[#2FC3A5] font-bold">{req.requestedStatus}</span>
                    </div>

                    <p className="mt-2 text-xs text-[#637d74] italic">
                      "{req.reason}"
                    </p>
                  </div>

                  {permissions.canReviewAttendanceCorrections && req.status === 'Pending' && currentUser && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          await reviewAttendanceCorrection(req.id, 'Approved', currentUser.id);
                          await refreshAll();
                        }}
                        className="rounded-xl bg-[#2FC3A5] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-xs"
                      >
                        Approve Correction
                      </button>
                      <button
                        onClick={async () => {
                          await reviewAttendanceCorrection(req.id, 'Rejected', currentUser.id);
                          await refreshAll();
                        }}
                        className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-[#E3EBE7] bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold text-[#263832] mb-2">Attendance Audit Log Trail</h3>
            <p className="text-xs text-[#637d74] mb-4">
              Detailed historical changes, editor identities, and revision justifications.
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-xs">
                <div className="text-[#8a9e96] font-mono text-[10px]">Initial Recording</div>
                <div className="font-bold text-[#263832] mt-1">
                  Marked by {members.find((m) => m.id === auditLogModalRecord.markedById)?.name || 'HR'}
                </div>
                <div className="text-[#8a9e96] text-[10px] mt-0.5">
                  {new Date(auditLogModalRecord.markedAt).toLocaleString()}
                </div>
              </div>

              {auditLogModalRecord.auditTrail?.map((log, idx) => (
                <div key={idx} className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-xs">
                  <div className="text-[#2FC3A5] font-mono text-[10px]">Change #{idx + 1}</div>
                  <div className="text-[#263832] mt-1">
                    {log.previousStatus} → <strong className="text-[#0D5143]">{log.newStatus}</strong>
                  </div>
                  <div className="text-[10px] text-[#637d74] mt-0.5">
                    By: {members.find((m) => m.id === log.changedById)?.name || 'Leadership'} • Reason: {log.reason}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setAuditLogModalRecord(null)}
                className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-4 py-1.5 text-xs font-semibold text-[#263832] hover:bg-white transition"
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
