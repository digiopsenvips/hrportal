# Supabase & Google OAuth Configuration Guide

This application works **out of the box** with its built-in ACID JSON persistence engine, but is architected to seamlessly connect to a remote Supabase project.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account.
2. Click **New Project** and name it `enactus-vips-portal`.
3. Select your preferred database region (e.g. South Asia / Mumbai).

---

## 2. Execute SQL Schema

1. Open your Supabase Dashboard.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Open `supabase/schema.sql` from this repository.
4. Copy the entire file content, paste it into the SQL Editor, and click **Run**.
5. All tables (`departments`, `members`, `meetings`, `moms`, `attendance`, `tasks`, `events`, `announcements`, `notifications`, `society_settings`) and Row-Level Security policies will be created.

---

## 3. Configure Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a project and configure the **OAuth Consent Screen**.
3. Create **OAuth Client ID** credentials (Web Application).
4. In **Authorized redirect URIs**, add:
   ```
   https://<your-supabase-project-id>.supabase.co/auth/v1/callback
   ```
5. In Supabase Dashboard, go to **Authentication** -> **Providers** -> **Google**.
6. Enable Google and paste your **Client ID** and **Client Secret**.

---

## 4. Set Environment Variables

Create `.env.local` in the root of the project with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Next.js App Secret
NEXTAUTH_SECRET=super-secret-key-32-chars-minimum
NEXTAUTH_URL=http://localhost:3000
```
