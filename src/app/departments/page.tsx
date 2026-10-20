'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Department, Member } from '@/types';
import {
  Building2,
  Users,
  Calendar,
  FileText,
  CheckSquare,
  ClipboardCheck,
  Plus,
  Edit,
  Shield,
  Clock,
  ArrowRight,
  X,
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
    addDepartment,
    updateDepartment,
  } = useData();

  const [activeDeptId, setActiveDeptId] = useState<string>(departments[0]?.id || 'digital-operations');
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);

  // Form states
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newDeptColor, setNewDeptColor] = useState('#6366F1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptDesc, setEditDeptDesc] = useState('');
  const [editHeadId, setEditHeadId] = useState('');
  const [editSecondaryHrId, setEditSecondaryHrId] = useState('');

  const activeDepartment = departments.find((d) => d.id === activeDeptId) || departments[0];

  // Members in active department
  const deptMembers = members.filter(
    (m) => m.primaryDepartmentId === activeDepartment?.id || m.assignedDepartmentId === activeDepartment?.id
  );

  // Leadership in active department
  const deptHead = members.find(
    (m) =>
      (m.role === 'dept_head' || m.roleTitle.toLowerCase().includes('head')) &&
      (m.assignedDepartmentId === activeDepartment?.id || m.primaryDepartmentId === activeDepartment?.id)
  );

  const secondaryHr = members.find(
    (m) =>
      m.role === 'secondary_hr' &&
      (m.assignedDepartmentId === activeDepartment?.id || m.primaryDepartmentId === activeDepartment?.id)
  );

  // Meetings in active department
  const deptMeetings = meetings.filter((m) => m.departmentId === activeDepartment?.id);

  // MOMs in active department
  const deptMoms = moms.filter((m) => m.departmentId === activeDepartment?.id);

  // Tasks in active department
  const deptTasks = tasks.filter((t) => t.departmentId === activeDepartment?.id);
  const completedDeptTasks = deptTasks.filter((t) => t.status === 'Completed');

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
    } else {
      alert(res.error || 'Failed to add department');
    }
  };

  const handleEditDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDepartment) return;
    setIsSubmitting(true);

    const res = await updateDepartment({
      id: activeDepartment.id,
      name: editDeptName || activeDepartment.name,
      description: editDeptDesc || activeDepartment.description,
      headMemberId: editHeadId || activeDepartment.headMemberId,
      secondaryHrMemberId: editSecondaryHrId || activeDepartment.secondaryHrMemberId,
    });

    setIsSubmitting(false);
    if (res.success) {
      setShowEditDeptModal(false);
    } else {
      alert(res.error || 'Failed to update department');
    }
  };

  const openEditModal = () => {
    if (!activeDepartment) return;
    setEditDeptName(activeDepartment.name);
    setEditDeptDesc(activeDepartment.description);
    setEditHeadId(activeDepartment.headMemberId || '');
    setEditSecondaryHrId(activeDepartment.secondaryHrMemberId || '');
    setShowEditDeptModal(true);
  };

  if (!activeDepartment) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-amber-400" />
            <span>Independent Department Hubs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            8 autonomous society departments with dedicated heads, secondary HR representatives, and synced task workflows
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canConfigureSocietySettings && (
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Configure / Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Department Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {departments.map((dept) => {
          const isActive = dept.id === activeDepartment.id;
          return (
            <button
              key={dept.id}
              onClick={() => setActiveDeptId(dept.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap border ${
                isActive
                  ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: isActive ? '#0F172A' : dept.color }}
              />
              <span>{dept.name}</span>
              {dept.isCustom && (
                <span className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[9px] text-amber-300">
                  Custom
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Department Hub Detail */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:p-8 shadow-2xl space-y-6">
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: activeDepartment.color }}
              />
              <h2 className="text-2xl font-black text-white">{activeDepartment.name}</h2>
              {activeDepartment.isCustom && (
                <span className="rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 border border-indigo-500/30">
                  8th Configured Department
                </span>
              )}
            </div>
            <p className="mt-2 text-xs md:text-sm text-slate-300 max-w-2xl">
              {activeDepartment.description}
            </p>
          </div>

          {permissions.canConfigureSocietySettings && (
            <button
              onClick={openEditModal}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:border-amber-400 hover:text-white"
            >
              <Edit className="h-3.5 w-3.5 text-amber-400" />
              <span>Edit Department Details</span>
            </button>
          )}
        </div>

        {/* Leadership Duo Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Department Head Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-4">
            <img
              src={deptHead?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={deptHead?.name || 'Head'}
              className="h-14 w-14 rounded-2xl border-2 border-emerald-400/50 object-cover shrink-0"
            />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Department Head
              </div>
              <div className="font-bold text-white text-base">{deptHead?.name || 'Unassigned'}</div>
              <div className="text-xs text-slate-400">{deptHead?.roleTitle || 'Department Lead'}</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">{deptHead?.email}</div>
            </div>
          </div>

          {/* Secondary HR Representative Card */}
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 flex items-center gap-4">
            <img
              src={secondaryHr?.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'}
              alt={secondaryHr?.name || 'Secondary HR'}
              className="h-14 w-14 rounded-2xl border-2 border-rose-400/50 object-cover shrink-0"
            />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                Assigned Secondary HR (From HR Team)
              </div>
              <div className="font-bold text-white text-base">{secondaryHr?.name || 'Unassigned'}</div>
              <div className="text-xs text-slate-400">{secondaryHr?.roleTitle || 'Secondary HR'}</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">{secondaryHr?.email}</div>
            </div>
          </div>
        </div>

        {/* Department Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3 text-center">
            <div className="text-xs text-slate-400">Department Members</div>
            <div className="text-xl font-black text-white">{deptMembers.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3 text-center">
            <div className="text-xs text-slate-400">Meetings Held</div>
            <div className="text-xl font-black text-amber-400">{deptMeetings.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3 text-center">
            <div className="text-xs text-slate-400">Official MOMs</div>
            <div className="text-xl font-black text-blue-400">{deptMoms.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3 text-center">
            <div className="text-xs text-slate-400">Tasks Completed</div>
            <div className="text-xl font-black text-emerald-400">{completedDeptTasks.length} / {deptTasks.length}</div>
          </div>
        </div>

        {/* Department Members List */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            Department Roster ({deptMembers.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {deptMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-800/30 p-3"
              >
                <img
                  src={m.avatar}
                  alt={m.name}
                  className="h-9 w-9 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-white">{m.name}</div>
                  <div className="truncate text-[10px] text-amber-400">{m.roleTitle}</div>
                  <div className="truncate text-[10px] text-slate-400">{m.memberId}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add / Configure 8th Department</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a new dynamic department to the society hierarchy without modifying code.
            </p>

            <form onSubmit={handleCreateDepartment} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Department Name *</label>
                <input
                  required
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Outreach & Corporate Partnerships"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Scope, key operations, and deliverables..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Brand Color</label>
                <input
                  type="color"
                  value={newDeptColor}
                  onChange={(e) => setNewDeptColor(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-700 bg-slate-800 cursor-pointer"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  {isSubmitting ? 'Adding...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Edit Department Details</h3>
            <p className="text-xs text-slate-400 mb-4">Rename department or assign Head and Secondary HR.</p>

            <form onSubmit={handleEditDepartmentSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Department Name</label>
                <input
                  type="text"
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={editDeptDesc}
                  onChange={(e) => setEditDeptDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Department Head Member</label>
                <select
                  value={editHeadId}
                  onChange={(e) => setEditHeadId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Select Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.memberId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300">Secondary HR Representative (from HR Team)</label>
                <select
                  value={editSecondaryHrId}
                  onChange={(e) => setEditSecondaryHrId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option value="">-- Select HR Member --</option>
                  {members
                    .filter((m) => m.primaryDepartmentId === 'human-resources' || m.role === 'secondary_hr')
                    .map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.roleTitle})</option>
                    ))}
                </select>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditDeptModal(false)}
                  className="rounded-xl px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  {isSubmitting ? 'Saving...' : 'Update Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
