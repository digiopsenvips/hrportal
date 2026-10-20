'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '@/types';
import {
  CheckSquare,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  Layers,
  Table as TableIcon,
  ShieldAlert,
  X,
  Star,
} from 'lucide-react';

export default function TasksPage() {
  const { currentUser, permissions } = useAuth();
  const { departments, members, tasks, addTask, updateTask, refreshAll } = useData();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [verifyScore, setVerifyScore] = useState<number>(10);

  // New task form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('General Operations');
  const [newDept, setNewDept] = useState(departments[0]?.id || 'digital-operations');
  const [newAssignee, setNewAssignee] = useState(members[0]?.id || '');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
  );
  const [newEstimatedHours, setNewEstimatedHours] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchDept = filterDept === 'ALL' || t.departmentId === filterDept;
      const matchCat = filterCategory === 'ALL' || t.category === filterCategory;
      const matchAssignee = filterAssignee === 'ALL' || t.assignedMemberId === filterAssignee;
      return matchDept && matchCat && matchAssignee;
    });
  }, [tasks, filterDept, filterCategory, filterAssignee]);

  // Kanban Columns
  const kanbanColumns: { status: TaskStatus; label: string }[] = [
    { status: 'To Do', label: 'To Do' },
    { status: 'In Progress', label: 'In Progress' },
    { status: 'Under Review', label: 'Under Review' },
    { status: 'Completed', label: 'Completed (Verified)' },
  ];

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    const res = await addTask({
      title: newTitle,
      description: newDesc,
      category: newCategory,
      departmentId: newDept,
      assignedMemberId: newAssignee,
      createdById: currentUser.id,
      priority: newPriority,
      deadline: newDeadline,
      estimatedEffortHours: newEstimatedHours,
    });

    setIsSubmitting(false);
    if (res.success) {
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      await refreshAll();
    } else {
      alert(res.error || 'Failed to create task');
    }
  };

  const handleVerifyTask = async (task: Task) => {
    if (!currentUser) return;
    if (currentUser.id === task.assignedMemberId) {
      alert('Self-verification is not permitted under Enactus governance rules.');
      return;
    }

    await updateTask({
      id: task.id,
      isVerified: true,
      reviewerId: currentUser.id,
      reviewerScore: verifyScore,
      status: 'Completed',
    });
    await refreshAll();
    setSelectedTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-xs font-semibold mb-2">
            <CheckSquare className="h-3.5 w-3.5 text-[#2FC3A5]" />
            <span>Workflow & Milestone Tracking</span>
          </div>
          <h1 className="text-2xl font-black text-[#263832]">Operations & Tasks Board</h1>
          <p className="text-xs text-[#637d74] mt-1">
            Kanban workflow, effort hours tracking, peer verification, and multi-factor leaderboard input
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-[#E3EBE7] bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`rounded-lg p-2 text-xs transition ${
                viewMode === 'kanban' ? 'bg-[#2FC3A5] text-white shadow-xs' : 'text-[#637d74] hover:text-[#263832]'
              }`}
              title="Kanban Board"
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg p-2 text-xs transition ${
                viewMode === 'table' ? 'bg-[#2FC3A5] text-white shadow-xs' : 'text-[#637d74] hover:text-[#263832]'
              }`}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

          {permissions.canManageTasks && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#2FC3A5] hover:bg-[#28af94] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-[#E3EBE7] bg-white p-4 shadow-sm">
        <div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
          >
            <option value="ALL">All Task Categories</option>
            <option value="MOM Preparation">MOM Preparation</option>
            <option value="Attendance Management">Attendance Management</option>
            <option value="Meeting Coordination">Meeting Coordination</option>
            <option value="Event Planning">Event Planning</option>
            <option value="Member Database Updates">Member Database Updates</option>
            <option value="Communication">Communication</option>
            <option value="General Operations">General Operations</option>
            <option value="Technical">Technical</option>
          </select>
        </div>

        <div>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
          >
            <option value="ALL">All Assignees</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.roleTitle})</option>
            ))}
          </select>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status);

            return (
              <div
                key={col.status}
                className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-4 flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E3EBE7] mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#263832]">
                    {col.label}
                  </span>
                  <span className="rounded-full bg-white border border-[#E3EBE7] px-2 py-0.5 text-[10px] font-bold text-[#0D5143]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#8a9e96]">
                      No tasks in this lane.
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const assignee = members.find((m) => m.id === task.assignedMemberId);

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="rounded-xl border border-[#E3EBE7] bg-white p-3.5 shadow-sm hover:border-[#2FC3A5] hover:shadow transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-[10px] mb-1.5">
                            <span className="rounded-md bg-[#E7F3D7] px-1.5 py-0.5 font-bold text-[#0D5143]">
                              {task.category}
                            </span>
                            <span
                              className={`font-semibold ${
                                task.priority === 'Urgent'
                                  ? 'text-red-600'
                                  : task.priority === 'High'
                                  ? 'text-amber-600'
                                  : 'text-[#637d74]'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-[#263832] line-clamp-2">{task.title}</h4>

                          <p className="mt-1 text-[11px] text-[#637d74] line-clamp-2">
                            {task.description}
                          </p>

                          <div className="mt-3 pt-2 border-t border-[#E3EBE7] flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <img
                                src={assignee?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                                alt={assignee?.name || 'Assignee'}
                                className="h-5 w-5 rounded-full object-cover border border-[#E3EBE7]"
                              />
                              <span className="text-[#263832] font-semibold truncate max-w-[80px]">
                                {assignee?.name}
                              </span>
                            </div>

                            <span className="text-[#8a9e96]">
                              {task.actualEffortHours}h / {task.estimatedEffortHours}h
                            </span>
                          </div>

                          {task.isVerified && (
                            <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-[#0D5143] bg-[#E7F3D7] px-2 py-0.5 rounded-full">
                              <CheckCircle className="h-3 w-3 text-[#2FC3A5]" />
                              <span>Verified ({task.reviewerScore || 10}/10)</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-[#E3EBE7] bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#263832]">
              <thead className="border-b border-[#E3EBE7] bg-[#F7F9F7] uppercase text-[10px] font-bold text-[#637d74]">
                <tr>
                  <th className="px-4 py-3.5">Task Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Assignee</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Deadline</th>
                  <th className="px-4 py-3.5">Effort</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EBE7]">
                {filteredTasks.map((t) => {
                  const assignee = members.find((m) => m.id === t.assignedMemberId);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="hover:bg-[#F7F9F7] cursor-pointer transition"
                    >
                      <td className="px-4 py-3.5 font-bold text-[#263832]">{t.title}</td>
                      <td className="px-4 py-3.5 text-[#0D5143] font-semibold">{t.category}</td>
                      <td className="px-4 py-3.5 text-[#263832]">{assignee?.name}</td>
                      <td className="px-4 py-3.5 text-[#637d74]">{t.departmentId}</td>
                      <td className="px-4 py-3.5 text-[#637d74]">{t.deadline}</td>
                      <td className="px-4 py-3.5 font-mono">{t.actualEffortHours}h / {t.estimatedEffortHours}h</td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-[#E7F3D7] px-2.5 py-0.5 text-[10px] font-bold text-[#0D5143]">
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {t.isVerified ? (
                          <span className="text-[#0D5143] font-bold text-[10px] bg-[#E7F3D7] px-2 py-0.5 rounded-full">
                            Verified ✓
                          </span>
                        ) : (
                          <span className="text-[#8a9e96] text-[10px]">Unverified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Detail & Verification Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-[#E3EBE7] bg-white p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E3EBE7] pb-3 mb-4">
              <span className="rounded-full bg-[#E7F3D7] text-[#0D5143] px-3 py-1 text-xs font-bold">
                {selectedTask.category}
              </span>
              <button onClick={() => setSelectedTask(null)} className="text-[#8a9e96] hover:text-[#263832]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-[#263832]">{selectedTask.title}</h3>
            <p className="mt-2 text-xs text-[#637d74] leading-relaxed">{selectedTask.description}</p>

            <div className="mt-4 rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 space-y-2 text-xs text-[#263832]">
              <div>Assigned to: <strong className="text-[#263832]">{members.find((m) => m.id === selectedTask.assignedMemberId)?.name}</strong></div>
              <div>Deadline: <strong className="text-[#0D5143]">{selectedTask.deadline}</strong></div>
              <div>Effort: <strong className="text-[#263832]">{selectedTask.actualEffortHours} hrs logged</strong> (Estimated: {selectedTask.estimatedEffortHours} hrs)</div>
              {selectedTask.completionEvidence && (
                <div className="border-t border-[#E3EBE7] pt-2">
                  <span className="text-[#637d74] font-bold">Completion Evidence:</span>
                  <p className="mt-1 text-[#263832]">{selectedTask.completionEvidence}</p>
                </div>
              )}
            </div>

            {/* Verification Form (Leadership only, no self-verification) */}
            {permissions.canVerifyTasks && selectedTask.status === 'Completed' && !selectedTask.isVerified && (
              <div className="mt-4 border-t border-[#E3EBE7] pt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0D5143] mb-2 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#2FC3A5]" />
                  <span>Verify Task & Assign Reviewer Quality Score</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-[#263832]">Score (1-10):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={verifyScore}
                    onChange={(e) => setVerifyScore(Number(e.target.value))}
                    className="w-20 rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                  <button
                    onClick={() => handleVerifyTask(selectedTask)}
                    className="flex-1 rounded-xl bg-[#2FC3A5] py-2 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-xs"
                  >
                    Verify & Credit Leaderboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#E3EBE7] bg-white p-6 md:p-8 shadow-2xl">
            <h3 className="text-base font-bold text-[#263832] mb-1">Create New Operations Task</h3>
            <p className="text-xs text-[#637d74] mb-4">Assign work responsibility with category, estimated effort, and deadline.</p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#263832]">Task Title *</label>
                <input
                  required
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Draft Q3 Attendance Audit Report"
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Details and expected deliverables..."
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    <option value="MOM Preparation">MOM Preparation</option>
                    <option value="Attendance Management">Attendance Management</option>
                    <option value="Meeting Coordination">Meeting Coordination</option>
                    <option value="Event Planning">Event Planning</option>
                    <option value="Member Database Updates">Member Database Updates</option>
                    <option value="Communication">Communication</option>
                    <option value="General Operations">General Operations</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Department *</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Assignee *</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.roleTitle})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#263832]">Estimated Effort (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={newEstimatedHours}
                    onChange={(e) => setNewEstimatedHours(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#263832]">Deadline *</label>
                <input
                  required
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-2 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#637d74] hover:bg-[#F7F9F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#2FC3A5] px-5 py-2 text-xs font-bold text-white hover:bg-[#28af94] transition shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
