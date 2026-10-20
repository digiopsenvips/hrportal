# Enactus VIPS-TC Central Management & HR Portal

A centralized, enterprise-grade HR Management, Society Operations, Attendance, Meeting Management, Task Tracking, and Member Information Portal for **Enactus VIPS-TC**.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, persistent ACID JSON storage engine with full **Supabase & PostgreSQL** compatibility.

---

## 🌟 Key Architecture & Features

### 1. Society Structure & Dynamic Departments
- **8 Autonomous Departments**:
  1. Digital Operations
  2. Finance
  3. Marketing and Sales
  4. PR & Corporate Relations
  5. Production and Operations
  6. Research & Development
  7. Human Resources
  8. Outreach & Corporate Partnerships (*8th configurable department*)
- **Admin Dynamic Engine**: Add, edit, rename, or deactivate departments through the UI without changing any code.
- Each department operates autonomously with its own **Department Head**, **Secondary HR Representative** (assigned from the HR team), member list, meeting calendar, MOMs, attendance records, and tasks.

### 2. 7-Tier Role-Based Access Control (RBAC)
- **Level 1: President** — Highest authority, society-wide operational oversight, role assignments, full audit logs.
- **Level 2: Three Vice Presidents** — VP 1 (Operations & Projects), VP 2 (External Affairs & PR), VP 3 (Strategy & Expansion).
- **Level 3: Secretaries** — Inter-departmental coordination, calendar compliance, MOM follow-ups.
- **Level 4: HR Department Head** — Human resources management, secondary HR deployment, HR Leaderboard governance.
- **Level 5: Department Heads** — Manage departmental tasks, schedule meetings, attendance, publish MOMs.
- **Level 6: Secondary HR Representatives** — Embedded into specific departments, record attendance, draft MOMs, event logistics.
- **Level 7: General Members** — Personal dashboard, view published MOMs, personal attendance, task tracking, request attendance corrections.
- **Instant Role Switcher Pill**: The top bar provides a 1-click persona preview switcher to test all 7 hierarchy tiers.

### 3. Active Member Directory & Privacy Shield
- Full profile records: Name, Avatar, Unique Member ID (`ENVIPS-YYYY-XXX`), College Enrollment, JEE Rank, Semester, Branch, Year of Joining, Departments, Secondary HR.
- **Privacy Shield**: College Enrollment numbers, JEE ranks, and sensitive contact info are masked for ordinary members and visible only to authorized HR and leadership roles.
- **CSV Bulk Import & Export**: Fast onboarding with automated duplicate detection by email and enrollment number.

### 4. Interactive Visual Organogram
- Interactive organizational tree chart visualizing the complete reporting structure:
  $$\text{President} \longrightarrow 3 \text{ VPs} \longrightarrow \text{Secretaries} \longrightarrow \text{HR Head} \longrightarrow \text{Dept Heads} \longrightarrow \text{Secondary HRs} \longrightarrow \text{Members}$$
- Collapsible branches, zoom & pan controls, department filtering, and profile drawer.

### 5. Meeting Minutes (MOM) Portal
- Meeting-wise minutes creation with templates (*Department Weekly Sprint*, *Core Leadership Bi-Weekly Sync*).
- **Automated Task Generation**: Action items entered in the MOM automatically spawn verified tasks for assignees in the HR Task Board.
- Printable & downloadable clean PDF formatting.

### 6. Central Calendar & Meeting Scheduler
- Monthly, weekly, and agenda views with department color coding.
- **Conflict Detection Engine**: Detects overlapping offline venue bookings or common participant scheduling clashes.
- One-click `.ics` iCal export for Google Calendar / Apple Calendar.

### 7. Attendance & Quorum Management
- Meeting-wise sheets supporting `Present`, `Absent`, `Late`, `Excused`, `On Leave`.
- Bulk attendance marking ("Mark All Present").
- **Configurable Attendance Formula**:
  $$\text{Attendance Percentage} = \frac{\text{Eligible Meetings Attended}}{\text{Total Eligible Meetings}} \times 100$$
  Supports toggle to exclude excused absences or approved leaves from the denominator.
- **Audit Log Trail**: Complete historical trail of who modified attendance entries, timestamps, and justifications.
- **Correction Tickets Workflow**: Members can submit correction requests with reasons; HR and leadership review and approve.

### 8. HR Operations Task Board & Weighted Leaderboard
- **Kanban Board** (`To Do` → `In Progress` → `Under Review` → `Completed`) and Table views.
- Actual logged effort vs. estimated effort tracking (excluding passive meeting time).
- Peer verification and 1-10 quality scoring (strict prevention of self-approval).
- **Multi-Factor Transparent Leaderboard Formula**:
  - Verified task completion: **25%**
  - On-time completion rate: **20%**
  - MOM preparation & quality: **20%**
  - Attendance sheet accuracy: **15%**
  - Meeting & event coordination: **10%**
  - Reviewer-assessed quality score: **10%**
  *(Weights are fully adjustable in Society Settings)*

---

## 🚀 Running the Project

```bash
# 1. Start the production server
npm run start

# 2. Or run the local development server with hot-reload
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database & Supabase Integration

- **Local Persistence**: Zero-setup ACID JSON file database persisted at `data/db.json`.
- **Supabase PostgreSQL Schema**: Full production schema ready at `supabase/schema.sql` with Row Level Security (RLS) policies.
- See `SUPABASE_SETUP.md` for instructions on connecting to your Supabase project and setting up Google OAuth.
