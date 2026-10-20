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
  const { departments, tasks, meetings, attendance, settings, updateMember, refreshAll } = useData();

  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member?.role || 'general_member');
  const [selectedRoleTitle, setSelectedRoleTitle] = useState(member?.roleTitle || '');
  const [selectedDeptId, setSelectedDeptId] = useState(member?.primaryDepartmentId || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!member || !settings) return null;

  const department = departments.find((d) => d.id === member.primaryDepartmentId);

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
    await refreshAll();
    setIsSaving(false);
    setIsEditingRole(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#E3EBE7] bg-white shadow-2xl scrollbar-thin">
        {/* Header background banner */}
        <div className="h-28 w-full bg-gradient-to-r from-[#DDF7EF] via-[#E7F3D7] to-[#F7F9F7] p-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/80 p-2 text-[#637d74] hover:text-[#263832] transition shadow-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <img
                src={member.avatar}
                alt={member.name}
                className="h-24 w-24 rounded-2xl border-4 border-white bg-[#F7F9F7] object-cover shadow-md"
              />
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#263832]">{member.name}</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                      member.approvalStatus === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : member.membershipStatus === 'SUSPENDED'
                        ? 'bg-orange-100 text-orange-800'
                        : member.membershipStatus === 'TERMINATED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-[#E7F3D7] text-[#0D5143]'
                    }`}
                  >
                    {member.approvalStatus === 'PENDING'
                      ? 'Pending Approval'
                      : member.membershipStatus || member.status}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#2FC3A5]">{member.roleTitle}</div>
                <div className="text-xs text-[#8a9e96] font-mono">{member.memberId}</div>
              </div>
            </div>

            {canEditRoles && (
              <button
                onClick={() => setIsEditingRole(!isEditingRole)}
                className="flex items-center gap-1.5 rounded-xl border border-[#E3EBE7] bg-[#F7F9F7] px-3 py-1.5 text-xs font-semibold text-[#263832] hover:border-[#2FC3A5] hover:text-[#2FC3A5] transition shadow-sm"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>{isEditingRole ? 'Cancel' : 'Edit Role & Dept'}</span>
              </button>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-center">
              <div className="text-[11px] font-semibold text-[#637d74]">Attendance</div>
              <div className="text-lg font-black text-[#2FC3A5]">{attendanceStats.percentage}%</div>
              <div className="text-[10px] text-[#8a9e96]">
                {attendanceStats.attended} / {attendanceStats.totalEligible} meetings
              </div>
            </div>
            <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-center">
              <div className="text-[11px] font-semibold text-[#637d74]">Tasks Completed</div>
              <div className="text-lg font-black text-[#0D5143]">{completedTasks.length}</div>
              <div className="text-[10px] text-[#8a9e96]">
                {pendingTasks.length} pending
              </div>
            </div>
            <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-center">
              <div className="text-[11px] font-semibold text-[#637d74]">Semester</div>
              <div className="text-lg font-black text-[#263832]">Sem {member.currentSemester}</div>
              <div className="text-[10px] text-[#8a9e96]">{member.academicYear}</div>
            </div>
            <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-3 text-center">
              <div className="text-[11px] font-semibold text-[#637d74]">Joined Society</div>
              <div className="text-lg font-black text-[#263832]">{member.yearOfJoining}</div>
              <div className="text-[10px] text-[#8a9e96]">VIPS-TC Chapter</div>
            </div>
          </div>

          {/* Role & Department Editor (If toggled by President/HR Head) */}
          {isEditingRole && (
            <div className="mt-4 rounded-2xl border border-[#2FC3A5] bg-[#DDF7EF]/40 p-4 animate-fadeIn">
              <div className="text-xs font-bold uppercase tracking-wider text-[#0D5143] mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#2FC3A5]" />
                <span>Leadership Governance: Assign Role & Department</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#263832] font-semibold">Hierarchy Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-white px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
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
                  <label className="text-[11px] text-[#263832] font-semibold">Designation Title</label>
                  <input
                    type="text"
                    value={selectedRoleTitle}
                    onChange={(e) => setSelectedRoleTitle(e.target.value)}
                    placeholder="e.g. Head of Digital Ops"
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-white px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#263832] font-semibold">Primary Department</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#E3EBE7] bg-white px-3 py-1.5 text-xs text-[#263832] focus:outline-none focus:border-[#2FC3A5]"
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
                  className="flex items-center gap-2 rounded-xl bg-[#2FC3A5] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#28af94] shadow-sm transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Update Assignment'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Academic & Contact Details */}
          <div className="mt-6 rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#637d74] mb-3">
              Member Credentials & Academic Records
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-[#263832]">
                <GraduationCap className="h-4 w-4 text-[#2FC3A5] shrink-0" />
                <div>
                  <span className="text-[#637d74]">Branch: </span>
                  <span className="font-semibold">{member.branch}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[#263832]">
                <Mail className="h-4 w-4 text-[#2FC3A5] shrink-0" />
                <div className="truncate">
                  <span className="text-[#637d74]">Email: </span>
                  {settings.directoryPrivacy.hideEmailForMembers && !isAuthorizedToViewSensitive ? (
                    <span className="text-[#8a9e96] italic">Protected [Authorized Only]</span>
                  ) : (
                    <span className="font-semibold">{member.email}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[#263832]">
                <Lock className="h-4 w-4 text-[#2FC3A5] shrink-0" />
                <div>
                  <span className="text-[#637d74]">College Enrollment: </span>
                  {settings.directoryPrivacy.hideEnrollmentForMembers && !isAuthorizedToViewSensitive ? (
                    <span className="text-[#8a9e96] italic">Protected [HR Only]</span>
                  ) : (
                    <span className="font-semibold font-mono">{member.collegeEnrollment || 'N/A'}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[#263832]">
                <Award className="h-4 w-4 text-[#2FC3A5] shrink-0" />
                <div>
                  <span className="text-[#637d74]">JEE Rank: </span>
                  {settings.directoryPrivacy.hideJeeRankForMembers && !isAuthorizedToViewSensitive ? (
                    <span className="text-[#8a9e96] italic">Protected [HR Only]</span>
                  ) : (
                    <span className="font-semibold">
                      {member.jeeRank ? member.jeeRank.toLocaleString() : 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Member's Assigned Tasks */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#637d74] mb-3">
              Assigned Tasks ({memberTasks.length})
            </h3>
            {memberTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E3EBE7] p-4 text-center text-xs text-[#8a9e96]">
                No tasks assigned to this member yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {memberTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-[#E3EBE7] bg-white p-3 shadow-xs"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#263832]">{t.title}</div>
                      <div className="text-[10px] text-[#637d74]">
                        {t.category} • Deadline: {t.deadline} • {t.actualEffortHours} hrs logged
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        t.status === 'Completed'
                          ? 'bg-[#E7F3D7] text-[#0D5143]'
                          : t.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
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
