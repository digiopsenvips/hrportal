'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Department, Member, Task } from '@/types';
import {
  Building2,
  Users,
  Calendar,
  FileText,
  CheckSquare,
  ClipboardCheck,
  Plus,
  Edit,
  Clock,
  ArrowRight,
  X,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
  User,
  Sparkles,
  ExternalLink,
  Mail,
  Phone,
  GraduationCap,
  Award,
  Shield,
  Star,
  Check,
} from 'lucide-react';

export default function DepartmentsPage() {
  const { currentUser, permissions } = useAuth();
  const {
    departments,
    members,
    meetings,
    moms,
    tasks,
    attendance,
    updateTask,
    addDepartment,
    updateDepartment,
    refreshAll,
  } = useData();

  // Active department selected for detail inspection
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [inspectingMember, setInspectingMember] = useState<Member | null>(null);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);

  // Task filtering inside department details
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('ALL');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<string>('ALL');

  // Form states
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newDeptColor, setNewDeptColor] = useState('#2FC3A5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptDesc, setEditDeptDesc] = useState('');
  const [editHeadId, setEditHeadId] = useState('');
  const [editSecondaryHrId, setEditSecondaryHrId] = useState('');

  // Selected department record
  const selectedDept = useMemo(() => {
    return departments.find((d) => d.id === selectedDeptId);
  }, [departments, selectedDeptId]);

  // Tasks for selected department
  const selectedDeptTasks = useMemo(() => {
    if (!selectedDeptId) return [];
    return tasks.filter((t) => t.departmentId === selectedDeptId);
  }, [tasks, selectedDeptId]);

  // Completion calculation:
  // Completion % = Completed eligible tasks / Total eligible tasks * 100
  const deptTaskAnalytics = useMemo(() => {
    const total = selectedDeptTasks.length;
    const completed = selectedDeptTasks.filter((t) => t.status === 'Completed').length;
    const inProgress = selectedDeptTasks.filter((t) => t.status === 'In Progress').length;
    const blocked = selectedDeptTasks.filter((t) => t.status === 'Overdue' || t.status === 'Under Review').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, blocked, completionRate };
  }, [selectedDeptTasks]);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return selectedDeptTasks.filter((t) => {
      if (taskStatusFilter !== 'ALL' && t.status !== taskStatusFilter) {
        return false;
      }
      if (taskAssigneeFilter !== 'ALL' && t.assignedMemberId !== taskAssigneeFilter) {
        return false;
      }
      return true;
    });
  }, [selectedDeptTasks, taskStatusFilter, taskAssigneeFilter]);

  // Department Members
  const deptMembers = useMemo(() => {
    if (!selectedDeptId) return [];
    return members.filter(
      (m) =>
        (m.primaryDepartmentId === selectedDeptId || m.assignedDepartmentId === selectedDeptId) &&
        m.approvalStatus === 'APPROVED' &&
        m.membershipStatus === 'ACTIVE'
    );
  }, [members, selectedDeptId]);

  // Leadership in selected department
  const deptHead = useMemo(() => {
    if (!selectedDeptId) return null;
    return members.find(
      (m) =>
        (m.role === 'dept_head' || m.roleTitle.toLowerCase().includes('head')) &&
        (m.assignedDepartmentId === selectedDeptId || m.primaryDepartmentId === selectedDeptId)
    );
  }, [members, selectedDeptId]);

  const secondaryHr = useMemo(() => {
    if (!selectedDeptId) return null;
    return members.find(
      (m) =>
        m.role === 'secondary_hr' &&
        (m.assignedDepartmentId === selectedDeptId || m.primaryDepartmentId === selectedDeptId)
    );
  }, [members, selectedDeptId]);

  // Meetings & MOMs for selected department
  const deptMeetings = useMemo(() => {
    if (!selectedDeptId) return [];
    return meetings.filter((m) => m.departmentId === selectedDeptId || m.departmentId === 'ALL');
  }, [meetings, selectedDeptId]);

  const deptMoms = useMemo(() => {
    if (!selectedDeptId) return [];
    return moms.filter((m) => m.departmentId === selectedDeptId && m.publicationStatus === 'Published');
  }, [moms, selectedDeptId]);

  // Comprehensive analytics for inspecting a member's department portfolio
  const inspectingMemberStats = useMemo(() => {
    if (!inspectingMember || !selectedDept) return null;

    // Department specific tasks
    const memberDeptTasks = tasks.filter(
      (t) => t.departmentId === selectedDept.id && t.assignedMemberId === inspectingMember.id
    );
    const completedDeptTasks = memberDeptTasks.filter((t) => t.status === 'Completed');
    const inProgressDeptTasks = memberDeptTasks.filter((t) => t.status === 'In Progress');
    const blockedDeptTasks = memberDeptTasks.filter(
      (t) => t.status === 'Overdue' || t.status === 'Under Review'
    );
    const taskRate =
      memberDeptTasks.length > 0
        ? Math.round((completedDeptTasks.length / memberDeptTasks.length) * 100)
        : 0;

    // Attendance records
    const memAttendanceRecords = attendance.filter((a) => a.memberId === inspectingMember.id);
    const eligibleMeetings = meetings.filter(
      (mt) => mt.departmentId === 'ALL' || mt.departmentId === selectedDept.id
    );
    const presentCount = memAttendanceRecords.filter((a) => a.status === 'Present').length;
    const lateCount = memAttendanceRecords.filter((a) => a.status === 'Late').length;
    const excusedCount = memAttendanceRecords.filter(
      (a) => a.status === 'Excused' || a.status === 'On Leave'
    ).length;
    const absentCount = memAttendanceRecords.filter((a) => a.status === 'Absent').length;
    const attendedCount = presentCount + lateCount;

    const effectiveTotal = Math.max(1, eligibleMeetings.length - excusedCount);
    const attendanceRate = Math.min(100, Math.round((attendedCount / effectiveTotal) * 100));
    const recordedHours = attendedCount * 1.5;
    const scheduledHours = eligibleMeetings.length * 1.5;

    // Attended MOMs
    const attendedMOMs = moms.filter(
      (m) => m.attendeeIds?.includes(inspectingMember.id) && m.publicationStatus === 'Published'
    );

    return {
      memberDeptTasks,
      completedDeptTasks,
      inProgressDeptTasks,
      blockedDeptTasks,
      taskRate,
      memAttendanceRecords,
      eligibleMeetings,
      presentCount,
      lateCount,
      excusedCount,
      absentCount,
      attendedCount,
      attendanceRate,
      recordedHours,
      scheduledHours,
      attendedMOMs,
    };
  }, [inspectingMember, selectedDept, tasks, attendance, meetings, moms]);

  // Update Task Status directly from department view
  const handleUpdateTaskStatus = async (taskId: string, newStatus: any) => {
    await updateTask({ id: taskId, status: newStatus });
    await refreshAll();
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    setIsSubmitting(true);
    const res = await addDepartment({
      name: newDeptName,
      description: newDeptDesc,
      color: newDeptColor,
    });
    setIsSubmitting(false);
    if (res.success) {
      setShowAddDeptModal(false);
      setNewDeptName('');
      setNewDeptDesc('');
      await refreshAll();
    } else {
      alert(res.error || 'Failed to add department');
    }
  };

  const openEditModal = (dept: Department) => {
    setEditDeptName(dept.name);
    setEditDeptDesc(dept.description);
    setEditHeadId(dept.headMemberId || '');
    setEditSecondaryHrId(dept.secondaryHrMemberId || '');
    setShowEditDeptModal(true);
  };

  const handleUpdateDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    setIsSubmitting(true);
    const res = await updateDepartment({
      id: selectedDept.id,
      name: editDeptName,
      description: editDeptDesc,
      headMemberId: editHeadId || undefined,
      secondaryHrMemberId: editSecondaryHrId || undefined,
    });
    setIsSubmitting(false);
    if (res.success) {
      setShowEditDeptModal(false);
      await refreshAll();
    } else {
      alert(res.error || 'Failed to update department');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <Building2 className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Operational Hubs & Units</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">Department Hubs</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Click any department card to inspect active deliverables, live task completion rate, roster, and syncs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canConfigureSocietySettings && (
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>Configure New Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* 8 Hubs Clickable Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept) => {
          const dTasks = tasks.filter((t) => t.departmentId === dept.id);
          const dCompleted = dTasks.filter((t) => t.status === 'Completed').length;
          const dRate = dTasks.length > 0 ? Math.round((dCompleted / dTasks.length) * 100) : 0;
          const dMembers = members.filter(
            (m) =>
              (m.primaryDepartmentId === dept.id || m.assignedDepartmentId === dept.id) &&
              m.membershipStatus === 'ACTIVE'
          );

          return (
            <div
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className="group cursor-pointer rounded-3xl border border-[#E3EBE7] bg-white p-5 shadow-sm hover:border-[#2FC3A5] hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: dept.color || '#2FC3A5' }}
                  />
                  <span className="rounded-full bg-[#E7F3D7] px-2.5 py-0.5 text-[10px] font-bold text-[#0D5143]">
                    {dMembers.length} Members
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-[#263832] group-hover:text-[#0D5143] transition">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-[#82918B] line-clamp-2 mt-1">{dept.description}</p>
                </div>

                {/* Task Completion Progress Indicator */}
                <div className="space-y-1.5 pt-2 border-t border-[#E3EBE7]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#637d74] font-medium">Task Progress</span>
                    <span className="font-bold text-[#0D5143]">{dRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E3EBE7] overflow-hidden">
                    <div
                      className="h-full bg-[#2FC3A5] rounded-full transition-all duration-500"
                      style={{ width: `${dRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#82918B]">
                    <span>{dCompleted} completed</span>
                    <span>{dTasks.length} total tasks</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E3EBE7]/60 flex items-center justify-between text-xs font-bold text-[#2FC3A5] group-hover:translate-x-0.5 transition">
                <span>Inspect Hub & Deliverables</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== DEPARTMENT DETAILS SLIDE-OVER DRAWER ==================== */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm p-0 md:p-4 animate-fadeIn">
          <div className="h-full md:h-[95vh] w-full max-w-2xl rounded-none md:rounded-3xl border-l md:border border-[#E3EBE7] bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#E3EBE7] px-6 py-4 bg-white">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: selectedDept.color || '#2FC3A5' }}
                />
                <div>
                  <h3 className="font-black text-lg text-[#263832]">{selectedDept.name}</h3>
                  <p className="text-xs text-[#637d74]">Department Hub Overview & Live Task Analytics</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {permissions.canConfigureSocietySettings && (
                  <button
                    onClick={() => openEditModal(selectedDept)}
                    className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs font-bold text-[#263832] hover:bg-white hover:border-[#2FC3A5] transition"
                  >
                    Edit
                  </button>
                )}

                <button
                  onClick={() => setSelectedDeptId(null)}
                  className="rounded-full p-1.5 text-[#82918B] hover:bg-[#F7F9F7] transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-4 text-xs text-[#637d74] leading-relaxed">
                {selectedDept.description}
              </div>

              {/* Leadership Duo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-[#E3EBE7] p-3.5 flex items-center gap-3">
                  <img
                    src={deptHead?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt="Head"
                    className="h-10 w-10 rounded-xl object-cover border border-[#E3EBE7]"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D5143] block">
                      Department Head
                    </span>
                    <span className="font-bold text-[#263832] block truncate">{deptHead?.name || 'Unassigned'}</span>
                    <span className="text-[10px] text-[#82918B] block truncate">{deptHead?.email}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#2FC3A5]/30 bg-[#DDF7EF]/20 p-3.5 flex items-center gap-3">
                  <img
                    src={secondaryHr?.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'}
                    alt="Secondary HR"
                    className="h-10 w-10 rounded-xl object-cover border border-[#2FC3A5]/30"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D5143] block">
                      Secondary HR Contact
                    </span>
                    <span className="font-bold text-[#263832] block truncate">{secondaryHr?.name || 'Unassigned'}</span>
                    <span className="text-[10px] text-[#82918B] block truncate">{secondaryHr?.email}</span>
                  </div>
                </div>
              </div>

              {/* Task Completion Analytics Bar */}
              <div className="rounded-2xl border border-[#E3EBE7] bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#263832]">Task Completion Analytics</h4>
                    <p className="text-[11px] text-[#82918B]">
                      Formula: <code>Completed / Total Eligible × 100</code>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#0D5143]">{deptTaskAnalytics.completionRate}%</span>
                    <span className="text-[10px] text-[#637d74] block">Overall Completion</span>
                  </div>
                </div>

                <div className="h-3 w-full rounded-full bg-[#E3EBE7] overflow-hidden">
                  <div
                    className="h-full bg-[#2FC3A5] rounded-full transition-all duration-500"
                    style={{ width: `${deptTaskAnalytics.completionRate}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#E3EBE7] text-center text-xs">
                  <div>
                    <span className="text-[10px] text-[#82918B] block">Total</span>
                    <span className="font-bold text-[#263832]">{deptTaskAnalytics.total}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#82918B] block">Completed</span>
                    <span className="font-bold text-emerald-700">{deptTaskAnalytics.completed}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#82918B] block">In Progress</span>
                    <span className="font-bold text-blue-700">{deptTaskAnalytics.inProgress}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#82918B] block">Pending/Overdue</span>
                    <span className="font-bold text-amber-700">{deptTaskAnalytics.blocked}</span>
                  </div>
                </div>
              </div>

              {/* Tasks List & Filters */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#263832] uppercase tracking-wider">
                    Assigned Deliverables ({filteredTasks.length})
                  </h4>

                  <div className="flex items-center gap-2">
                    <select
                      value={taskStatusFilter}
                      onChange={(e) => setTaskStatusFilter(e.target.value)}
                      className="rounded-lg border border-[#E3EBE7] bg-[#F7F9F7] px-2 py-1 text-xs text-[#263832]"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Overdue">Overdue</option>
                    </select>

                    <select
                      value={taskAssigneeFilter}
                      onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                      className="rounded-lg border border-[#E3EBE7] bg-[#F7F9F7] px-2 py-1 text-xs text-[#263832]"
                    >
                      <option value="ALL">All Assignees</option>
                      {deptMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredTasks.length === 0 ? (
                    <div className="rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-6 text-center text-xs text-[#82918B]">
                      No tasks found for the selected filter.
                    </div>
                  ) : (
                    filteredTasks.map((task) => {
                      const assignee = members.find((m) => m.id === task.assignedMemberId);
                      const isCompleted = task.status === 'Completed';

                      return (
                        <div
                          key={task.id}
                          className="rounded-2xl border border-[#E3EBE7] bg-white p-3.5 shadow-2xs space-y-2 hover:border-[#2FC3A5] transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-[#263832]">{task.title}</span>

                            <select
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                              className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border ${
                                task.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : task.status === 'In Progress'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#637d74] pt-2 border-t border-[#E3EBE7]/50">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-[#2FC3A5]" />
                              <span>{assignee ? assignee.name : 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <Clock className="h-3 w-3 text-[#82918B]" />
                              <span>Due {task.deadline}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Department Roster */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#263832] uppercase tracking-wider">
                    Hub Roster ({deptMembers.length})
                  </h4>
                  <span className="text-[10px] text-[#82918B]">Click any member to inspect portfolio & metrics</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {deptMembers.map((m) => {
                    const mTasks = tasks.filter(
                      (t) => t.departmentId === selectedDept.id && t.assignedMemberId === m.id
                    );
                    const mDone = mTasks.filter((t) => t.status === 'Completed').length;
                    const mRate =
                      mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0;

                    return (
                      <div
                        key={m.id}
                        onClick={() => setInspectingMember(m)}
                        className="cursor-pointer flex items-center justify-between gap-2.5 rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 hover:bg-white hover:border-[#2FC3A5] hover:shadow-xs transition select-none group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={
                              m.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                            }
                            alt={m.name}
                            className="h-9 w-9 rounded-xl object-cover border border-[#E3EBE7] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-[#263832] group-hover:text-[#0D5143]">
                              {m.name}
                            </div>
                            <div className="truncate text-[10px] text-[#0D5143] font-semibold">
                              {m.roleTitle}
                            </div>
                            <div className="text-[10px] text-[#82918B] font-mono">{m.memberId}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-[#0D5143] bg-[#E7F3D7] px-2 py-0.5 rounded-full block">
                            {mRate}% Tasks
                          </span>
                          <span className="text-[9px] text-[#82918B] block mt-0.5">
                            {mDone}/{mTasks.length} Done
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Linked Meetings & MoMs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E3EBE7] text-xs">
                <div className="rounded-2xl border border-[#E3EBE7] p-3.5">
                  <div className="font-bold text-[#263832] mb-1">Scheduled Meetings</div>
                  <div className="text-sm font-black text-[#2FC3A5]">{deptMeetings.length} Syncs</div>
                  <Link href="/calendar" className="text-[10px] font-bold text-[#0D5143] hover:underline mt-1 block">
                    View in Calendar &rarr;
                  </Link>
                </div>

                <div className="rounded-2xl border border-[#E3EBE7] p-3.5">
                  <div className="font-bold text-[#263832] mb-1">Published MoMs</div>
                  <div className="text-sm font-black text-[#0D5143]">{deptMoms.length} Records</div>
                  <Link href="/moms" className="text-[10px] font-bold text-[#0D5143] hover:underline mt-1 block">
                    View MoM Records &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MEMBER HUB PORTFOLIO & PROGRESS MODAL ==================== */}
      {inspectingMember && inspectingMemberStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E3EBE7] bg-white shadow-2xl overflow-hidden">
            {/* Modal Header Banner */}
            <div className="h-24 w-full bg-gradient-to-r from-[#DDF7EF] via-[#E7F3D7] to-[#F7F9F7] p-4 relative flex items-start justify-between">
              <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-[#0D5143] shadow-xs">
                {selectedDept?.name} • Member Portfolio
              </span>
              <button
                onClick={() => setInspectingMember(null)}
                className="rounded-full bg-white/80 p-1.5 text-[#637d74] hover:text-[#263832] transition shadow-xs"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Bar */}
            <div className="px-6 pb-2 -mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="flex items-end gap-3.5">
                <img
                  src={
                    inspectingMember.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                  }
                  alt={inspectingMember.name}
                  className="h-20 w-20 rounded-2xl border-4 border-white bg-white object-cover shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#263832]">{inspectingMember.name}</h3>
                    <span className="rounded-full bg-[#E7F3D7] px-2 py-0.5 text-[10px] font-bold text-[#0D5143]">
                      {inspectingMember.membershipStatus || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#2FC3A5]">{inspectingMember.roleTitle}</div>
                  <div className="text-[11px] font-mono text-[#82918B]">{inspectingMember.memberId}</div>
                </div>
              </div>

              {inspectingMember.email && (
                <a
                  href={`mailto:${inspectingMember.email}`}
                  className="flex items-center gap-1.5 rounded-xl border border-[#2FC3A5] bg-white px-3 py-1.5 text-xs font-bold text-[#0D5143] hover:bg-[#DDF7EF] transition shadow-xs self-start sm:self-end"
                >
                  <Mail className="h-3.5 w-3.5 text-[#2FC3A5]" />
                  <span>Send Email</span>
                </a>
              )}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Bio Statement if present */}
              {inspectingMember.bio && (
                <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-xs text-[#637d74] leading-relaxed">
                  "{inspectingMember.bio}"
                </div>
              )}

              {/* Quick Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                {/* 1. Hub Task Progress */}
                <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                  <div className="text-[10px] font-bold uppercase text-[#82918B]">Tasks in Hub</div>
                  <div className="text-lg font-black text-[#0D5143] mt-0.5">
                    {inspectingMemberStats.taskRate}% Done
                  </div>
                  <div className="text-[10px] text-[#637d74]">
                    {inspectingMemberStats.completedDeptTasks.length}/
                    {inspectingMemberStats.memberDeptTasks.length} Completed
                  </div>
                </div>

                {/* 2. Hub Attendance */}
                <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                  <div className="text-[10px] font-bold uppercase text-[#82918B]">Sync Attendance</div>
                  <div className="text-lg font-black text-[#2FC3A5] mt-0.5">
                    {inspectingMemberStats.attendanceRate}%
                  </div>
                  <div className="text-[10px] text-[#637d74]">
                    {inspectingMemberStats.attendedCount}/
                    {inspectingMemberStats.eligibleMeetings.length} Attended
                  </div>
                </div>

                {/* 3. Recorded Hours */}
                <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                  <div className="text-[10px] font-bold uppercase text-[#82918B]">Recorded Hours</div>
                  <div className="text-lg font-black text-[#263832] mt-0.5">
                    {inspectingMemberStats.recordedHours} hrs
                  </div>
                  <div className="text-[10px] text-[#637d74]">
                    of {inspectingMemberStats.scheduledHours} hrs sched.
                  </div>
                </div>

                {/* 4. Academic Details */}
                <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3">
                  <div className="text-[10px] font-bold uppercase text-[#82918B]">Academic Year</div>
                  <div className="text-lg font-black text-[#263832] mt-0.5">
                    Sem {inspectingMember.currentSemester}
                  </div>
                  <div className="text-[10px] text-[#637d74] truncate">
                    {inspectingMember.branch}
                  </div>
                </div>
              </div>

              {/* Task Deliverables Breakdown with Progress Bar */}
              <div className="rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#263832] uppercase tracking-wider">
                      Department Assigned Tasks ({inspectingMemberStats.memberDeptTasks.length})
                    </h4>
                    <span className="text-[11px] text-[#82918B]">
                      {inspectingMemberStats.completedDeptTasks.length} tasks completed •{' '}
                      {inspectingMemberStats.inProgressDeptTasks.length} in progress
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#0D5143] bg-[#E7F3D7] px-2.5 py-0.5 rounded-full">
                    {inspectingMemberStats.taskRate}% Complete
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-[#E3EBE7] overflow-hidden">
                  <div
                    className="h-full bg-[#2FC3A5] rounded-full transition-all duration-500"
                    style={{ width: `${inspectingMemberStats.taskRate}%` }}
                  />
                </div>

                <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                  {inspectingMemberStats.memberDeptTasks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#82918B] bg-[#F7F9F7] rounded-xl">
                      No deliverables currently assigned in this hub.
                    </div>
                  ) : (
                    inspectingMemberStats.memberDeptTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[#263832] truncate">{t.title}</div>
                          <div className="text-[10px] text-[#82918B] flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3 text-[#2FC3A5]" />
                            <span>Deadline: {t.deadline}</span>
                          </div>
                        </div>

                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                            t.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : t.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Attendance Breakdown & Quorum Status */}
              <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#263832] uppercase tracking-wider text-[11px]">
                    Meeting Attendance Record
                  </h4>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      inspectingMemberStats.attendanceRate >= 75
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inspectingMemberStats.attendanceRate >= 75
                      ? '✓ Quorum Compliant'
                      : '⚠ Short Attendance'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl bg-white p-2 border border-[#E3EBE7]">
                    <span className="text-[10px] text-[#82918B] block">Present</span>
                    <span className="font-bold text-[#0D5143]">
                      {inspectingMemberStats.presentCount}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white p-2 border border-[#E3EBE7]">
                    <span className="text-[10px] text-[#82918B] block">Late</span>
                    <span className="font-bold text-amber-700">
                      {inspectingMemberStats.lateCount}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white p-2 border border-[#E3EBE7]">
                    <span className="text-[10px] text-[#82918B] block">Excused</span>
                    <span className="font-bold text-blue-700">
                      {inspectingMemberStats.excusedCount}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white p-2 border border-[#E3EBE7]">
                    <span className="text-[10px] text-[#82918B] block">Absent</span>
                    <span className="font-bold text-rose-700">
                      {inspectingMemberStats.absentCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attended Published MoMs in this Hub */}
              {inspectingMemberStats.attendedMOMs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#263832]">
                    Attended Published MoMs ({inspectingMemberStats.attendedMOMs.length})
                  </h4>
                  <div className="space-y-1.5">
                    {inspectingMemberStats.attendedMOMs.map((mom) => (
                      <div
                        key={mom.id}
                        className="flex items-center justify-between rounded-xl border border-[#E3EBE7] bg-white p-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-[#263832] block truncate">{mom.title}</span>
                          <span className="text-[10px] text-[#82918B]">{mom.meetingDate}</span>
                        </div>
                        <Link
                          href="/moms"
                          className="text-[10px] font-bold text-[#0D5143] hover:underline"
                        >
                          View MoM &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#263832] mb-1">Configure New Hub</h3>
            <form onSubmit={handleCreateDepartment} className="space-y-3 mt-3">
              <div>
                <label className="text-xs font-semibold text-[#263832]">Department Name *</label>
                <input
                  required
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Impact Assessment"
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Description</label>
                <textarea
                  rows={3}
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Scope, key operations, and deliverables..."
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="rounded-xl border border-[#E3EBE7] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#2FC3A5] px-4 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditDeptModal && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#E3EBE7] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#263832] mb-1">Edit Hub: {selectedDept.name}</h3>
            <form onSubmit={handleUpdateDepartmentSubmit} className="space-y-3 mt-3">
              <div>
                <label className="text-xs font-semibold text-[#263832]">Department Name *</label>
                <input
                  required
                  type="text"
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Description</label>
                <textarea
                  rows={3}
                  value={editDeptDesc}
                  onChange={(e) => setEditDeptDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditDeptModal(false)}
                  className="rounded-xl border border-[#E3EBE7] px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#2FC3A5] px-4 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
