# PASHU PULSE — Supabase & Vercel Integration Guide

This guide walks you through connecting **PASHU PULSE** to **Supabase** (PostgreSQL) and deploying onto **Vercel** as a unified multi-service project.

---

## Part 1: Supabase Setup (3 Minutes)

### 1. Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com) and click **"New Project"**.
2. Select your Organization, enter Project Name: `pashu-pulse`, set a database password, and pick a region near India (e.g. `ap-south-1` Mumbai or `ap-southeast-1` Singapore).

### 2. Run Database Schema & Seeds
1. In your Supabase dashboard, navigate to **SQL Editor** (left sidebar).
2. Click **"New Query"**.
3. Copy the complete contents of [`supabase/schema.sql`](../supabase/schema.sql) and paste them into the query editor.
4. Click **"Run"** (Ctrl+Enter / Cmd+Enter).
   - This creates all 11 tables (`users`, `animals`, `health_events`, `vets`, `cases`, `sos_requests`, `village_clusters`, `family_members`, `activity_logs`, `reminders`, `symptom_rules`).
   - Seeds verified Mandya & Mysuru veterinarians and regional outbreak alert clusters.

### 3. Get Your Database Connection String
1. In Supabase, go to **Project Settings** (gear icon) ➔ **Database**.
2. Scroll to **Connection string** and select **URI** with **Connection Pooling (Port 6543 / Session or Transaction mode)**:
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
3. Copy your **Project URL** and **anon public key** from **Project Settings** ➔ **API**:
   - `SUPABASE_URL`: `https://[PROJECT-REF].supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Part 2: Configure Environment Variables in Vercel

In your [Vercel Dashboard](https://vercel.com/dashboard):
1. Go to your **PASHU PULSE** project ➔ **Settings** ➔ **Environment Variables**.
2. Add the following variables (for **Production**, **Preview**, and **Development**):

| Key | Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase Pooler URI |
| `SECRET_KEY` | *(Generate a 32+ char random string)* | JWT Signing Secret |
| `APP_ENV` | `production` | Environment mode |
| `DEBUG` | `False` | Disable debug logs in prod |
| `CORS_ORIGINS` | `["*"]` | Cross-Origin permission |
| `SUPABASE_URL` | `https://[PROJECT-REF].supabase.co` | Supabase API endpoint |
| `SUPABASE_ANON_KEY` | `your-anon-public-key` | Client access key |

---

## Part 3: Deploy to Vercel

Because `vercel.json` and multi-service routing are pre-configured in this repository, any git push triggers a complete multi-service build:

```bash
git push origin main
```

Vercel will automatically:
1. Build the frontend Vite SPA (`services.app`) with client-side fallback.
2. Build the FastAPI Python backend (`services.backend`).
3. Route `/api/*` to FastAPI and `/*` to React.
