# Jarvis-Board - 5-MINUTE DEPLOY

## Option A: Use Existing Supabase (Fastest)

The Attendance System Supabase can be reused. Just run the SQL schema (it creates separate tables):

1. Go to: https://supabase.com/dashboard
2. Select project: **attendance-system** (or create new)
3. Go to **SQL Editor** → New query
4. Copy/paste `supabase_schema.sql` → Run

---

## Option B: Create New Supabase (Recommended)

1. Go to: https://supabase.com
2. Click **New Project**
3. Details:
   - Name: `jarvis-board`
   - Database Password: (copy it!)
4. Wait 2 min for setup
5. Go to **Settings → API**
6. Copy: **Project URL** and **anon public** key

---

## Quick Deploy (GitHub → Vercel)

### 1. Create GitHub Repo
```
https://github.com/new
- Name: jarvis-board
- Private ✓
- Create
```

### 2. Push Code (in PowerShell)
```powershell
cd "Desktop/Clawdette Files\Work-Systems\Jarvis-Board"
git remote add origin https://github.com/YOURNAME/jarvis-board.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel
1. Go to: https://vercel.com
2. **Import Project** → select `jarvis-board`
3. **Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL = [your-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-anon-key]
AUTH_PASSWORD = jarvis2026
```
4. Click **Deploy**!

---

## 4. Test It Out!

- Go to your Vercel URL
- Login with: `jarvis2026`
- Create tasks, drag cards, test everything 5x

---

## Troubleshooting

### "Table doesn't exist"
→ Run `supabase_schema.sql` in Supabase SQL Editor

### "Auth error"
→ Check your Supabase URL and anon key are correct in Vercel

### Worker not running
→ Add cron in Vercel: `*/5 * * * *` → `https://your-app.vercel.app/api/worker`
