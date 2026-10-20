'use client';

import React, { useState } from 'react';
import { Member, Department } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { calculateMemberAttendance } from '@/lib/calculations';
import {
  X,
  Shield,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  Edit,
  Save,
  Lock,
} from 'lucide-react';

interface MemberDetailModalProps {
  member: Member | null;
  onClose: () => void;
}

export function MemberDetailModal({ member, onClose }: MemberDetailModalProps) {
  const { currentUser, permissions } = useAuth();
  const { departments, tasks, meetings, attendance, settings, updateMember } = useData();

  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member?.role || 'general_member');
  const [selectedRoleTitle, setSelectedRoleTitle] = useState(member?.roleTitle || '');
  const [selectedDeptId, setSelectedDeptId] = useState(member?.primaryDepartmentId || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!member || !settings) return null;

  const department = departments.find((d) => d.id === member.primaryDepartmentId);
  const assignedDept = departments.find((d) => d.id === member.assignedDepartmentId);

  // Compute attendance summary for this member
  const attendanceStats = calculateMemberAttendance(
    member.id,
    attendance,
    meetings,
    settings
  );

  // Tasks for this member
  const memberTasks = tasks.filter((t) => t.assignedMemberId === member.id);
  const completedTasks = memberTasks.filter((t) => t.status === 'Completed');
  const pendingTasks = memberTasks.filter((t) => t.status !== 'Completed');

  // Privacy rule checking:
  // Is this authorized leadership? (President, VP, Secretary, HR Head) or the member themselves?
  const isAuthorizedToViewSensitive =
    permissions.canViewSensitiveMemberData || (currentUser && currentUser.id === member.id);

  const canEditRoles = permissions.isPresident || permissions.isHRHead;

  const handleSaveRole = async () => {
    setIsSaving(true);
    await updateMember({
      id: member.id,
      role: selectedRole,
      roleTitle: selectedRoleTitle || member.roleTitle,
      primaryDepartmentId: selectedDeptId,
    });
    setIsSaving(false);
    setIsEditingRole(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black ring-1 ring-slate-800 scrollbar-thin">
        {/* Header background banner */}
        <div className="h-28 w-full bg-gradient-to-r from-amber-500/20 via-blue-500/10 to-indigo-500/20 p-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-slate-900/80 p-2 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <img
                src={member.avatar}
                alt={member.name}
                className="h-24 w-24 rounded-2xl border-4 border-slate-900 bg-slate-800 object-cover shadow-xl"
              />
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{member.name}</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                      member.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
                <div className="text-xs font-semibold text-amber-400">{member.roleTitle}</div>
                <div className="text-xs text-slate-400 font-mono">{member.memberId}</div>
              </div>
            </div>

            {canEditRoles && (
              <button
                onClick={() => setIsEditingRole(!isEditingRole)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-amber-400 hover:text-amber-300 transition"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>{isEditingRole ? 'Cancel Edit' : 'Edit Role & Dept'}</span>
              </button>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3 text-center">
              <div className="text-xs text-slate-400">Attendance</div>
              <div className="text-lg font-black text-amber-400">{attendanceStats.percentage}%</div>
              <div className="text-[10px] text-slate-400">
                {attendanceStats.attended} / {attendanceStats.totalEligible} meetings
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3 text-center">
              <div className="text-xs text-slate-400">Tasks Completed</div>
              <div className="text-lg font-black text-emerald-400">{completedTasks.length}</div>
              <div className="text-[10px] text-slate-400">
                {pendingTasks.length} pending
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3 text-center">
              <div className="text-xs text-slate-400">Semester</div>
              <div className="text-lg font-black text-indigo-400">Sem {member.currentSemester}</div>
              <div className="text-[10px] text-slate-400">{member.academicYear}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3 text-center">
              <div className="text-xs text-slate-400">Joined Enactus</div>
              <div className="text-lg font-black text-blue-400">{member.yearOfJoining}</div>
              <div className="text-[10px] text-slate-400">VIPS-TC Chapter</div>
            </div>
          </div>

          {/* Role & Department Editor (If toggled by President/HR Head) */}
          {isEditingRole && (
            <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 animate-in fade-in">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Leadership Governance: Assign Role & Department</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-medium">Hierarchy Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                  >
                    <option value="president">President (Level 1)</option>
                    <option value="vp_1">Vice President 1 (Operations)</option>
                    <option value="vp_2">Vice President 2 (PR & External)</option>
                    <option value="vp_3">Vice President 3 (Strategy)</option>
                    <option value="secretary">Secretary (Level 3)</option>
                    <option value="hr_head">HR Department Head (Level 4)</option>
                    <option value="dept_head">Department Head (Level 5)</option>
                    <option value="secondary_hr">Secondary HR Rep (Level 6)</option>
                    <option value="general_member">General Member (Level 7)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-medium">Designation Title</label>
                  <input
                    type="text"
                    value={selectedRoleTitle}
                    onChange={(e) => setSelectedRoleTitle(e.target.value)}
                    placeholder="e.g. Head of Digital Ops"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-medium">Primary Department</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSaveRole}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Update Leadership Assignment'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Academic & Contact Details */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-800/30 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Member Credentials & Academic Records
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <GraduationCap className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400">Branch: </span>
                  <span className="font-semibold text-white">{member.branch}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400">Email: </span>
                  {settings.directoryPrivacy.hideEmailForMembers && !isAuthorizedToViewSensitive ? (
                    <span className="text-slate-400 italic">Protected [Authorized Only]</span>
                  ) : (
                    <span className="font-semibold text-white">{member.email}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400">College Enrollment: </span>
                  {settings.directoryPrivacy.hideEnrollmentForMembers && !isAuthorizedToViewSensitive ? (
                    <span className="text-slate-400 italic">Protected [HR/Leadership Only]</span>
                  ) : (
                    <span className="font-semibold text-white font-mono">{member.collegeEnrollment}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Award className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400">JEE Rank: </span>
                  {settings.directoryPrivacy.hideJeeRankForMembers && !isAuthorizedToViewSensitive ? (
                    <span className="text-slate-400 italic">Protected [HR/Leadership Only]</span>
                  ) : (
                    <span className="font-semibold text-white">
                      {member.jeeRank ? member.jeeRank.toLocaleString() : 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Member's Active Tasks */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Assigned Tasks ({memberTasks.length})
            </h3>
            {memberTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
                No tasks assigned to this member yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {memberTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{t.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {t.category} • Deadline: {t.deadline} • {t.actualEffortHours} hrs logged
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        t.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : t.status === 'In Progress'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
