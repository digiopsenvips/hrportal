-- =========================================================================
-- ENACTUS VIPS-TC CENTRAL MANAGEMENT & HR PORTAL
-- SAFE DEVELOPMENT SEED DATA FOR SUPABASE POSTGRESQL
-- File: supabase/seed.sql
-- =========================================================================

-- 1. SEED DEPARTMENTS
INSERT INTO public.departments (id, name, description, color, is_active, is_custom) VALUES
  ('digital-operations', 'Digital Operations', 'Technical infrastructure, web platforms, app development, and digital automation.', '#2FC3A5', true, false),
  ('finance', 'Finance', 'Budgeting, financial audits, funding allocation, project sponsorships, and treasury.', '#0A875E', true, false),
  ('marketing-sales', 'Marketing and Sales', 'Campaigns, social media outreach, merchandise sales, and social enterprise branding.', '#F59E0B', true, false),
  ('pr-finance', 'PR & Corporate Relations', 'Media relations, press releases, corporate networking, and inter-college communication.', '#EC4899', true, false),
  ('production-operations', 'Production and Operations', 'Product lifecycle, packaging, raw material sourcing, supply chain, and logistics.', '#8B5CF6', true, false),
  ('human-resources', 'Human Resources', 'Member recruitment, secondary HR deployment, talent development, and governance audits.', '#0D5143', true, false),
  ('research-development', 'Research and Development', 'Impact analysis, community needs assessment, social innovation research, and metrics.', '#10B981', true, false),
  ('project-raahat', 'Project Raahat (Social Venture)', 'Sanitation awareness, menstrual hygiene advocacy, and eco-friendly sanitary napkin distribution.', '#6366F1', true, true)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED SOCIETY SETTINGS
INSERT INTO public.society_settings (
  id, society_name, society_short_name, leaderboard_weights, attendance_formula, directory_privacy, allowed_semesters, current_academic_year
) VALUES (
  'current',
  'Enactus VIPS-TC',
  'ENVIPS',
  '{"verifiedCompletion": 25, "onTimeCompletion": 20, "momQuality": 20, "attendanceAccuracy": 15, "meetingEventCoordination": 10, "reviewerScore": 10}'::jsonb,
  '{"excludeExcusedFromDenominator": true, "excludeLeaveFromDenominator": true}'::jsonb,
  '{"hideEnrollmentForMembers": true, "hideJeeRankForMembers": true, "hideEmailForMembers": false, "hidePhoneForMembers": true}'::jsonb,
  '{1,2,3,4,5,6,7,8}',
  '2024-2025'
) ON CONFLICT (id) DO NOTHING;

-- 3. SEED INITIAL USERS & MEMBERS
-- Default demo password hash corresponds to 'Admin@123'
INSERT INTO public.members (
  id, member_id, name, email, password_hash, auth_provider, approval_status, membership_status,
  avatar, college_enrollment, jee_rank, current_semester, academic_year, branch, year_of_joining,
  primary_department_id, assigned_department_id, role, role_title, status, phone, bio
) VALUES
  (
    'mem-001', 'ENVIPS-2022-001', 'Aarav Sharma', 'president@enactusvips.org',
    '8b7d94943fcf3cbfa1198642ca001ba02cb11bca0c0b396a98ab2db8cfb04c8651a34a3cc5951a8fec933c0d754b2b2b1ff1aa2ca33246ebec8bf697ec89d661:c4cb47631168ef9ad4a29a562ef6de2a',
    'email', 'APPROVED', 'ACTIVE', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    '04517702022', 12450, 7, '4th Year', 'Computer Science & Engineering', 2022,
    'digital-operations', 'digital-operations', 'president', 'President', 'Active', '+91 98110 12345',
    'Leading Enactus VIPS-TC to national excellence.'
  ),
  (
    'mem-006', 'ENVIPS-2023-006', 'Ishaan Saxena', 'hr.admin@enactusvips.org',
    '8b7d94943fcf3cbfa1198642ca001ba02cb11bca0c0b396a98ab2db8cfb04c8651a34a3cc5951a8fec933c0d754b2b2b1ff1aa2ca33246ebec8bf697ec89d661:c4cb47631168ef9ad4a29a562ef6de2a',
    'email', 'APPROVED', 'ACTIVE', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    '04517702035', 19500, 5, '3rd Year', 'BBA LLB', 2023,
    'human-resources', 'human-resources', 'hr_head', 'Head of Human Resources (HR Admin)', 'Active', '+91 99100 11223',
    'Managing talent, secondary HR deployment, and attendance audits.'
  ),
  (
    'mem-007', 'ENVIPS-2023-007', 'Kunal Bansal', 'digital.head@enactusvips.org',
    '8b7d94943fcf3cbfa1198642ca001ba02cb11bca0c0b396a98ab2db8cfb04c8651a34a3cc5951a8fec933c0d754b2b2b1ff1aa2ca33246ebec8bf697ec89d661:c4cb47631168ef9ad4a29a562ef6de2a',
    'email', 'APPROVED', 'ACTIVE', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    '04517702040', 15300, 5, '3rd Year', 'Computer Science & Engineering', 2023,
    'digital-operations', 'digital-operations', 'dept_head', 'Head of Digital Operations', 'Active', '+91 98111 22334',
    'Leading digital web portals and automated operational pipelines.'
  ),
  (
    'mem-014', 'ENVIPS-2024-014', 'Nikita Rawat', 'secondaryhr.digital@enactusvips.org',
    '8b7d94943fcf3cbfa1198642ca001ba02cb11bca0c0b396a98ab2db8cfb04c8651a34a3cc5951a8fec933c0d754b2b2b1ff1aa2ca33246ebec8bf697ec89d661:c4cb47631168ef9ad4a29a562ef6de2a',
    'email', 'APPROVED', 'ACTIVE', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
    '04517702075', 24500, 3, '2nd Year', 'Information Technology', 2024,
    'human-resources', 'digital-operations', 'secondary_hr', 'Secondary HR - Digital Operations', 'Active', '+91 97111 12345',
    'Coordinating attendance capture and MoM preparation for Digital Operations.'
  ),
  (
    'mem-020', 'ENVIPS-2024-020', 'Diya Rastogi', 'member@enactusvips.org',
    '8b7d94943fcf3cbfa1198642ca001ba02cb11bca0c0b396a98ab2db8cfb04c8651a34a3cc5951a8fec933c0d754b2b2b1ff1aa2ca33246ebec8bf697ec89d661:c4cb47631168ef9ad4a29a562ef6de2a',
    'email', 'APPROVED', 'ACTIVE', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    '04517702105', 28900, 3, '2nd Year', 'Computer Science & Engineering', 2024,
    'digital-operations', 'digital-operations', 'general_member', 'Active General Member', 'Active', '+91 98112 34567',
    'Contributing to web features and social innovation projects.'
  ),
  (
    'mem-dev-01', 'ENVIPS-2022-DEV', 'Devansh Verma (Developer)', 'developer@enactusvips.org',
    '8b7d94943fcf3cbfa1198642ca001ba02cb11bca0c0b396a98ab2db8cfb04c8651a34a3cc5951a8fec933c0d754b2b2b1ff1aa2ca33246ebec8bf697ec89d661:c4cb47631168ef9ad4a29a562ef6de2a',
    'email', 'APPROVED', 'ACTIVE', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    '04517702001', 8400, 7, '4th Year', 'Computer Science & Engineering', 2022,
    'digital-operations', 'digital-operations', 'developer', 'Lead System Developer', 'Active', '+91 98990 00112',
    'Full-stack system architect maintaining society portal and audit trail.'
  )
ON CONFLICT (id) DO NOTHING;
