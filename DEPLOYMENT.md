# Enactus VIPS-TC HR Portal — Production Deployment & Local Setup Guide

This guide details the deployment of the Enactus HR Portal across **Vercel** (Frontend / Fullstack), **Render** (Backend Web Service), and **Supabase** (PostgreSQL Database & Auth), as well as running the portal locally.

---

## 1. Architecture Overview

- **Frontend & Fullstack Framework**: Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- **Database**: PostgreSQL hosted on **Supabase** with Row-Level Security (RLS) and automated schema migrations.
- **Local Fallback Persistence**: `data/db.json` with synchronous atomic file persistence for zero-dependency local development when Supabase credentials are not provided.
- **Security & Cryptography**: Native PBKDF2 with unique cryptographic salt per user, constant-time comparison against timing attacks, immutable audit logging with role-based restriction.
- **Design System**: TeamHub mint-green and crisp white light palette (`#F7F9F7`, `#FFFFFF`, `#2FC3A5`, `#0D5143`, `#E7F3D7`, `#DDF7EF`, `#E3EBE7`).

---

## 2. Supabase PostgreSQL Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** &rarr; **API** and copy:
   - **Project URL** (`https://xyzcompany.supabase.co`)
   - **anon / public key** (`eyJhb...`)
   - **service_role key** (secret key for server-side operations)
3. Open the **SQL Editor** in your Supabase dashboard:
   - Run the initial schema migration located at:
     ```
     supabase/migrations/20261023000000_init_enactus_portal.sql
     ```
   - (Optional for development/demo testing) Run the development seed script:
     ```
     supabase/seed.sql
     ```
4. Verify that tables (`departments`, `members`, `meetings`, `moms`, `mom_edit_requests`, `attendance`, `tasks`, `audit_logs`, etc.) and Row Level Security policies are active.

---

## 3. Deploying to Vercel (Recommended for Frontend & Serverless API)

Vercel provides native deployment for Next.js 14 App Router with zero server maintenance.

1. Push your repository to GitHub / GitLab.
2. In the Vercel dashboard, click **"Add New Project"** and import the repository.
3. Keep default build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Add the following **Environment Variables** in Vercel:
   | Variable | Value | Notes |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | From Supabase API settings |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<your-anon-key>` | Public client key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `<your-service-role-key>` | Secret key for server routes |
   | `SESSION_SECRET` | 64+ char random hex string | Session encryption secret |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-domain>.vercel.app` | Production app domain |
   | `NODE_ENV` | `production` | Set by Vercel automatically |
5. Click **Deploy**. Vercel will build and serve the application globally.

---

## 4. Deploying to Render (Node.js Web Service)

If you prefer running a dedicated Node.js container or backend service on Render:

### Option A: Using `render.yaml` Blueprint (Automated)
1. Go to **Render Dashboard** &rarr; **Blueprints** &rarr; **New Blueprint Instance**.
2. Connect your repository. Render will automatically detect `render.yaml`.
3. Provide the required secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`).

### Option B: Manual Setup
1. Create a **New Web Service** connected to your repository.
2. Configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/api/health`
3. Under **Environment Variables**, add:
   - `PORT=10000`
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (generate using `openssl rand -hex 32`)
   - `NEXT_PUBLIC_APP_URL`
4. Deploy the service. The service will verify healthy deployment via `/api/health`.

---

## 5. Localhost Development

To run the application locally on your machine:

```powershell
# 1. Install dependencies
npm install

# 2. Copy the example environment variables
cp .env.example .env.local

# 3. Start local development server
npm run dev
```

Open `http://localhost:3000` in your web browser.

### Development Accounts (Password for all: `Admin@123`)

| Role | Email | Capabilities |
|---|---|---|
| **Developer** | `developer@enactusvips.org` | Full audit log access, system oversight, developer debugging tools |
| **President** | `president@enactusvips.org` | Full organization audit logs, society settings, approval authority |
| **Department Head (HOD)** | `digital.head@enactusvips.org` | Department audit logs, MoM review & unlock approval, member oversight |
| **HR Admin** | `hr.admin@enactusvips.org` | MoM drafting & publishing, attendance recording, edit requests |
| **Secondary HR** | `secondaryhr.digital@enactusvips.org` | Department-level attendance recording & MoM assistance |
| **Member** | `member@enactusvips.org` | Personal attendance stats, assigned tasks, attended MoMs view |

---

## 6. Key Verification Endpoints & Features

- **Health Endpoint**: `GET /api/health` — returns system uptime, service status, and active database mode (`supabase` vs `local_storage`).
- **Audit Logs**: `GET /api/audit` — immutable append-only logs restricted strictly to Developers & President (society-wide) or HODs (department-scoped).
- **Combined Meetings & MoM**: Access via `/meetings-mom` (unified attendance cards, live quorum tracking, MoM drafting and publishing workflow).
- **Active Team Sheet**: Access via `/members` (customizable columns, row checkboxes, XLSX/CSV export with automatic audit logging).
- **Leaderboards**: Access via `/leaderboard` (Section A: HR Performance, Section B: Member Attendance).
- **Department Hubs**: Access via `/departments` (department progress %, member roster, and clickable member portfolio modals).
