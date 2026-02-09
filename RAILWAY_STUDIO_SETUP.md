# Setting Up Prisma Studio on Railway

Prisma Studio allows you to view and edit your database through a web interface, similar to Firebase Console.

## Option 1: Add as Separate Railway Service (Recommended)

1. **In Railway Dashboard:**
   - Go to your project
   - Click "New" → "Empty Service"
   - Name it "prisma-studio" or "database-admin"

2. **Configure the new service:**
   - **Source:** Connect to the same GitHub repository
   - **Root Directory:** Leave as default
   - **Build Command:** `npm install`
   - **Start Command:** `npm run studio`
   - **Port:** Set to `5555`

3. **Add Environment Variable:**
   - Go to the new service's "Variables" tab
   - Add: `DATABASE_URL=file:./prisma/dev.db`
   - **Important:** You need to share the database file between services

4. **Share Database Volume (Important!):**
   - Railway doesn't automatically share files between services
   - You have two options:
     - **Option A:** Use Railway's volume mounting (if available on your plan)
     - **Option B:** Use the same database file path and ensure both services can access it
     - **Option C:** Use Railway's PostgreSQL instead of SQLite (better for production)

## Option 2: Access via Railway Terminal (Quick Test)

1. **Open Railway Terminal:**
   - Go to your main service
   - Click "View Logs" → "Terminal" tab

2. **Run Prisma Studio:**
   ```bash
   npm run db:studio
   ```

3. **Access via Port Forwarding:**
   - Railway will show you a URL like: `https://your-app.up.railway.app`
   - Prisma Studio runs on port 5555
   - You may need to configure Railway to expose port 5555

## Option 3: Use Railway's PostgreSQL (Best for Production)

For better data management and multi-service access, consider migrating to PostgreSQL:

1. **Add PostgreSQL Service:**
   - In Railway: "New" → "Database" → "PostgreSQL"
   - Railway provides a connection URL

2. **Update Prisma Schema:**
   - Change `provider = "sqlite"` to `provider = "postgresql"`
   - Update `url` to use Railway's PostgreSQL connection string

3. **Benefits:**
   - Better web console access
   - Multiple services can access the same database
   - Better performance and scalability
   - Built-in backup options

## Current Limitation

**Important:** With SQLite on Railway, the database file is stored in your main service's filesystem. To access it from Prisma Studio running as a separate service, you'd need to:
- Use Railway volumes (if available)
- Or run Prisma Studio in the same service (Option 2)
- Or migrate to PostgreSQL (Option 3)

## Quick Access (Same Service)

The easiest way right now is to run Prisma Studio in your main service:

1. Open Railway Terminal for your main service
2. Run: `npm run db:studio`
3. Railway should expose it on a port (you may need to configure port 5555)
