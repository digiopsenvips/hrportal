-- =========================================================================
-- ENACTUS VIPS-TC CENTRAL MANAGEMENT & HR PORTAL
-- SUPABASE POSTGRESQL DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  head_member_id UUID,
  secondary_hr_member_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  color TEXT DEFAULT '#3B82F6',
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEMBERS PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT UNIQUE NOT NULL, -- e.g. ENVIPS-2024-001
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  college_enrollment TEXT,
  jee_rank INTEGER,
  current_semester INTEGER CHECK (current_semester BETWEEN 1 AND 8),
  academic_year TEXT,
  branch TEXT,
  year_of_joining INTEGER,
  primary_department_id TEXT REFERENCES public.departments(id),
  additional_department_id TEXT REFERENCES public.departments(id),
  role TEXT NOT NULL DEFAULT 'general_member', -- president, vp_1, vp_2, vp_3, secretary, hr_head, dept_head, secondary_hr, general_member
  role_title TEXT NOT NULL DEFAULT 'General Member',
  assigned_department_id TEXT REFERENCES public.departments(id),
  assigned_secondary_hr_id UUID,
  status TEXT NOT NULL DEFAULT 'Active', -- Active, Inactive, Alumni, On Leave
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEETINGS TABLE
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  department_id TEXT NOT NULL, -- 'ALL' or department ID
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  mode TEXT NOT NULL DEFAULT 'Online', -- Online, Offline, Hybrid
  location TEXT NOT NULL,
  meeting_link TEXT,
  agenda TEXT,
  objectives TEXT,
  organizer_id UUID REFERENCES public.members(id),
  attendee_member_ids UUID[],
  status TEXT NOT NULL DEFAULT 'Scheduled', -- Scheduled, Completed, Cancelled, Rescheduled
  has_mom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MEETING MINUTES (MOM) TABLE
CREATE TABLE IF NOT EXISTS public.moms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES public.departments(id),
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  meeting_type TEXT NOT NULL,
  location TEXT,
  agenda TEXT,
  objectives TEXT,
  attendee_ids UUID[],
  absentee_ids UUID[],
  discussion_points JSONB DEFAULT '[]'::jsonb,
  decisions_made JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  prepared_by_id UUID REFERENCES public.members(id),
  reviewed_by_id UUID REFERENCES public.members(id),
  publication_status TEXT NOT NULL DEFAULT 'Draft', -- Draft, Pending Review, Published, Confidential
  revision_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  department_id TEXT REFERENCES public.departments(id),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Present', -- Present, Absent, Late, Excused, On Leave
  marked_by_id UUID REFERENCES public.members(id),
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  UNIQUE(meeting_id, member_id)
);

-- 6. ATTENDANCE CORRECTION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID REFERENCES public.attendance(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  current_status TEXT NOT NULL,
  requested_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
  reviewed_by_id UUID REFERENCES public.members(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- MOM Preparation, Attendance Management, Meeting Coordination, Event Planning, Member Database Updates, Communication, General Operations, Technical
  department_id TEXT REFERENCES public.departments(id),
  assigned_member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES public.members(id),
  priority TEXT NOT NULL DEFAULT 'Medium', -- Low, Medium, High, Urgent
  status TEXT NOT NULL DEFAULT 'To Do', -- To Do, In Progress, Under Review, Completed, Overdue
  deadline DATE NOT NULL,
  estimated_effort_hours NUMERIC(5,2) DEFAULT 0,
  actual_effort_hours NUMERIC(5,2) DEFAULT 0,
  completion_evidence TEXT,
  reviewer_id UUID REFERENCES public.members(id),
  reviewer_score INTEGER CHECK (reviewer_score BETWEEN 1 AND 10),
  is_verified BOOLEAN DEFAULT FALSE,
  mom_id UUID REFERENCES public.moms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 8. SOCIETY EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  organizing_department_id TEXT REFERENCES public.departments(id),
  supporting_hr_ids UUID[],
  organizer_ids UUID[],
  venue TEXT NOT NULL,
  start_date_time TIMESTAMPTZ NOT NULL,
  end_date_time TIMESTAMPTZ NOT NULL,
  checklist JSONB DEFAULT '[]'::jsonb,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.members(id),
  department_id TEXT NOT NULL DEFAULT 'ALL',
  is_pinned BOOLEAN DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'Normal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SOCIETY SETTINGS TABLE
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

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_settings ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Members read members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Members read meetings" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Members read published moms" ON public.moms FOR SELECT USING (
  publication_status = 'Published' OR
  auth.uid() IN (SELECT user_id FROM public.members WHERE role IN ('president', 'vp_1', 'vp_2', 'vp_3', 'secretary', 'hr_head'))
);
CREATE POLICY "Members read attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Members read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Members read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Members read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (
  recipient_member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
);
