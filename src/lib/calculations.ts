import {
  Member,
  Meeting,
  AttendanceRecord,
  Task,
  MOM,
  SocietySettings,
  HRLeaderboardEntry,
  Department,
} from '@/types';

export function calculateMemberAttendance(
  memberId: string,
  attendanceRecords: AttendanceRecord[],
  meetings: Meeting[],
  settings: SocietySettings
): {
  percentage: number;
  totalEligible: number;
  attended: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  onLeave: number;
} {
  const memberAttendance = attendanceRecords.filter((a) => a.memberId === memberId);
  const totalRecords = memberAttendance.length;

  let present = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;
  let onLeave = 0;

  for (const record of memberAttendance) {
    if (record.status === 'Present') present++;
    else if (record.status === 'Late') late++;
    else if (record.status === 'Absent') absent++;
    else if (record.status === 'Excused') excused++;
    else if (record.status === 'On Leave') onLeave++;
  }

  let denominator = totalRecords;
  if (settings.attendanceFormula.excludeExcusedFromDenominator) {
    denominator -= excused;
  }
  if (settings.attendanceFormula.excludeLeaveFromDenominator) {
    denominator -= onLeave;
  }

  // Count Present as 1.0, Late as 0.75 attended
  const weightedAttended = present + late * 0.75;
  const percentage = denominator > 0 ? Math.min(100, Math.round((weightedAttended / denominator) * 100)) : 100;

  return {
    percentage,
    totalEligible: Math.max(0, denominator),
    attended: present + late,
    present,
    late,
    absent,
    excused,
    onLeave,
  };
}

export function computeHRLeaderboard(
  members: Member[],
  departments: Department[],
  tasks: Task[],
  moms: MOM[],
  attendanceRecords: AttendanceRecord[],
  meetings: Meeting[],
  settings: SocietySettings
): HRLeaderboardEntry[] {
  // Only HR members (HR Head, Secondary HRs, or HR department members)
  const hrMembers = members.filter(
    (m) =>
      m.role === 'secondary_hr' ||
      m.role === 'hr_head' ||
      m.primaryDepartmentId === 'human-resources'
  );

  const weights = settings.leaderboardWeights;
  const totalWeight =
    weights.verifiedCompletion +
    weights.onTimeCompletion +
    weights.momQuality +
    weights.attendanceAccuracy +
    weights.meetingEventCoordination +
    weights.reviewerScore;

  const entries: HRLeaderboardEntry[] = hrMembers.map((hr) => {
    // Assigned department name
    const assignedDept = departments.find(
      (d) => d.id === (hr.assignedDepartmentId || hr.primaryDepartmentId)
    );
    const assignedDepartmentName = assignedDept ? assignedDept.name : 'Human Resources';

    // Tasks assigned to this HR member
    const memberTasks = tasks.filter((t) => t.assignedMemberId === hr.id);
    const totalAssignedTasks = memberTasks.length;
    const verifiedTasks = memberTasks.filter((t) => t.isVerified && t.status === 'Completed');
    const verifiedTasksCount = verifiedTasks.length;

    // Task completion rate
    const taskCompletionRate =
      totalAssignedTasks > 0 ? (verifiedTasksCount / totalAssignedTasks) * 100 : 0;

    // On-time completion rate
    const onTimeTasks = verifiedTasks.filter((t) => {
      if (!t.completedAt) return true;
      return new Date(t.completedAt) <= new Date(t.deadline + 'T23:59:59');
    });
    const onTimeCompletionRate =
      verifiedTasksCount > 0 ? (onTimeTasks.length / verifiedTasksCount) * 100 : 0;

    // MOMs prepared by this HR
    const preparedMoms = moms.filter((m) => m.preparedById === hr.id);
    const publishedMoms = preparedMoms.filter((m) => m.publicationStatus === 'Published');
    const momsPreparedCount = preparedMoms.length;

    // Attendance sheets completed (meetings where this HR marked attendance)
    const distinctMeetingsMarked = new Set(
      attendanceRecords.filter((a) => a.markedById === hr.id).map((a) => a.meetingId)
    );
    const attendanceSheetsCompleted = distinctMeetingsMarked.size;

    // Meetings coordinated (meetings organized by this HR or where they assisted)
    const meetingsCoordinated = meetings.filter(
      (m) =>
        m.organizerId === hr.id ||
        (hr.assignedDepartmentId && m.departmentId === hr.assignedDepartmentId)
    ).length;

    // Events supported
    const eventsSupported = memberTasks.filter(
      (t) => t.category === 'Event Planning' && t.isVerified
    ).length;

    // Average reviewer score (out of 10)
    const scoredTasks = memberTasks.filter((t) => typeof t.reviewerScore === 'number');
    const averageReviewerScore =
      scoredTasks.length > 0
        ? scoredTasks.reduce((sum, t) => sum + (t.reviewerScore || 0), 0) / scoredTasks.length
        : 8.5; // Default neutral baseline

    // Total logged hours
    const loggedHours = memberTasks.reduce((sum, t) => sum + (t.actualEffortHours || 0), 0);

    // Normalized scores (0 to 100 for each dimension)
    const normVerifiedTasks = Math.min(100, (verifiedTasksCount / Math.max(3, totalAssignedTasks)) * 100);
    const normOnTime = onTimeCompletionRate;
    const normMom = Math.min(100, publishedMoms.length * 40); // 2.5 MOMs = 100%
    const normAttendance = Math.min(100, attendanceSheetsCompleted * 35);
    const normCoordination = Math.min(100, (meetingsCoordinated + eventsSupported) * 25);
    const normReviewer = averageReviewerScore * 10; // score out of 10 converted to %

    // Weighted composite score calculation
    const weightedSum =
      (normVerifiedTasks * weights.verifiedCompletion) / 100 +
      (normOnTime * weights.onTimeCompletion) / 100 +
      (normMom * weights.momQuality) / 100 +
      (normAttendance * weights.attendanceAccuracy) / 100 +
      (normCoordination * weights.meetingEventCoordination) / 100 +
      (normReviewer * weights.reviewerScore) / 100;

    const normalizedTotal = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
    const compositeScore = Math.min(100, Math.max(0, normalizedTotal));

    return {
      member: hr,
      assignedDepartmentName,
      verifiedTasksCount,
      totalAssignedTasks,
      taskCompletionRate: Math.round(taskCompletionRate),
      onTimeCompletionRate: Math.round(onTimeCompletionRate),
      momsPreparedCount,
      attendanceSheetsCompleted,
      meetingsCoordinated,
      eventsSupported,
      averageReviewerScore: Number(averageReviewerScore.toFixed(1)),
      loggedHours,
      compositeScore,
      rank: 0,
    };
  });

  // Sort by composite score descending
  entries.sort((a, b) => b.compositeScore - a.compositeScore);

  // Assign ranks
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return entries;
}

/**
 * Parses any supported time string (ISO string, 24h 'HH:mm', 12h 'h:mm A')
 * into minutes from the start of the day.
 */
function parseTimeToMinutesOfDay(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  if (!trimmed) return null;

  // Check ISO format: e.g. 2026-10-19T16:08:00.000Z
  if (trimmed.includes('T')) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.getHours() * 60 + d.getMinutes();
    }
  }

  // Check 12-hour AM/PM format: e.g. "4:08 PM" or "04:08 pm"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Check 24-hour format: e.g. "16:08" or "16:08:00"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Format minutes of day or raw string into user-friendly time string (e.g. "4:08 PM" or "16:08")
 */
function formatTimeString(rawTime?: string): string {
  if (!rawTime || typeof rawTime !== 'string') return 'Not recorded';
  const trimmed = rawTime.trim();
  if (!trimmed) return 'Not recorded';

  // If ISO string
  if (trimmed.includes('T')) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }

  // If already AM/PM or HH:mm, return as is
  return trimmed;
}

export interface AttendanceDurationInfo {
  durationMinutes: number | null;
  formattedDuration: string;
  actualJoinTime: string;
  actualLeaveTime: string;
}

/**
 * Calculates the exact attended duration for a member's attendance record
 * using actual recorded join and leave times.
 * Handles multiple sessions without double-counting overlapping intervals.
 * Displays "Duration unavailable" if join/leave times are missing.
 */
export function calculateAttendanceDuration(
  record?: {
    joinTime?: string;
    leaveTime?: string;
    durationMinutes?: number;
    sessions?: { joinTime: string; leaveTime: string }[];
  } | null
): AttendanceDurationInfo {
  if (!record) {
    return {
      durationMinutes: null,
      formattedDuration: 'Duration unavailable',
      actualJoinTime: 'Not recorded',
      actualLeaveTime: 'Not recorded',
    };
  }

  // Case 1: Multiple attendance sessions recorded
  if (Array.isArray(record.sessions) && record.sessions.length > 0) {
    const intervals: [number, number][] = [];
    for (const s of record.sessions) {
      const start = parseTimeToMinutesOfDay(s.joinTime);
      const end = parseTimeToMinutesOfDay(s.leaveTime);
      if (start !== null && end !== null && end >= start) {
        intervals.push([start, end]);
      }
    }

    if (intervals.length > 0) {
      // Sort intervals by start time
      intervals.sort((a, b) => a[0] - b[0]);

      // Merge overlapping intervals
      const merged: [number, number][] = [intervals[0]];
      for (let i = 1; i < intervals.length; i++) {
        const prev = merged[merged.length - 1];
        const curr = intervals[i];
        if (curr[0] <= prev[1]) {
          prev[1] = Math.max(prev[1], curr[1]);
        } else {
          merged.push(curr);
        }
      }

      // Sum merged minutes
      const totalMinutes = merged.reduce((sum, [s, e]) => sum + (e - s), 0);
      const firstJoin = record.sessions[0].joinTime;
      const lastLeave = record.sessions[record.sessions.length - 1].leaveTime;

      return {
        durationMinutes: totalMinutes,
        formattedDuration: `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`,
        actualJoinTime: formatTimeString(firstJoin),
        actualLeaveTime: formatTimeString(lastLeave),
      };
    }
  }

  // Case 2: Single joinTime and leaveTime
  const startMins = parseTimeToMinutesOfDay(record.joinTime || '');
  const endMins = parseTimeToMinutesOfDay(record.leaveTime || '');

  if (startMins !== null && endMins !== null) {
    // If leave time is later than or equal to join time
    const diff = Math.max(0, endMins - startMins);
    return {
      durationMinutes: diff,
      formattedDuration: `${diff} minute${diff === 1 ? '' : 's'}`,
      actualJoinTime: formatTimeString(record.joinTime),
      actualLeaveTime: formatTimeString(record.leaveTime),
    };
  }

  // Case 3: Explicit durationMinutes present but specific join/leave not parsed
  if (typeof record.durationMinutes === 'number' && record.durationMinutes >= 0) {
    return {
      durationMinutes: record.durationMinutes,
      formattedDuration: `${record.durationMinutes} minute${record.durationMinutes === 1 ? '' : 's'}`,
      actualJoinTime: formatTimeString(record.joinTime),
      actualLeaveTime: formatTimeString(record.leaveTime),
    };
  }

  // Case 4: Join or leave record unavailable
  return {
    durationMinutes: null,
    formattedDuration: 'Duration unavailable',
    actualJoinTime: formatTimeString(record.joinTime),
    actualLeaveTime: formatTimeString(record.leaveTime),
  };
}
