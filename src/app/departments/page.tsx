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
} from 'lucide-react';

export default function DepartmentsPage() {
  const { currentUser, permissions } = useAuth();
  const {
    departments,
    members,
    meetings,
    moms,
    tasks,
    updateTask,
    addDepartment,
    updateDepartment,
    refreshAll,
  } = useData();

  // Active department selected for detail inspection
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
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
                <h4 className="text-xs font-bold text-[#263832] uppercase tracking-wider">
                  Hub Roster ({deptMembers.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {deptMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-2.5"
                    >
                      <img
                        src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={m.name}
                        className="h-8 w-8 rounded-lg object-cover border border-[#E3EBE7]"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-[#263832]">{m.name}</div>
                        <div className="truncate text-[10px] text-[#0D5143]">{m.roleTitle}</div>
                      </div>
                    </div>
                  ))}
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
