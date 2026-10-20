'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { MemberDetailModal } from '@/components/members/MemberDetailModal';
import { Member } from '@/types';
import {
  Users,
  Calendar,
  FileText,
  ClipboardCheck,
  CheckSquare,
  AlertCircle,
  Megaphone,
  TrendingUp,
  Award,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  ChevronRight,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, permissions } = useAuth();
  const {
    departments,
    members,
    meetings,
    moms,
    attendance,
    tasks,
    events,
    announcements,
    hrLeaderboard,
    settings,
  } = useData();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Society-wide metrics
  const totalRegisteredMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'Active').length;
  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'Scheduled' && new Date(m.date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  // Current month meetings
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const meetingsThisMonth = meetings.filter((m) => m.date.startsWith(currentMonthStr));

  // Pending MOMs: completed meetings that lack an official published MOM
  const completedMeetings = meetings.filter((m) => m.status === 'Completed');
  const pendingMoms = moms.filter((m) => m.publicationStatus === 'Pending Review' || m.publicationStatus === 'Draft');

  // Tasks statistics
  const completedTasks = tasks.filter((t) => t.status === 'Completed');
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'Completed') return false;
    return new Date(t.deadline) < new Date(new Date().setHours(0, 0, 0, 0));
  });

  // Overall Attendance calculation
  const totalAttRecords = attendance.length;
  const presentRecords = attendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
  const overallAttendanceRate = totalAttRecords > 0 ? Math.round((presentRecords / totalAttRecords) * 100) : 100;

  // Recent announcements (pinned first)
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Top 3 HR Leaderboard members
  const topHrMembers = hrLeaderboard.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome Banner with Role Tier Indicator */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-400">
                {currentUser?.roleTitle || 'Enactus Leader'}
              </span>
              <span className="text-xs text-slate-400">
                {currentUser?.primaryDepartmentId ? `Department: ${currentUser.primaryDepartmentId}` : 'Society Central'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {currentUser?.name || 'Member'}! 👋
            </h1>
            <p className="mt-1 max-w-2xl text-xs md:text-sm text-slate-300">
              Enactus VIPS-TC Central Management Portal • Real-time synchronization of operations, departmental MOMs, attendance records, and verified task workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/organogram"
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>Visual Organogram</span>
            </Link>
            <Link
              href="/calendar"
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/20 transition"
            >
              <Calendar className="h-4 w-4" />
              <span>Schedule Meeting</span>
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Members</span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{totalRegisteredMembers}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <span>{activeMembers} Active</span>
            <span className="text-slate-400">• Across 8 Depts</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Society Quorum</span>
            <ClipboardCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{overallAttendanceRate}%</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {presentRecords} / {totalAttRecords} Attendances Marked
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tasks Progress</span>
            <CheckSquare className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-400">
            {completedTasks.length} / {tasks.length}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400">
            <span>{overdueTasks.length} Overdue</span>
            <span className="text-slate-400">• {pendingTasks.length} in progress</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Meetings This Month</span>
            <Calendar className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{meetingsThisMonth.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {upcomingMeetings.length} Scheduled Upcoming
          </div>
        </div>
      </div>

      {/* Role-Specific Executive Briefing Section */}
      {permissions.isPresident && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
              <ShieldCheck className="h-5 w-5" />
              <span>President's Executive Control & Society Health</span>
            </div>
            <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              Level 1 Authority
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            As President, you have full governance across all 8 independent departments. Review all pending MOMs, verify action items, and approve cross-department budgets.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-3">
              <div className="text-[11px] text-slate-400">Pending MOM Reviews</div>
              <div className="text-lg font-bold text-amber-400">{pendingMoms.length} Requiring Sign-off</div>
              <Link href="/moms" className="mt-1 text-[11px] text-amber-400 hover:underline flex items-center gap-1">
                <span>Review MOMs</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-3">
              <div className="text-[11px] text-slate-400">HR Task Verification</div>
              <div className="text-lg font-bold text-emerald-400">
                {tasks.filter((t) => t.status === 'Completed' && !t.isVerified).length} Awaiting Verification
              </div>
              <Link href="/tasks" className="mt-1 text-[11px] text-emerald-400 hover:underline flex items-center gap-1">
                <span>Open Task Board</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-3">
              <div className="text-[11px] text-slate-400">Department Health</div>
              <div className="text-lg font-bold text-blue-400">{departments.filter((d) => d.isActive).length} / 8 Active</div>
              <Link href="/departments" className="mt-1 text-[11px] text-blue-400 hover:underline flex items-center gap-1">
                <span>View Department Hubs</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {permissions.isVP && (
        <div className="rounded-2xl border border-blue-500/40 bg-blue-500/5 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
              <ShieldCheck className="h-5 w-5" />
              <span>Vice President Project & Operational Supervision</span>
            </div>
            <span className="rounded bg-blue-400/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
              Level 2 Authority
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            Monitoring project bottlenecks, upcoming deadlines, and departmental deliverables across Project Raahat and Project Vridhi.
          </p>
        </div>
      )}

      {/* Department Breakdown & Participation Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Departments Status Hub */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-400" />
              <span>Departments Performance & Operations</span>
            </h2>
            <Link
              href="/departments"
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Explore all 8 departments</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((dept) => {
              const deptMembers = members.filter(
                (m) => m.primaryDepartmentId === dept.id
              );
              const deptHead = members.find(
                (m) =>
                  (m.role === 'dept_head' || m.roleTitle.toLowerCase().includes('head')) &&
                  (m.assignedDepartmentId === dept.id || m.primaryDepartmentId === dept.id)
              );
              const secondaryHr = members.find(
                (m) =>
                  m.role === 'secondary_hr' &&
                  (m.assignedDepartmentId === dept.id || m.primaryDepartmentId === dept.id)
              );
              const deptMeetings = meetings.filter((m) => m.departmentId === dept.id);
              const deptTasks = tasks.filter((t) => t.departmentId === dept.id);
              const completedDeptTasks = deptTasks.filter((t) => t.status === 'Completed');

              return (
                <div
                  key={dept.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: dept.color }}
                      />
                      <span className="font-bold text-white text-sm">{dept.name}</span>
                    </div>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      {deptMembers.length} members
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                    {dept.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Head:</span>
                      <span className="font-medium text-slate-200">
                        {deptHead ? deptHead.name : 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Secondary HR:</span>
                      <span className="font-medium text-rose-300">
                        {secondaryHr ? secondaryHr.name : 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Tasks Done:</span>
                      <span className="font-medium text-emerald-400">
                        {completedDeptTasks.length} / {deptTasks.length}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: HR Leaderboard Preview & Announcements */}
        <div className="space-y-6">
          {/* HR Operations Leaderboard Preview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">HR Operations Leaderboard</h3>
              </div>
              <Link
                href="/leaderboard"
                className="text-xs text-amber-400 hover:underline"
              >
                Full Standings
              </Link>
            </div>

            <div className="space-y-3">
              {topHrMembers.map((hr, idx) => (
                <div
                  key={hr.member.id}
                  onClick={() => setSelectedMember(hr.member)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-3 hover:border-amber-400/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : 'bg-amber-700/60 text-amber-200'
                      }`}
                    >
                      #{hr.rank}
                    </div>
                    <img
                      src={hr.member.avatar}
                      alt={hr.member.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{hr.member.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                        {hr.assignedDepartmentName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold text-amber-400 font-mono">
                      {hr.compositeScore} pts
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {hr.verifiedTasksCount} verified tasks
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements & Important Notices */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Announcements</h3>
              </div>
              <Link href="/events" className="text-xs text-amber-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {sortedAnnouncements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className={`rounded-xl border p-3 ${
                    ann.isPinned
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-slate-800 bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-amber-400">{ann.title}</span>
                    {ann.isPinned && (
                      <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 uppercase">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                    {ann.content}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
