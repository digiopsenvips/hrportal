import { Member, RoleType } from '@/types';

export interface UserPermissions {
  isPresident: boolean;
  isVP: boolean;
  isSecretary: boolean;
  isHRHead: boolean;
  isDeptHead: boolean;
  isSecondaryHR: boolean;
  isGeneralMember: boolean;

  canManageAllDepartments: boolean;
  canManageAssignedDepartment: boolean;
  canManageHRTeam: boolean;
  canManageMembers: boolean;
  canViewSensitiveMemberData: boolean;
  canCreateMOM: boolean;
  canReviewMOM: boolean;
  canPublishMOM: boolean;
  canViewConfidentialMOMs: boolean;
  canMarkAttendance: boolean;
  canEditAttendance: boolean;
  canReviewAttendanceCorrections: boolean;
  canManageTasks: boolean;
  canVerifyTasks: boolean;
  canAccessHRLeaderboard: boolean;
  canConfigureSocietySettings: boolean;
  canPostAnnouncements: boolean;
  canScheduleMeetings: boolean;
}

export function getPermissions(member: Member | null): UserPermissions {
  if (!member) {
    return {
      isPresident: false,
      isVP: false,
      isSecretary: false,
      isHRHead: false,
      isDeptHead: false,
      isSecondaryHR: false,
      isGeneralMember: true,
      canManageAllDepartments: false,
      canManageAssignedDepartment: false,
      canManageHRTeam: false,
      canManageMembers: false,
      canViewSensitiveMemberData: false,
      canCreateMOM: false,
      canReviewMOM: false,
      canPublishMOM: false,
      canViewConfidentialMOMs: false,
      canMarkAttendance: false,
      canEditAttendance: false,
      canReviewAttendanceCorrections: false,
      canManageTasks: false,
      canVerifyTasks: false,
      canAccessHRLeaderboard: false,
      canConfigureSocietySettings: false,
      canPostAnnouncements: false,
      canScheduleMeetings: false,
    };
  }

  const role = member.role;
  const isPresident = role === 'president';
  const isVP = role === 'vp_1' || role === 'vp_2' || role === 'vp_3';
  const isSecretary = role === 'secretary';
  const isHRHead = role === 'hr_head';
  const isDeptHead = role === 'dept_head';
  const isSecondaryHR = role === 'secondary_hr';
  const isGeneralMember = role === 'general_member';

  const isCoreLeadership = isPresident || isVP || isSecretary;
  const isHRLeadership = isPresident || isHRHead;

  return {
    isPresident,
    isVP,
    isSecretary,
    isHRHead,
    isDeptHead,
    isSecondaryHR,
    isGeneralMember,

    canManageAllDepartments: isPresident || isVP,
    canManageAssignedDepartment: isPresident || isVP || isDeptHead || isSecondaryHR,
    canManageHRTeam: isHRLeadership,
    canManageMembers: isPresident || isHRHead || isSecretary,
    canViewSensitiveMemberData: isPresident || isHRHead || isSecretary,
    canCreateMOM: isPresident || isSecretary || isHRHead || isDeptHead || isSecondaryHR,
    canReviewMOM: isPresident || isVP || isSecretary || isHRHead || isDeptHead,
    canPublishMOM: isPresident || isSecretary || isHRHead || isDeptHead,
    canViewConfidentialMOMs: isPresident || isVP || isSecretary || isHRHead,
    canMarkAttendance: isPresident || isHRHead || isDeptHead || isSecondaryHR || isSecretary,
    canEditAttendance: isPresident || isHRHead || isDeptHead || isSecondaryHR,
    canReviewAttendanceCorrections: isPresident || isHRHead || isDeptHead,
    canManageTasks: isPresident || isVP || isSecretary || isHRHead || isDeptHead || isSecondaryHR,
    canVerifyTasks: isPresident || isHRHead || isDeptHead || isSecretary,
    canAccessHRLeaderboard: true, // Transparent society-wide viewing
    canConfigureSocietySettings: isPresident || isHRHead,
    canPostAnnouncements: isPresident || isVP || isSecretary || isHRHead || isDeptHead,
    canScheduleMeetings: isPresident || isVP || isSecretary || isHRHead || isDeptHead || isSecondaryHR,
  };
}

export function canAccessDepartment(member: Member, departmentId: string): boolean {
  if (!member) return false;
  if (['president', 'vp_1', 'vp_2', 'vp_3', 'secretary', 'hr_head'].includes(member.role)) {
    return true;
  }
  return (
    member.primaryDepartmentId === departmentId ||
    member.assignedDepartmentId === departmentId ||
    member.additionalDepartmentId === departmentId
  );
}
