# Jarvis-Board 🤖

AI-Powered Real-time Kanban Task Management Dashboard

## Features

- 📋 **Kanban Board** - Drag & drop task management with 5 columns
- 🔄 **Real-time Updates** - Supabase Realtime sync across all clients
- 🔒 **Password Authentication** - Simple but secure password gate
- ⚡ **Auto-Worker** - Background task automation (auto-start, aging alerts)
- 🎨 **Jarvis UI** - Iron Man-inspired dark theme with cyan accents
- 📅 **Multiple Views** - Kanban, This Week, Aging, Calendar

## Quick Deploy to Vercel

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key
3. Go to SQL Editor and run the contents of `supabase_schema.sql`

### Step 2: Deploy to Vercel

```bash
# Clone and install
git clone https://github.com/your-username/jarvis-board
cd jarvis-board
npm install

# Add environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Deploy
npm run build
vercel deploy --prod
```

### Step 3: Configure Environment Variables in Vercel

Add these in Vercel Project Settings:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `AUTH_PASSWORD` | Your chosen password |
| `CRON_SECRET` | Random string for worker security |

### Step 4: Set Up Cron Job (Optional)

In Vercel, add a Cron job:

```bash
# Run every 5 minutes
*/5 * * * * curl -X POST https://your-app.vercel.app/api/worker
```

## How It Works

### Board Columns

1. **Backlog** - Future tasks
2. **This Week** - Tasks targeted for this week
3. **Currently Doing** - Active task (only ONE at a time!)
4. **Blocked** - Tasks waiting on something
5. **Done** - Completed tasks

### Task Card Fields

- **Title** - Required task name
- **Description** - What needs doing
- **Acceptance Criteria** - How we know it's done
- **Priority** - P1 (critical) to P4 (low)
- **Due Date** - Optional deadline
- **Blocker Reason** - Required if in Blocked
- **Tags** - Labels like frontend, backend, bug, etc.

### Auto-Worker Rules

The background worker runs every 5 minutes and:

1. ✅ **Auto-starts next task** - If nothing in "Doing", finds highest priority task and starts it
2. ⚠️ **Aging alerts** - Notifies if task in "Doing" > 4 hours
3. 🚫 **Still blocked alerts** - Notifies if task in "Blocked" > 1 hour
4. 📢 **Discord notifications** - Sends alerts to configured webhook

### For Clawdette (AI)

Rules to follow:

1. **ONE task at a time** - Never have more than one card in "Currently Doing"
2. **Start task → Move to "Doing"** - Immediately update status when starting
3. **Blocked → Fill reason** - If waiting, move to Blocked with clear blocker reason
4. **Done → Self-verify 3x** - Test thoroughly before marking Done
5. **Check board every hour** - Use worker or check manually for new tasks
6. **Never idle** - If current task done, immediately pick next highest priority

## Project Structure

```
jarvis-board/
├── app/
│   ├── api/
│   │   ├── auth/         # Authentication endpoints
│   │   └── worker/       # Background cron worker
│   ├── login/           # Login page
│   ├── globals.css      # Global styles (Jarvis theme)
│   ├── layout.js        # Root layout
│   └── page.jsx        # Kanban board
├── components/
│   ├── KanbanColumn.jsx # Column component
│   ├── Sidebar.jsx     # Navigation sidebar
│   ├── TaskCard.jsx    # Draggable task card
│   └── TaskModal.jsx  # Create/edit modal
├── lib/
│   └── supabase.js     # Supabase client & schema
├── .env.example        # Environment template
├── next.config.js      # Next.js config
├── tailwind.config.js  # Tailwind theme
└── README.md           # This file
```

## Customization

### Change Password

Edit `AUTH_PASSWORD` in your environment variables.

### Add Discord Notifications

1. Create a Discord webhook
2. Add it to `DISCORD_WEBHOOK` env variable

### Change Aging Thresholds

Update in database:

```sql
UPDATE settings SET value = '{"doing": 6, "blocked": 2}' WHERE key = 'aging_thresholds';
```

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **DnD**: @dnd-kit

## License

MIT - Build something cool!
