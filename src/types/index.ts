export type RoleType =
  | 'president'
  | 'vp_1'
  | 'vp_2'
  | 'vp_3'
  | 'secretary'
  | 'hr_head'
  | 'dept_head'
  | 'secondary_hr'
  | 'general_member'
  | 'developer';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

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
  authProvider?: 'email' | 'google';
  approvalStatus: ApprovalStatus;
  membershipStatus: MembershipStatus;
  statusChangeReason?: string;
  statusChangedAt?: string;
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
  roleTitle: string;
  assignedDepartmentId?: string | null;
  assignedSecondaryHrId?: string | null;
  status: 'Active' | 'Inactive' | 'Alumni' | 'On Leave'; // Existing UI status
  phone?: string;
  bio?: string;
  createdAt: string;
}

export type MeetingMode = 'Online' | 'Offline' | 'Hybrid';
export type MeetingStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';

export interface Meeting {
  id: string;
  title: string;
  departmentId: string;
  date: string;
  startTime: string;
  endTime: string;
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

export interface MOMEditRequest {
  id: string;
  momId: string;
  requestedById: string;
  requestedByName: string;
  requestedAt: string;
  reason: string;
  proposedChanges: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewerComment?: string;
}

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
  status?: 'Not Started' | 'In Progress' | 'Blocked' | 'Completed';
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
  isEditedAfterPublishing?: boolean;
  unlockedUntil?: string;
  editRequests?: MOMEditRequest[];
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
  joinTime?: string;
  leaveTime?: string;
  durationMinutes?: number;
  recordingSource?: 'platform' | 'csv' | 'manual';
  notes?: string;
  auditTrail: AttendanceAuditLog[];
}

export interface AuditLogEntry {
  id: string;
  correlationId?: string;
  userId: string;
  userName: string;
  userRole: string;
  departmentId?: string;
  action: string;
  recordType: 'MOM' | 'ATTENDANCE' | 'MEETING' | 'TASK' | 'MEMBER' | 'EXPORT' | 'AUTH' | 'SETTINGS';
  recordId?: string;
  timestamp: string;
  changedFields?: Record<string, { before: any; after: any }>;
  reason?: string;
  ipAddress?: string;
  details?: string;
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
  reviewerScore?: number;
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
  departmentId: string;
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
  verifiedCompletion: number;
  onTimeCompletion: number;
  momQuality: number;
  attendanceAccuracy: number;
  meetingEventCoordination: number;
  reviewerScore: number;
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
  taskCompletionRate: number;
  onTimeCompletionRate: number;
  momsPreparedCount: number;
  attendanceSheetsCompleted: number;
  meetingsCoordinated: number;
  eventsSupported: number;
  averageReviewerScore: number;
  loggedHours: number;
  compositeScore: number;
  rank: number;
}
