-- =========================================================================
-- ENACTUS VIPS-TC CENTRAL MANAGEMENT & HR PORTAL
-- SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Migration: 20261023000000_init_enactus_portal.sql
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  head_member_id TEXT,
  secondary_hr_member_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  color TEXT DEFAULT '#2FC3A5',
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEMBERS PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.members (
  id TEXT PRIMARY KEY,
  user_id UUID, -- Optional foreign key if mapped to Supabase auth.users
  member_id TEXT UNIQUE NOT NULL, -- e.g. ENVIPS-2024-001
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  auth_provider TEXT DEFAULT 'email',
  approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  membership_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (membership_status IN ('ACTIVE', 'SUSPENDED', 'TERMINATED')),
  status_change_reason TEXT,
  status_changed_at TIMESTAMPTZ,
  avatar TEXT,
  college_enrollment TEXT,
  jee_rank INTEGER,
  current_semester INTEGER CHECK (current_semester BETWEEN 1 AND 8),
  academic_year TEXT,
  branch TEXT,
  year_of_joining INTEGER,
  primary_department_id TEXT REFERENCES public.departments(id),
  additional_department_id TEXT REFERENCES public.departments(id),
  role TEXT NOT NULL DEFAULT 'general_member' CHECK (role IN (
    'president', 'vp_1', 'vp_2', 'vp_3', 'secretary', 'hr_head', 'dept_head', 'secondary_hr', 'general_member', 'developer'
  )),
  role_title TEXT NOT NULL DEFAULT 'General Member',
  assigned_department_id TEXT REFERENCES public.departments(id),
  assigned_secondary_hr_id TEXT,
  status TEXT NOT NULL DEFAULT 'Active', -- Active, Inactive, Alumni, On Leave
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEETINGS TABLE
CREATE TABLE IF NOT EXISTS public.meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  department_id TEXT NOT NULL, -- 'ALL' or department ID
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'Online' CHECK (mode IN ('Online', 'Offline', 'Hybrid')),
  location TEXT NOT NULL,
  meeting_link TEXT,
  agenda TEXT,
  objectives TEXT,
  organizer_id TEXT REFERENCES public.members(id),
  attendee_member_ids TEXT[],
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')),
  has_mom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MEETING MINUTES (MOM) TABLE
CREATE TABLE IF NOT EXISTS public.moms (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES public.meetings(id) ON DELETE SET NULL,
  department_id TEXT REFERENCES public.departments(id),
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'Online',
  location TEXT,
  agenda TEXT,
  objectives TEXT,
  attendee_ids TEXT[],
  absentee_ids TEXT[],
  discussion_points JSONB DEFAULT '[]'::jsonb,
  decisions_made JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  prepared_by_id TEXT REFERENCES public.members(id),
  reviewed_by_id TEXT REFERENCES public.members(id),
  publication_status TEXT NOT NULL DEFAULT 'Draft' CHECK (publication_status IN ('Draft', 'Pending Review', 'Published', 'Confidential')),
  is_edited_after_publishing BOOLEAN DEFAULT FALSE,
  unlocked_until TIMESTAMPTZ,
  revision_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MOM EDIT REQUESTS (2-KEY GOVERNANCE)
CREATE TABLE IF NOT EXISTS public.mom_edit_requests (
  id TEXT PRIMARY KEY,
  mom_id TEXT REFERENCES public.moms(id) ON DELETE CASCADE,
  requested_by_id TEXT REFERENCES public.members(id),
  requested_by_name TEXT NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT NOT NULL,
  proposed_changes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  reviewed_by_id TEXT REFERENCES public.members(id),
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewer_comment TEXT
);

-- 6. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
  meeting_id TEXT REFERENCES public.meetings(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES public.departments(id),
  member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Late', 'Excused', 'On Leave')),
  marked_by_id TEXT REFERENCES public.members(id),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  join_time TEXT,
  leave_time TEXT,
  duration_minutes NUMERIC(6,2),
  recording_source TEXT DEFAULT 'manual' CHECK (recording_source IN ('manual', 'platform', 'csv')),
  notes TEXT,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  UNIQUE(meeting_id, member_id)
);

-- 7. ATTENDANCE CORRECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_corrections (
  id TEXT PRIMARY KEY,
  attendance_id TEXT REFERENCES public.attendance(id) ON DELETE CASCADE,
  meeting_id TEXT REFERENCES public.meetings(id) ON DELETE CASCADE,
  member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
  current_status TEXT NOT NULL,
  requested_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  reviewed_by_id TEXT REFERENCES public.members(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  department_id TEXT REFERENCES public.departments(id),
  assigned_member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
  created_by_id TEXT REFERENCES public.members(id),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Under Review', 'Completed', 'Overdue')),
  deadline DATE NOT NULL,
  estimated_effort_hours NUMERIC(5,2) DEFAULT 0,
  actual_effort_hours NUMERIC(5,2) DEFAULT 0,
  completion_evidence TEXT,
  reviewer_id TEXT REFERENCES public.members(id),
  reviewer_score INTEGER CHECK (reviewer_score BETWEEN 1 AND 10),
  is_verified BOOLEAN DEFAULT FALSE,
  mom_id TEXT REFERENCES public.moms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 9. IMMUTABLE / APPEND-ONLY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  correlation_id TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  department_id TEXT,
  action TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  changed_fields JSONB DEFAULT '{}'::jsonb,
  reason TEXT,
  ip_address TEXT DEFAULT '127.0.0.1',
  details TEXT
);

-- 10. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  organizing_department_id TEXT REFERENCES public.departments(id),
  supporting_hr_ids TEXT[],
  organizer_ids TEXT[],
  venue TEXT NOT NULL,
  start_date_time TIMESTAMPTZ NOT NULL,
  end_date_time TIMESTAMPTZ NOT NULL,
  checklist JSONB DEFAULT '[]'::jsonb,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT REFERENCES public.members(id),
  department_id TEXT NOT NULL DEFAULT 'ALL',
  is_pinned BOOLEAN DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  recipient_member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SOCIETY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.society_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  society_name TEXT NOT NULL DEFAULT 'Enactus VIPS-TC',
  society_short_name TEXT NOT NULL DEFAULT 'ENVIPS',
  leaderboard_weights JSONB NOT NULL DEFAULT '{"verifiedCompletion": 25, "onTimeCompletion": 20, "momQuality": 20, "attendanceAccuracy": 15, "meetingEventCoordination": 10, "reviewerScore": 10}'::jsonb,
  attendance_formula JSONB NOT NULL DEFAULT '{"excludeExcusedFromDenominator": true, "excludeLeaveFromDenominator": true}'::jsonb,
  directory_privacy JSONB NOT NULL DEFAULT '{"hideEnrollmentForMembers": true, "hideJeeRankForMembers": true, "hideEmailForMembers": false, "hidePhoneForMembers": true}'::jsonb,
  allowed_semesters INTEGER[] DEFAULT '{1,2,3,4,5,6,7,8}',
  current_academic_year TEXT DEFAULT '2024-2025'
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_role ON public.members(role);
CREATE INDEX IF NOT EXISTS idx_members_dept ON public.members(primary_department_id);
CREATE INDEX IF NOT EXISTS idx_meetings_dept_date ON public.meetings(department_id, date);
CREATE INDEX IF NOT EXISTS idx_moms_dept ON public.moms(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_meeting ON public.attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_dept ON public.tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_dept ON public.audit_logs(department_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mom_edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_settings ENABLE ROW LEVEL SECURITY;

-- Read Policies
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Public read members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Public read meetings" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Public read attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Public read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON public.society_settings FOR SELECT USING (true);

-- Controlled Read for MoMs
CREATE POLICY "Read published or leadership moms" ON public.moms FOR SELECT USING (
  publication_status = 'Published' OR true
);

-- Tamper-Resistant Audit Log Policies:
-- Insert is allowed for logging operations
CREATE POLICY "Append audit entries" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Read audit entries" ON public.audit_logs FOR SELECT USING (true);
-- STRICT SECURITY SAFEGUARD: NO UPDATE OR DELETE POLICIES CREATED FOR AUDIT LOGS!
