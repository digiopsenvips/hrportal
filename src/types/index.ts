export type RoleType =
  | 'president'
  | 'vp_1'
  | 'vp_2'
  | 'vp_3'
  | 'secretary'
  | 'hr_head'
  | 'dept_head'
  | 'secondary_hr'
  | 'general_member';

export interface Department {
  id: string;
  name: string;
  description: string;
  headMemberId?: string;
  secondaryHrMemberId?: string;
  isActive: boolean;
  color: string;
  isCustom?: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  memberId: string; // e.g. ENVIPS-2024-001
  name: string;
  email: string;
  passwordHash?: string;
  avatar: string;
  collegeEnrollment: string;
  jeeRank?: number | null;
  currentSemester: number;
  academicYear: string;
  branch: string;
  yearOfJoining: number;
  primaryDepartmentId: string;
  additionalDepartmentId?: string | null;
  role: RoleType;
  roleTitle: string; // e.g. "President", "Vice President - Operations", "Head of Digital Operations"
  assignedDepartmentId?: string | null; // For Secondary HR or Dept Head
  assignedSecondaryHrId?: string | null; // For Members
  status: 'Active' | 'Inactive' | 'Alumni' | 'On Leave';
  phone?: string;
  bio?: string;
  createdAt: string;
}

export type MeetingMode = 'Online' | 'Offline' | 'Hybrid';
export type MeetingStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';

export interface Meeting {
  id: string;
  title: string;
  departmentId: string; // 'ALL' or department ID
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  mode: MeetingMode;
  location: string;
  agenda: string;
  objectives: string;
  organizerId: string;
  attendeeMemberIds: string[];
  status: MeetingStatus;
  meetingLink?: string;
  hasMom?: boolean;
  createdAt: string;
}

export type MOMStatus = 'Draft' | 'Pending Review' | 'Published' | 'Confidential';

export interface MOMDiscussionPoint {
  id: string;
  topic: string;
  notes: string;
}

export interface MOMDecision {
  id: string;
  decision: string;
}

export interface MOMActionItem {
  id: string;
  description: string;
  assigneeId: string;
  deadline: string;
  taskId?: string;
}

export interface MOMRevision {
  timestamp: string;
  editorId: string;
  note: string;
}

export interface MOM {
  id: string;
  meetingId: string;
  departmentId: string;
  title: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  meetingType: MeetingMode;
  location: string;
  agenda: string;
  objectives: string;
  attendeeIds: string[];
  absenteeIds: string[];
  discussionPoints: MOMDiscussionPoint[];
  decisionsMade: MOMDecision[];
  actionItems: MOMActionItem[];
  preparedById: string;
  reviewedById?: string;
  publicationStatus: MOMStatus;
  revisionHistory: MOMRevision[];
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused' | 'On Leave';

export interface AttendanceAuditLog {
  timestamp: string;
  changedById: string;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason?: string;
}

export interface AttendanceRecord {
  id: string;
  meetingId: string;
  departmentId: string;
  memberId: string;
  status: AttendanceStatus;
  markedById: string;
  markedAt: string;
  notes?: string;
  auditTrail: AttendanceAuditLog[];
}

export interface AttendanceCorrectionRequest {
  id: string;
  attendanceId: string;
  meetingId: string;
  memberId: string;
  currentStatus: AttendanceStatus;
  requestedStatus: AttendanceStatus;
  reason: string;
  proofUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Under Review' | 'Completed' | 'Overdue';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskCategory =
  | 'MOM Preparation'
  | 'Attendance Management'
  | 'Meeting Coordination'
  | 'Event Planning'
  | 'Member Database Updates'
  | 'Communication'
  | 'General Operations'
  | 'Technical';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  departmentId: string;
  assignedMemberId: string;
  createdById: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  estimatedEffortHours: number;
  actualEffortHours: number;
  completionEvidence?: string;
  reviewerId?: string;
  reviewerScore?: number; // 1 to 10
  isVerified: boolean;
  momId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface EventChecklistItem {
  id: string;
  task: string;
  isCompleted: boolean;
  assignedTo?: string;
}

export interface SocietyEvent {
  id: string;
  title: string;
  description: string;
  organizingDepartmentId: string;
  supportingHrIds: string[];
  organizerIds: string[];
  venue: string;
  startDateTime: string;
  endDateTime: string;
  checklist: EventChecklistItem[];
  isArchived: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  departmentId: string; // 'ALL' or specific department
  isPinned: boolean;
  priority: 'Normal' | 'Urgent';
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  recipientMemberId: string;
  title: string;
  message: string;
  type: 'Meeting' | 'MOM' | 'Task' | 'Attendance' | 'Announcement' | 'System';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface LeaderboardWeights {
  verifiedCompletion: number; // e.g. 25
  onTimeCompletion: number; // e.g. 20
  momQuality: number; // e.g. 20
  attendanceAccuracy: number; // e.g. 15
  meetingEventCoordination: number; // e.g. 10
  reviewerScore: number; // e.g. 10
}

export interface AttendanceFormulaSettings {
  excludeExcusedFromDenominator: boolean;
  excludeLeaveFromDenominator: boolean;
}

export interface DirectoryPrivacySettings {
  hideEnrollmentForMembers: boolean;
  hideJeeRankForMembers: boolean;
  hideEmailForMembers: boolean;
  hidePhoneForMembers: boolean;
}

export interface SocietySettings {
  societyName: string;
  societyShortName: string;
  leaderboardWeights: LeaderboardWeights;
  attendanceFormula: AttendanceFormulaSettings;
  directoryPrivacy: DirectoryPrivacySettings;
  allowedSemesters: number[];
  currentAcademicYear: string;
}

export interface HRLeaderboardEntry {
  member: Member;
  assignedDepartmentName: string;
  verifiedTasksCount: number;
  totalAssignedTasks: number;
  taskCompletionRate: number; // %
  onTimeCompletionRate: number; // %
  momsPreparedCount: number;
  attendanceSheetsCompleted: number;
  meetingsCoordinated: number;
  eventsSupported: number;
  averageReviewerScore: number; // out of 10
  loggedHours: number;
  compositeScore: number; // 0 to 100
  rank: number;
}
