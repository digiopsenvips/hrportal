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
import { isSupabaseConfigured, supabaseAdmin } from './supabase';

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

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

function rowToCamel<T>(row: Record<string, any>): T {
  if (!row || typeof row !== 'object') return row as T;
  const result: any = {};
  for (const [key, val] of Object.entries(row)) {
    result[toCamelCase(key)] = val;
  }
  return result as T;
}

function itemToSnake(item: Record<string, any>): Record<string, any> {
  if (!item || typeof item !== 'object') return item;
  const result: any = {};
  for (const [key, val] of Object.entries(item)) {
    result[toSnakeCase(key)] = val;
  }
  return result;
}

function getLocalDbFilePath(): string {
  // If running in Vercel or read-only lambda environment, use /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'db.json');
  }
  return path.join(process.cwd(), 'data', 'db.json');
}

function ensureLocalInitialized(): DatabaseSchema {
  const dbFile = getLocalDbFilePath();
  const bundledDataFile = path.join(process.cwd(), 'data', 'db.json');

  if (!fs.existsSync(dbFile)) {
    // Try to copy from bundled data/db.json first
    if (fs.existsSync(bundledDataFile)) {
      try {
        const bundledContent = fs.readFileSync(bundledDataFile, 'utf-8');
        fs.writeFileSync(dbFile, bundledContent, 'utf-8');
        const parsed = JSON.parse(bundledContent);
        parsed.auditLogs = parsed.auditLogs || [];
        parsed.momEditRequests = parsed.momEditRequests || [];
        return parsed;
      } catch {
        // Fallback to initial seeds
      }
    }

    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

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
    try {
      fs.writeFileSync(dbFile, JSON.stringify(initialDb, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not write local db file:', err);
    }
    return initialDb;
  }

  try {
    const fileContent = fs.readFileSync(dbFile, 'utf-8');
    const parsed = JSON.parse(fileContent);
    parsed.auditLogs = parsed.auditLogs || [];
    parsed.momEditRequests = parsed.momEditRequests || [];
    return parsed;
  } catch (err) {
    console.error('Error reading local db file, re-initializing:', err);
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
    return initialDb;
  }
}

async function seedSupabaseInitial(): Promise<void> {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('departments').upsert(INITIAL_DEPARTMENTS.map(itemToSnake), { onConflict: 'id' });
    const settingsRow = {
      id: 'current',
      society_name: INITIAL_SETTINGS.societyName,
      society_short_name: INITIAL_SETTINGS.societyShortName,
      leaderboard_weights: INITIAL_SETTINGS.leaderboardWeights,
      attendance_formula: INITIAL_SETTINGS.attendanceFormula,
      directory_privacy: INITIAL_SETTINGS.directoryPrivacy,
      allowed_semesters: INITIAL_SETTINGS.allowedSemesters,
      current_academic_year: INITIAL_SETTINGS.currentAcademicYear,
    };
    await supabaseAdmin.from('society_settings').upsert([settingsRow], { onConflict: 'id' });
    await supabaseAdmin.from('members').upsert(INITIAL_MEMBERS.map(itemToSnake), { onConflict: 'id' });
    if (INITIAL_MEETINGS.length > 0) {
      await supabaseAdmin.from('meetings').upsert(INITIAL_MEETINGS.map(itemToSnake), { onConflict: 'id' });
    }
    if (INITIAL_MOMS.length > 0) {
      await supabaseAdmin.from('moms').upsert(INITIAL_MOMS.map(itemToSnake), { onConflict: 'id' });
    }
    if (INITIAL_ATTENDANCE.length > 0) {
      await supabaseAdmin.from('attendance').upsert(INITIAL_ATTENDANCE.map(itemToSnake), { onConflict: 'id' });
    }
    if (INITIAL_TASKS.length > 0) {
      await supabaseAdmin.from('tasks').upsert(INITIAL_TASKS.map(itemToSnake), { onConflict: 'id' });
    }
    if (INITIAL_EVENTS.length > 0) {
      await supabaseAdmin.from('events').upsert(INITIAL_EVENTS.map(itemToSnake), { onConflict: 'id' });
    }
    if (INITIAL_ANNOUNCEMENTS.length > 0) {
      await supabaseAdmin.from('announcements').upsert(INITIAL_ANNOUNCEMENTS.map(itemToSnake), { onConflict: 'id' });
    }
    if (INITIAL_NOTIFICATIONS.length > 0) {
      await supabaseAdmin.from('notifications').upsert(INITIAL_NOTIFICATIONS.map(itemToSnake), { onConflict: 'id' });
    }
  } catch (seedErr) {
    console.error('Failed to auto-seed initial data to Supabase:', seedErr);
  }
}

async function fetchFromSupabase(): Promise<DatabaseSchema | null> {
  if (!isSupabaseConfigured || !supabaseAdmin) return null;

  try {
    const [
      deptRes,
      memRes,
      meetRes,
      momsRes,
      momEditRes,
      attRes,
      corrRes,
      taskRes,
      evtRes,
      annRes,
      notifRes,
      settRes,
      audRes,
    ] = await Promise.all([
      supabaseAdmin.from('departments').select('*'),
      supabaseAdmin.from('members').select('*'),
      supabaseAdmin.from('meetings').select('*'),
      supabaseAdmin.from('moms').select('*'),
      supabaseAdmin.from('mom_edit_requests').select('*'),
      supabaseAdmin.from('attendance').select('*'),
      supabaseAdmin.from('attendance_corrections').select('*'),
      supabaseAdmin.from('tasks').select('*'),
      supabaseAdmin.from('events').select('*'),
      supabaseAdmin.from('announcements').select('*'),
      supabaseAdmin.from('notifications').select('*'),
      supabaseAdmin.from('society_settings').select('*').limit(1),
      supabaseAdmin.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500),
    ]);

    // If tables don't exist yet, return null to fall back safely to local
    if (deptRes.error || memRes.error) {
      console.warn('Supabase query returned error (tables might need migration):', deptRes.error || memRes.error);
      return null;
    }

    // Auto-seed if tables are completely empty
    if ((!deptRes.data || deptRes.data.length === 0) && (!memRes.data || memRes.data.length === 0)) {
      await seedSupabaseInitial();
      return fetchFromSupabase();
    }

    const departments: Department[] = (deptRes.data || []).map((r) => rowToCamel<Department>(r));
    const members: Member[] = (memRes.data || []).map((r) => rowToCamel<Member>(r));
    const meetings: Meeting[] = (meetRes.data || []).map((r) => rowToCamel<Meeting>(r));
    const moms: MOM[] = (momsRes.data || []).map((r) => rowToCamel<MOM>(r));
    const momEditRequests: MOMEditRequest[] = (momEditRes.data || []).map((r) => rowToCamel<MOMEditRequest>(r));
    const attendance: AttendanceRecord[] = (attRes.data || []).map((r) => rowToCamel<AttendanceRecord>(r));
    const correctionRequests: AttendanceCorrectionRequest[] = (corrRes.data || []).map((r) => rowToCamel<AttendanceCorrectionRequest>(r));
    const tasks: Task[] = (taskRes.data || []).map((r) => rowToCamel<Task>(r));
    const events: SocietyEvent[] = (evtRes.data || []).map((r) => rowToCamel<SocietyEvent>(r));
    const announcements: Announcement[] = (annRes.data || []).map((r) => rowToCamel<Announcement>(r));
    const notifications: InAppNotification[] = (notifRes.data || []).map((r) => rowToCamel<InAppNotification>(r));
    const auditLogs: AuditLogEntry[] = (audRes.data || []).map((r) => rowToCamel<AuditLogEntry>(r));

    let settings: SocietySettings = INITIAL_SETTINGS;
    if (settRes.data && settRes.data.length > 0) {
      const row = settRes.data[0];
      settings = {
        societyName: row.society_name || INITIAL_SETTINGS.societyName,
        societyShortName: row.society_short_name || INITIAL_SETTINGS.societyShortName,
        leaderboardWeights: row.leaderboard_weights || INITIAL_SETTINGS.leaderboardWeights,
        attendanceFormula: row.attendance_formula || INITIAL_SETTINGS.attendanceFormula,
        directoryPrivacy: row.directory_privacy || INITIAL_SETTINGS.directoryPrivacy,
        allowedSemesters: row.allowed_semesters || INITIAL_SETTINGS.allowedSemesters,
        currentAcademicYear: row.current_academic_year || INITIAL_SETTINGS.currentAcademicYear,
      };
    }

    return {
      departments,
      members,
      meetings,
      moms,
      momEditRequests,
      attendance,
      correctionRequests,
      tasks,
      events,
      announcements,
      notifications,
      settings,
      auditLogs,
    };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
}

export async function getDatabase(): Promise<DatabaseSchema> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const supabaseData = await fetchFromSupabase();
    if (supabaseData) {
      return supabaseData;
    }
  }
  return ensureLocalInitialized();
}

export async function saveDatabase(
  data: DatabaseSchema,
  collectionsToUpdate?: (keyof DatabaseSchema)[]
): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const upserts: Array<PromiseLike<any>> = [];
      const shouldUpdate = (col: keyof DatabaseSchema) =>
        !collectionsToUpdate || collectionsToUpdate.includes(col);

      if (shouldUpdate('departments') && data.departments && data.departments.length > 0) {
        upserts.push(supabaseAdmin.from('departments').upsert(data.departments.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('members') && data.members && data.members.length > 0) {
        upserts.push(supabaseAdmin.from('members').upsert(data.members.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('meetings') && data.meetings && data.meetings.length > 0) {
        upserts.push(supabaseAdmin.from('meetings').upsert(data.meetings.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('moms') && data.moms && data.moms.length > 0) {
        upserts.push(supabaseAdmin.from('moms').upsert(data.moms.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('momEditRequests') && data.momEditRequests && data.momEditRequests.length > 0) {
        upserts.push(supabaseAdmin.from('mom_edit_requests').upsert(data.momEditRequests.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('attendance') && data.attendance && data.attendance.length > 0) {
        upserts.push(supabaseAdmin.from('attendance').upsert(data.attendance.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('correctionRequests') && data.correctionRequests && data.correctionRequests.length > 0) {
        upserts.push(supabaseAdmin.from('attendance_corrections').upsert(data.correctionRequests.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('tasks') && data.tasks && data.tasks.length > 0) {
        upserts.push(supabaseAdmin.from('tasks').upsert(data.tasks.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('events') && data.events && data.events.length > 0) {
        upserts.push(supabaseAdmin.from('events').upsert(data.events.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('announcements') && data.announcements && data.announcements.length > 0) {
        upserts.push(supabaseAdmin.from('announcements').upsert(data.announcements.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('notifications') && data.notifications && data.notifications.length > 0) {
        upserts.push(supabaseAdmin.from('notifications').upsert(data.notifications.map(itemToSnake), { onConflict: 'id' }));
      }
      if (shouldUpdate('settings') && data.settings) {
        const settingsRow = {
          id: 'current',
          society_name: data.settings.societyName,
          society_short_name: data.settings.societyShortName,
          leaderboard_weights: data.settings.leaderboardWeights,
          attendance_formula: data.settings.attendanceFormula,
          directory_privacy: data.settings.directoryPrivacy,
          allowed_semesters: data.settings.allowedSemesters,
          current_academic_year: data.settings.currentAcademicYear,
        };
        upserts.push(supabaseAdmin.from('society_settings').upsert([settingsRow], { onConflict: 'id' }));
      }

      await Promise.all(upserts);
      return;
    } catch (err) {
      console.error('Error saving data to Supabase, falling back to local file:', err);
    }
  }

  // Local fallback save
  try {
    const dbFile = getLocalDbFilePath();
    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = path.join(dir, `db.temp.${Date.now()}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, dbFile);
  } catch (err) {
    console.warn('Failed to write local fallback database:', err);
  }
}

export async function appendAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): Promise<AuditLogEntry> {
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

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      await supabaseAdmin.from('audit_logs').insert([itemToSnake(newEntry)]);
      return newEntry;
    } catch (err) {
      console.error('Failed to insert audit log into Supabase:', err);
    }
  }

  const db = await getDatabase();
  if (!db.auditLogs) {
    db.auditLogs = [];
  }
  db.auditLogs.unshift(newEntry);
  await saveDatabase(db, ['auditLogs']);
  return newEntry;
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);
      if (!error && data) {
        return data.map((r) => rowToCamel<AuditLogEntry>(r));
      }
    } catch (err) {
      console.error('Failed to get audit logs from Supabase:', err);
    }
  }
  const db = await getDatabase();
  return db.auditLogs || [];
}
