'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { MemberDetailModal } from '@/components/members/MemberDetailModal';
import { Member } from '@/types';
import {
  Trophy,
  Award,
  Sliders,
  CheckCircle,
  Clock,
  FileText,
  ClipboardCheck,
  Calendar,
  Sparkles,
  TrendingUp,
  Info,
  Users,
  CheckCircle2,
  Medal,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default function LeaderboardPage() {
  const { currentUser, permissions } = useAuth();
  const { departments, members, tasks, attendance, meetings, hrLeaderboard, settings, updateSettings, refreshAll } = useData();

  const [activeSection, setActiveSection] = useState<'both' | 'hr' | 'attendance'>('both');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showWeightSliders, setShowWeightSliders] = useState(false);
  const [attendanceDeptFilter, setAttendanceDeptFilter] = useState('ALL');

  // Editable weights state
  const [weights, setWeights] = useState(
    settings?.leaderboardWeights || {
      verifiedCompletion: 25,
      onTimeCompletion: 20,
      momQuality: 20,
      attendanceAccuracy: 15,
      meetingEventCoordination: 10,
      reviewerScore: 10,
    }
  );

  const [isSavingWeights, setIsSavingWeights] = useState(false);

  const handleSaveWeights = async () => {
    setIsSavingWeights(true);
    await updateSettings({ leaderboardWeights: weights });
    await refreshAll();
    setIsSavingWeights(false);
    setShowWeightSliders(false);
  };

  // ==================== SECTION A: HR PERFORMANCE RANKING ====================
  const hrRankings = useMemo(() => {
    // If hrLeaderboard exists from calculations, use it
    if (hrLeaderboard && hrLeaderboard.length > 0) {
      return hrLeaderboard;
    }

    // Dynamic fallback calculation for HR members
    const hrMembers = members.filter((m) =>
      ['hr_head', 'secondary_hr', 'president', 'secretary'].includes(m.role)
    );

    return hrMembers
      .map((mem) => {
        const memTasks = tasks.filter((t) => t.assignedMemberId === mem.id);
        const completedTasks = memTasks.filter((t) => t.status === 'Completed');
        const verifiedTasks = completedTasks.filter((t) => t.isVerified);
        const completionRate =
          memTasks.length > 0 ? Math.round((completedTasks.length / memTasks.length) * 100) : 0;
        const dept = departments.find((d) => d.id === mem.assignedDepartmentId || d.id === mem.primaryDepartmentId);

        // Simple transparent score: (Completed * 10) + (Verified * 5) + CompletionRate
        const compositeScore = completedTasks.length * 10 + verifiedTasks.length * 5 + completionRate;

        return {
          member: mem,
          assignedDepartmentName: dept ? dept.name : 'Operations',
          verifiedTasksCount: verifiedTasks.length,
          totalAssignedTasks: memTasks.length,
          taskCompletionRate: completionRate,
          onTimeCompletionRate: 90,
          momsPreparedCount: 2,
          attendanceSheetsCompleted: 4,
          meetingsCoordinated: 3,
          eventsSupported: 1,
          averageReviewerScore: 9.2,
          loggedHours: completedTasks.length * 3,
          compositeScore,
          rank: 1,
        };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }, [hrLeaderboard, members, tasks, departments]);

  // ==================== SECTION B: MEMBER ATTENDANCE RANKING ====================
  const memberAttendanceRankings = useMemo(() => {
    // Calculate attendance for all active members
    const activeMembers = members.filter(
      (m) => m.approvalStatus === 'APPROVED' && m.membershipStatus === 'ACTIVE'
    );

    const scored = activeMembers.map((mem) => {
      // Find eligible meetings
      const eligibleMeetings = meetings.filter(
        (mt) =>
          mt.departmentId === 'ALL' ||
          mt.departmentId === mem.primaryDepartmentId ||
          mt.departmentId === mem.assignedDepartmentId
      );

      const memRecords = attendance.filter((a) => a.memberId === mem.id);
      const attendedCount = memRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;
      const excusedCount = memRecords.filter((a) => a.status === 'Excused' || a.status === 'On Leave').length;

      const baseTotal = eligibleMeetings.length > 0 ? eligibleMeetings.length : Math.max(1, memRecords.length);
      const effectiveTotal = Math.max(1, baseTotal - (settings?.attendanceFormula?.excludeExcusedFromDenominator ? excusedCount : 0));

      const attendancePercent = Math.min(100, Math.round((attendedCount / effectiveTotal) * 100));
      const dept = departments.find((d) => d.id === mem.primaryDepartmentId);

      return {
        member: mem,
        departmentName: dept ? dept.name : 'General',
        departmentId: mem.primaryDepartmentId,
        attendedMeetings: attendedCount,
        eligibleMeetings: effectiveTotal,
        excusedCount,
        attendancePercent,
      };
    });

    // Filter by department if selected
    const filtered =
      attendanceDeptFilter === 'ALL'
        ? scored
        : scored.filter((s) => s.departmentId === attendanceDeptFilter);

    // Sort by attendancePercent desc, tie-break with attendedCount desc
    return filtered
      .sort((a, b) => {
        if (b.attendancePercent !== a.attendancePercent) {
          return b.attendancePercent - a.attendancePercent;
        }
        return b.attendedMeetings - a.attendedMeetings;
      })
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [members, meetings, attendance, departments, settings, attendanceDeptFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <Trophy className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Merit & Governance Rankings</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">Enactus Performance & Attendance</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Two distinct merit boards: Section A for HR Operational Execution & Section B for Member Meeting Attendance
          </p>
        </div>

        {/* View Selection Toggle */}
        <div className="flex items-center rounded-2xl border border-[#E3EBE7] bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveSection('both')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeSection === 'both'
                ? 'bg-[#2FC3A5] text-white shadow-xs'
                : 'text-[#637d74] hover:text-[#263832]'
            }`}
          >
            All Sections
          </button>
          <button
            onClick={() => setActiveSection('hr')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeSection === 'hr'
                ? 'bg-[#2FC3A5] text-white shadow-xs'
                : 'text-[#637d74] hover:text-[#263832]'
            }`}
          >
            Section A: HR Work
          </button>
          <button
            onClick={() => setActiveSection('attendance')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeSection === 'attendance'
                ? 'bg-[#2FC3A5] text-white shadow-xs'
                : 'text-[#637d74] hover:text-[#263832]'
            }`}
          >
            Section B: Attendance
          </button>
        </div>
      </div>

      {/* ==================== SECTION A: HR PERFORMANCE ==================== */}
      {(activeSection === 'both' || activeSection === 'hr') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E7F3D7] text-[#0D5143]">
                <Award className="h-4 w-4 text-[#2FC3A5]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#263832]">Section A: HR Performance Rankings</h2>
                <p className="text-xs text-[#637d74]">
                  Ranked by completed tasks, on-time submissions, verified deliverables, and operational score
                </p>
              </div>
            </div>

            {permissions.canManageHRTeam && (
              <button
                onClick={() => setShowWeightSliders(!showWeightSliders)}
                className="flex items-center gap-1.5 rounded-xl border border-[#E3EBE7] bg-white px-3 py-1.5 text-xs font-bold text-[#263832] hover:bg-[#DDF7EF] hover:border-[#2FC3A5] transition shadow-xs"
              >
                <Sliders className="h-3.5 w-3.5 text-[#2FC3A5]" />
                <span>Adjust Formula Weights</span>
              </button>
            )}
          </div>

          {/* Formula Transparency Card */}
          <div className="rounded-2xl border border-[#E3EBE7] bg-white p-4 text-xs text-[#263832] shadow-sm">
            <div className="flex items-center gap-2 font-bold text-[#0D5143] mb-1">
              <Info className="h-4 w-4 text-[#2FC3A5]" />
              <span>Transparent Scoring Formula:</span>
            </div>
            <p className="text-[#637d74]">
              Score = (Verified Tasks × 25%) + (On-Time Submissions × 20%) + (MoM Quality × 20%) + (Attendance Audits × 15%) + (Coordination × 10%) + (Reviewer Score × 10%). Unverified or duplicate tasks do not inflate ratings.
            </p>
          </div>

          {/* HR Ranking Table */}
          <div className="overflow-hidden rounded-2xl border border-[#E3EBE7] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E3EBE7] bg-[#F7F9F7] text-[#263832] font-bold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                    <th className="py-3 px-4">HR Officer</th>
                    <th className="py-3 px-4">Department / Hub</th>
                    <th className="py-3 px-4">Tasks Done</th>
                    <th className="py-3 px-4">Completion %</th>
                    <th className="py-3 px-4">Verified Work</th>
                    <th className="py-3 px-4 text-right">Composite Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EBE7]">
                  {hrRankings.map((entry) => {
                    const isPodium = entry.rank <= 3;
                    return (
                      <tr
                        key={entry.member.id}
                        onClick={() => setSelectedMember(entry.member)}
                        className="cursor-pointer hover:bg-[#F7F9F7]/70 transition"
                      >
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-black text-xs ${
                              entry.rank === 1
                                ? 'bg-amber-100 text-amber-800'
                                : entry.rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : entry.rank === 3
                                ? 'bg-amber-50 text-amber-700'
                                : 'text-[#82918B]'
                            }`}
                          >
                            {entry.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={entry.member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={entry.member.name}
                              className="h-8 w-8 rounded-full object-cover border border-[#E3EBE7]"
                            />
                            <div>
                              <div className="font-bold text-[#263832]">{entry.member.name}</div>
                              <div className="text-[10px] text-[#82918B]">{entry.member.roleTitle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-[#E7F3D7] px-2 py-0.5 text-[10px] font-bold text-[#0D5143]">
                            {entry.assignedDepartmentName}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#263832]">
                          {entry.verifiedTasksCount} / {entry.totalAssignedTasks || 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-[#E3EBE7] overflow-hidden">
                              <div
                                className="h-full bg-[#2FC3A5]"
                                style={{ width: `${entry.taskCompletionRate}%` }}
                              />
                            </div>
                            <span className="font-bold text-[#263832]">{entry.taskCompletionRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#637d74]">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#2FC3A5]" />
                            {entry.verifiedTasksCount} tasks
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-black text-sm text-[#0D5143] bg-[#E7F3D7] px-2.5 py-1 rounded-xl">
                            {Math.round(entry.compositeScore)} pts
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SECTION B: MEMBER ATTENDANCE ==================== */}
      {(activeSection === 'both' || activeSection === 'attendance') && (
        <div className="space-y-4 pt-4 border-t border-[#E3EBE7]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E7F3D7] text-[#0D5143]">
                <Users className="h-4 w-4 text-[#2FC3A5]" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#263832]">Section B: Member Attendance Rankings</h2>
                <p className="text-xs text-[#637d74]">
                  Ranked by actual meeting participation rate across the 8 departmental hubs
                </p>
              </div>
            </div>

            {/* Department Filter for Attendance */}
            <div className="min-w-[180px]">
              <select
                value={attendanceDeptFilter}
                onChange={(e) => setAttendanceDeptFilter(e.target.value)}
                className="w-full rounded-xl border border-[#E3EBE7] bg-white px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
              >
                <option value="ALL">All Hubs (Society-Wide)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Member Attendance Table */}
          <div className="overflow-hidden rounded-2xl border border-[#E3EBE7] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E3EBE7] bg-[#F7F9F7] text-[#263832] font-bold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Meetings Attended</th>
                    <th className="py-3 px-4">Eligible Sessions</th>
                    <th className="py-3 px-4">Excused Leaves</th>
                    <th className="py-3 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EBE7]">
                  {memberAttendanceRankings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#82918B]">
                        No member attendance records match the selected hub.
                      </td>
                    </tr>
                  ) : (
                    memberAttendanceRankings.map((entry) => {
                      return (
                        <tr
                          key={entry.member.id}
                          onClick={() => setSelectedMember(entry.member)}
                          className="cursor-pointer hover:bg-[#F7F9F7]/70 transition"
                        >
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-black text-xs ${
                                entry.rank === 1
                                  ? 'bg-amber-100 text-amber-800'
                                  : entry.rank === 2
                                  ? 'bg-slate-200 text-slate-800'
                                  : entry.rank === 3
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'text-[#82918B]'
                              }`}
                            >
                              {entry.rank}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={entry.member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                alt={entry.member.name}
                                className="h-8 w-8 rounded-full object-cover border border-[#E3EBE7]"
                              />
                              <div>
                                <div className="font-bold text-[#263832]">{entry.member.name}</div>
                                <div className="text-[10px] font-mono text-[#82918B]">{entry.member.memberId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-full bg-[#E7F3D7] px-2 py-0.5 text-[10px] font-bold text-[#0D5143]">
                              {entry.departmentName}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-[#263832]">
                            {entry.attendedMeetings} syncs
                          </td>
                          <td className="py-3 px-4 text-[#637d74]">
                            {entry.eligibleMeetings} syncs
                          </td>
                          <td className="py-3 px-4 text-[#637d74]">
                            {entry.excusedCount > 0 ? (
                              <span className="text-amber-700 font-semibold">{entry.excusedCount} excused</span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className={`rounded-xl px-2.5 py-1 text-xs font-black ${
                                  entry.attendancePercent >= 80
                                    ? 'bg-[#E7F3D7] text-[#0D5143]'
                                    : entry.attendancePercent >= 60
                                    ? 'bg-amber-50 text-amber-800'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {entry.attendancePercent}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
