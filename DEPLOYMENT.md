# Deploying the Goodwill Store Order app (plain English)

This guide is for getting the app onto **Vercel** with a **Supabase** Postgres database so orders and catalog data survive deploys and restarts.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Create a new project (pick a region close to your users).
3. Wait until the database finishes provisioning.

You do **not** need to turn on Supabase Auth for this app—we only use Supabase as a managed Postgres database.

---

## 2. Copy the database connection strings

1. In Supabase: **Project Settings** → **Database**.
2. You need two connection strings:
   - **Pooled / Transaction mode** (often port **6543**, may include `pooler` and `pgbouncer`) — use this for **`DATABASE_URL`** (what the Next.js app uses on Vercel).
   - **Direct / Session mode** (often port **5432**) — use this for **`DIRECT_URL`** (what Prisma uses to run **migrations** reliably).

3. Replace `[YOUR-PASSWORD]` with the database password you chose when creating the project.

Keep these strings private. You will paste them into Vercel in the next step.

---

## 3. Set environment variables in Vercel

1. Open your project in the [Vercel dashboard](https://vercel.com).
2. Go to **Settings** → **Environment Variables**.
3. Add (at minimum):

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | **Transaction pooler** — Supavisor / PgBouncer, port **6543**, host `*.pooler.supabase.com`, query string must include `pgbouncer=true` (and often `connect_timeout=30`). **Do not** use `db.<project>.supabase.co:5432` here — Vercel’s runtime often cannot reach the direct host. |
   | `DIRECT_URL` | **Direct** Postgres — `db.<project-ref>.supabase.co:5432` (or Supabase “Session” URI). Used for `prisma migrate deploy` during build/CLI, **not** for normal Prisma Client queries in the app. |

   Example shapes (password must be **URL-encoded** if it contains special characters):

   ```env
   DATABASE_URL="postgresql://postgres.<project-ref>:ENCODED_PASSWORD@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=30"
   DIRECT_URL="postgresql://postgres:ENCODED_PASSWORD@db.<project-ref>.supabase.co:5432/postgres"
   ```

4. Apply them to **Production** (and **Preview** if you want preview deployments to use a database).
5. **Redeploy** after changing variables so serverless functions pick up new values.

**Local vs production**

- **Your computer** (`.env`): for seeding and `npm run dev`, you may set both `DATABASE_URL` and `DIRECT_URL` to the **direct** `db.…:5432` URI so you avoid pooler issues.  
- **Vercel**: `DATABASE_URL` **must** be the **pooled** `6543` URI for the live site to connect reliably.

---

## 4. Run Prisma migrations against Supabase

Migrations create the tables (`Store`, `Product`, `Order`, `OrderLine`). You run them **once per environment** (and again whenever the team adds a new migration file).

**Recommended:** from your computer, with `DATABASE_URL` and `DIRECT_URL` pointing at Supabase:

```bash
npx prisma migrate deploy
```

**Alternative (includes migrations in the Vercel build):** in Vercel → **Settings** → **General** → **Build & Development Settings**, set **Build Command** to:

```bash
npm run build:vercel
```

That runs `prisma migrate deploy`, then `prisma generate`, then `next build`. Use this only if your Vercel project has the database env vars available at build time (they usually do).

- **`prisma migrate dev`** — use on your **own machine** when you are **developing** schema changes; it creates migration files and applies them to your local (or dev) database.
- **`prisma migrate deploy`** — use for **production** (and for Supabase when you are not creating new migrations). It **only applies** existing migration files and does **not** reset or wipe data.

---

## 5. Optional: seed baseline catalog data

Seeding fills stores and products the first time. It is **not** meant to run on every deploy.

`prisma db seed` runs your seed script using the **Prisma Client**, which connects with **`DATABASE_URL`** (see `prisma/schema.prisma`). It does **not** use `DIRECT_URL` for queries.

**On your computer:** For seeding and other local Prisma commands, point **`DATABASE_URL`** at the **direct** Postgres host (`db.<project>.supabase.co`, port **5432**), same as **`DIRECT_URL`**. The **transaction pooler** (port **6543**) is intended for **Vercel/serverless** runtime, not for local scripts—using the pooler locally can cause **“Can’t reach … :6543”** or **`Circuit breaker open`** errors.

Ensure the password in the URI is **URL-encoded** if it contains special characters.

From your computer (with `.env` using direct `5432` URLs for local seeding):

```bash
npx prisma generate
npx prisma migrate status
npm run db:seed
```

Run this after migrations on a **new empty database**, or when your team intentionally wants to bootstrap catalog data. Do **not** add seeding to the Vercel “start” or “build” command for production unless you fully understand the implications.

### If seed still fails (connection-path checks)

Treat as a **connection** problem before changing application code:

- Wrong or rotated database password
- Password not **URL-encoded** in the connection string
- **`DATABASE_URL` still pointing at the transaction pooler (6543)** for local seed — switch both env vars to **direct `db.…:5432`** for local use
- Temporary Supabase pooler or database issue — wait a few minutes and retry; wake the project in the dashboard if it was paused
- Incorrect host copied from Supabase (direct `db.` vs pooler hostname)
- Network or IPv4 restrictions — try another network or Supabase’s **session pooler** guidance in their dashboard

---

## 6. Deploy to Vercel

1. Connect the Git repository to Vercel (or deploy with the Vercel CLI).
2. Use the default **Install Command** (`npm install`) and either:
   - **Build Command:** `npm run build` (if you already ran `migrate deploy` manually), or  
   - **Build Command:** `npm run build:vercel` (if you want migrations during build).
3. Deploy.

---

## 7. Verify everything works

1. **Admin login** — open the admin/password flow your app uses; confirm you can authenticate.
2. **Stores** — open store management / store list; confirm stores appear (from seed or your data).
3. **Products** — open the catalog and a few order forms; confirm products load.
4. **Orders** — place a test order, then confirm it appears in the orders hub and that totals look correct.

If something fails, check Vercel **Function logs** and confirm `DATABASE_URL` / `DIRECT_URL` are set correctly for that environment.

---

## Other database options (brief)

**Supabase** fits Prisma + Vercel well: standard Postgres, pooled and direct URLs, generous free tier.

**Neon** and **Railway Postgres** are also common—same idea: set `DATABASE_URL` (and `DIRECT_URL` if you use a pooler for the app). This repo is configured for Postgres + optional `directUrl`; you can point it at any Postgres host that gives you compatible connection strings.
