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
  Award,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  ChevronRight,
  UserCheck,
  Clock,
  Video,
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
  } = useData();

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Filter pending approvals (strictly for HR Admins)
  const pendingMembers = members.filter((m) => m.approvalStatus === 'PENDING');
  const activeMembers = members.filter((m) => m.approvalStatus === 'APPROVED' && m.membershipStatus === 'ACTIVE');

  // Upcoming meetings
  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'Scheduled' && new Date(m.date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  // Tasks statistics
  const completedTasks = tasks.filter((t) => t.status === 'Completed');
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');

  // Overall Attendance calculation
  const totalAttRecords = attendance.length;
  const presentRecords = attendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
  const overallAttendanceRate = totalAttRecords > 0 ? Math.round((presentRecords / totalAttRecords) * 100) : 100;

  // Announcements
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* TeamHub Greeting & Action Banner */}
      <div className="rounded-3xl border border-[#E3EBE7] bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#E7F3D7] px-3 py-1 text-xs font-bold text-[#064A31]">
                {currentUser?.roleTitle || 'Enactus Leader'}
              </span>
              <span className="text-xs text-[#60736C]">
                {currentUser?.primaryDepartmentId ? `Department: ${currentUser.primaryDepartmentId}` : 'Society Operations'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-[#263832]">
              Good morning, {currentUser?.name || 'Member'}! 👋
            </h1>
            <p className="mt-1 max-w-2xl text-xs md:text-sm text-[#60736C]">
              Here is what is happening across Enactus VIPS-TC today. All operations, meetings, and attendance are live.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/organogram"
              className="flex items-center gap-2 rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] px-4 py-2 text-xs font-bold text-[#263832] hover:bg-[#DDF7EF] transition"
            >
              <Sparkles className="h-4 w-4 text-[#2FC3A5]" />
              <span>Organogram</span>
            </Link>
            <Link
              href="/calendar"
              className="flex items-center gap-2 rounded-2xl bg-[#2FC3A5] px-4 py-2 text-xs font-bold text-[#263832] hover:bg-[#26B396] shadow-sm transition"
            >
              <Calendar className="h-4 w-4" />
              <span>Schedule Meeting</span>
            </Link>
          </div>
        </div>
      </div>

      {/* HR Admin Pending Registration Action Banner */}
      {permissions.canManageMembers && pendingMembers.length > 0 && (
        <div className="rounded-2xl border border-[#2FC3A5]/40 bg-[#DDF7EF]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2FC3A5] text-[#263832] font-black shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#064A31]">
                {pendingMembers.length} Registration {pendingMembers.length === 1 ? 'Applicant' : 'Applicants'} Awaiting HR Approval
              </div>
              <div className="text-[11px] text-[#60736C]">
                Review applications in the Member Management approval queue before portal credentials are unlocked.
              </div>
            </div>
          </div>
          <Link
            href="/members"
            className="flex items-center gap-1 rounded-xl bg-white border border-[#E3EBE7] px-3.5 py-1.5 text-xs font-bold text-[#263832] hover:bg-[#F7F9F7] shadow-sm shrink-0"
          >
            <span>Review Queue</span>
            <ChevronRight className="h-4 w-4 text-[#2FC3A5]" />
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-[#E3EBE7] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#60736C]">
            <span className="text-xs font-semibold">Active Members</span>
            <div className="p-2 rounded-xl bg-[#E7F3D7] text-[#064A31]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#263832]">{activeMembers.length}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#0A875E]">
            <span>Across 8 Departments</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E3EBE7] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#60736C]">
            <span className="text-xs font-semibold">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{pendingMembers.length}</div>
          <div className="mt-1 text-[11px] text-[#60736C]">
            Awaiting HR sign-off
          </div>
        </div>

        <div className="rounded-3xl border border-[#E3EBE7] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#60736C]">
            <span className="text-xs font-semibold">Attendance Quorum</span>
            <div className="p-2 rounded-xl bg-[#E7F3D7] text-[#064A31]">
              <ClipboardCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#064A31]">{overallAttendanceRate}%</div>
          <div className="mt-1 text-[11px] text-[#60736C]">
            {presentRecords} / {totalAttRecords} Meetings Logged
          </div>
        </div>

        <div className="rounded-3xl border border-[#E3EBE7] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-[#60736C]">
            <span className="text-xs font-semibold">Task Progress</span>
            <div className="p-2 rounded-xl bg-[#DDF7EF] text-[#064A31]">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#263832]">
            {completedTasks.length} / {tasks.length}
          </div>
          <div className="mt-1 text-[11px] text-[#60736C]">
            {pendingTasks.length} in progress
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Departments Performance Hub */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#263832] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#2FC3A5]" />
              <span>Departmental Operations (8 Hubs)</span>
            </h2>
            <Link
              href="/departments"
              className="text-xs text-[#2FC3A5] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Explore all departments</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((dept) => {
              const deptMembers = members.filter(
                (m) => m.primaryDepartmentId === dept.id && m.approvalStatus === 'APPROVED'
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
              const deptTasks = tasks.filter((t) => t.departmentId === dept.id);
              const completedDeptTasks = deptTasks.filter((t) => t.status === 'Completed');

              return (
                <div
                  key={dept.id}
                  className="rounded-3xl border border-[#E3EBE7] bg-white p-4 shadow-sm hover:border-[#2FC3A5] transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: dept.color }}
                      />
                      <span className="font-bold text-[#263832] text-sm">{dept.name}</span>
                    </div>
                    <span className="rounded-full bg-[#E7F3D7] px-2 py-0.5 text-[10px] font-bold text-[#064A31]">
                      {deptMembers.length} members
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-[#60736C] line-clamp-2">
                    {dept.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-[#E3EBE7] space-y-1 text-[11px]">
                    <div className="flex justify-between text-[#60736C]">
                      <span>Head:</span>
                      <span className="font-semibold text-[#263832]">
                        {deptHead ? deptHead.name : 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#60736C]">
                      <span>Secondary HR:</span>
                      <span className="font-semibold text-[#0A875E]">
                        {secondaryHr ? secondaryHr.name : 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#60736C]">
                      <span>Tasks Done:</span>
                      <span className="font-bold text-[#263832]">
                        {completedDeptTasks.length} / {deptTasks.length}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Meetings & Announcements */}
        <div className="space-y-6">
          {/* Upcoming Meetings Widget */}
          <div className="rounded-3xl border border-[#E3EBE7] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#2FC3A5]" />
                <h3 className="font-bold text-[#263832] text-sm">Upcoming Meetings</h3>
              </div>
              <Link href="/calendar" className="text-xs font-semibold text-[#2FC3A5] hover:underline">
                View Calendar
              </Link>
            </div>

            {upcomingMeetings.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#60736C]">
                No upcoming meetings scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 hover:bg-[#DDF7EF] transition"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#263832]">{m.title}</span>
                      <span className="rounded-full bg-[#E7F3D7] px-2 py-0.2 text-[9px] font-bold text-[#064A31]">
                        {m.mode}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[#60736C]">
                      {m.date} at {m.startTime} • {m.location}
                    </div>
                    {m.meetingLink && (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 rounded-xl bg-white border border-[#E3EBE7] px-2 py-0.5 text-[10px] font-bold text-[#064A31] hover:bg-[#2FC3A5] hover:text-white transition"
                      >
                        <Video className="h-3 w-3" />
                        <span>Join Room</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements & Notices */}
          <div className="rounded-3xl border border-[#E3EBE7] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-[#2FC3A5]" />
                <h3 className="font-bold text-[#263832] text-sm">Notice Board</h3>
              </div>
              <Link href="/events" className="text-xs font-semibold text-[#2FC3A5] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {sortedAnnouncements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className={`rounded-2xl border p-3 ${
                    ann.isPinned
                      ? 'border-[#2FC3A5]/40 bg-[#DDF7EF]/40'
                      : 'border-[#E3EBE7] bg-[#F7F9F7]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#263832]">{ann.title}</span>
                    {ann.isPinned && (
                      <span className="rounded bg-[#FFC220]/20 px-1.5 py-0.2 text-[9px] font-black text-[#B45309] uppercase">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#60736C] line-clamp-2">
                    {ann.content}
                  </p>
                  <div className="mt-2 text-[10px] text-[#60736C]">
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
