import fs from 'fs';
import path from 'path';
import {
  Department,
  Member,
  Meeting,
  MOM,
  MOMEditRequest,
  AttendanceRecord,
  AttendanceCorrectionRequest,
  Task,
  SocietyEvent,
  Announcement,
  InAppNotification,
  SocietySettings,
  AuditLogEntry,
} from '@/types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_SETTINGS,
  INITIAL_MEMBERS,
  INITIAL_MEETINGS,
  INITIAL_MOMS,
  INITIAL_ATTENDANCE,
  INITIAL_CORRECTION_REQUESTS,
  INITIAL_TASKS,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
} from './seed-data';

export interface DatabaseSchema {
  departments: Department[];
  members: Member[];
  meetings: Meeting[];
  moms: MOM[];
  momEditRequests?: MOMEditRequest[];
  attendance: AttendanceRecord[];
  correctionRequests: AttendanceCorrectionRequest[];
  tasks: Task[];
  events: SocietyEvent[];
  announcements: Announcement[];
  notifications: InAppNotification[];
  settings: SocietySettings;
  auditLogs?: AuditLogEntry[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureInitialized(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DatabaseSchema = {
      departments: INITIAL_DEPARTMENTS,
      members: INITIAL_MEMBERS,
      meetings: INITIAL_MEETINGS,
      moms: INITIAL_MOMS,
      momEditRequests: [],
      attendance: INITIAL_ATTENDANCE,
      correctionRequests: INITIAL_CORRECTION_REQUESTS,
      tasks: INITIAL_TASKS,
      events: INITIAL_EVENTS,
      announcements: INITIAL_ANNOUNCEMENTS,
      notifications: INITIAL_NOTIFICATIONS,
      settings: INITIAL_SETTINGS,
      auditLogs: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent);
    parsed.auditLogs = parsed.auditLogs || [];
    parsed.momEditRequests = parsed.momEditRequests || [];
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, re-initializing:', err);
    const initialDb: DatabaseSchema = {
      departments: INITIAL_DEPARTMENTS,
      members: INITIAL_MEMBERS,
      meetings: INITIAL_MEETINGS,
      moms: INITIAL_MOMS,
      momEditRequests: [],
      attendance: INITIAL_ATTENDANCE,
      correctionRequests: INITIAL_CORRECTION_REQUESTS,
      tasks: INITIAL_TASKS,
      events: INITIAL_EVENTS,
      announcements: INITIAL_ANNOUNCEMENTS,
      notifications: INITIAL_NOTIFICATIONS,
      settings: INITIAL_SETTINGS,
      auditLogs: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
}

export function getDatabase(): DatabaseSchema {
  return ensureInitialized();
}

export function saveDatabase(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = path.join(DATA_DIR, `db.temp.${Date.now()}.json`);
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

export function appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): AuditLogEntry {
  const db = getDatabase();
  const newEntry: AuditLogEntry = {
    id: entry.id || `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
    correlationId: entry.correlationId || `req-${Date.now()}`,
    userId: entry.userId,
    userName: entry.userName,
    userRole: entry.userRole,
    departmentId: entry.departmentId,
    action: entry.action,
    recordType: entry.recordType,
    recordId: entry.recordId,
    changedFields: entry.changedFields,
    reason: entry.reason,
    ipAddress: entry.ipAddress || '127.0.0.1',
    details: entry.details,
  };
  
  if (!db.auditLogs) {
    db.auditLogs = [];
  }
  db.auditLogs.unshift(newEntry);
  saveDatabase(db);
  return newEntry;
}

export function getAuditLogs(): AuditLogEntry[] {
  const db = getDatabase();
  return db.auditLogs || [];
}
