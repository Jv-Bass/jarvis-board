# Jarvis-Board Specification

## Project Overview
- **Name:** Jarvis-Board
- **Type:** Real-time Kanban Task Management Web App
- **Core Functionality:** A private, AI-powered task board where OpenClaw manages and tracks work autonomously
- **Target Users:** Jose Victor Basalo (Boss) and OpenClaw AI Assistant

---

## UI/UX Specification

### Layout Structure

**Main Layout:**
- Fixed sidebar (left, 280px) - Navigation & filters
- Main content area - Kanban board / other views
- Fixed header (top, 64px) - Logo, user info, notifications

**Responsive Breakpoints:**
- Desktop: 1200px+ (full sidebar)
- Tablet: 768px-1199px (collapsible sidebar)
- Mobile: <768px (bottom nav, stacked columns)

### Visual Design (Jarvis Style)

**Color Palette:**
- Primary Background: `#0a0a0f` (deep black)
- Secondary Background: `#12121a` (dark panel)
- Accent Primary: `#00d4ff` (cyan/Jarvis glow)
- Accent Secondary: `#ff6b00` (warning orange)
- Success: `#00ff88` (neon green)
- Error/Blocked: `#ff3366` (hot pink)
- Text Primary: `#ffffff`
- Text Secondary: `#8888aa`
- Border: `#2a2a3a`

**Typography:**
- Font Family: `"Orbitron"` for headers, `"Rajdhani"` for body (Iron Man Jarvis vibe)
- Header: 24px bold
- Subheader: 18px semibold
- Body: 14px regular
- Small: 12px

**Spacing System:**
- Base unit: 8px
- Card padding: 16px
- Column gap: 16px
- Section margin: 24px

**Visual Effects:**
- Cards: `box-shadow: 0 4px 20px rgba(0, 212, 255, 0.1)`
- Hover: `box-shadow: 0 8px 30px rgba(0, 212, 255, 0.2)` + slight scale(1.02)
- Active card: `border: 1px solid #00d4ff`
- Glowing accents on key elements
- Smooth transitions: 200ms ease

### Components

**1. Sidebar:**
- Logo with Jarvis animation
- Navigation: Kanban, This Week, Aging, Calendar, Settings
- Quick stats (tasks per column)
- User profile section

**2. Kanban Column:**
- Header with column name + task count
- Scrollable card container
- Drop zone highlight on drag
- Column colors:
  - Backlog: `#3a3a5a`
  - This Week: `#ffaa00`
  - Currently Doing: `#00d4ff` (glowing)
  - Blocked: `#ff3366`
  - Done: `#00ff88`

**3. Task Card:**
- Priority indicator (left border color)
- Title (bold, white)
- Description preview (2 lines max)
- Tags (colored badges)
- Due date (if set)
- Blocker reason (if blocked)
- Check/test log (if in Done)
- Drag handle

**4. Card Modal (Edit/View):**
- Full task details
- Editable fields
- Activity log
- Comments section

**5. Notification Bell:**
- Badge count
- Dropdown with recent notifications

---

## Functionality Specification

### Core Features

**1. Authentication:**
- Password gate (simple, secure)
- Session-based auth with cookies
- Protected routes

**2. Kanban Board:**
- 5 columns: Backlog, This Week, Currently Doing, Blocked, Done
- Drag & drop between columns
- Real-time sync via Supabase Realtime
- Optimistic UI updates

**3. Task Management:**
- Create task (title, description, expectations, priority, due date, tags)
- Edit task
- Delete task
- Assign priority (P1-P4, set by Boss only)
- Add tags/labels

**4. Auto-Moving Rules:**
- Start work → auto-move to "Currently Doing"
- Blocked → move to "Blocked" + fill reason + ping Boss
- Finished → move to "Done" + self-verify 3x

**5. Views:**
- **Kanban:** Default board view
- **This Week:** Filter tasks due this week + "This Week" column
- **Aging:** Highlight stale tasks
- **Calendar:** Due date calendar view

**6. Notifications:**
- In-app notifications
- Configurable (email, Discord webhook)

**7. Background Worker:**
- Cron job to check board state
- Auto-start next task when current is done
- Aging alerts
- Runs on Vercel (schedule/cron)

### Data Model (Supabase)

```sql
-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  expectations TEXT,
  priority INTEGER DEFAULT 3, -- 1=highest, 4=lowest
  status TEXT DEFAULT 'backlog', -- backlog, this_week, doing, blocked, done
  due_date DATE,
  blocker_reason TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  moved_to_doing_at TIMESTAMPTZ,
  test_log JSONB DEFAULT '[]',
  created_by TEXT DEFAULT 'system'
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  action TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB
);
```

---

## Acceptance Criteria

1. ✅ Board loads with 5 columns
2. ✅ Can create, edit, delete tasks
3. ✅ Drag & drop updates status in real-time
4. ✅ Password gate protects the app
5. ✅ Background worker auto-moves tasks
6. ✅ Aging view shows stale tasks
7. ✅ Calendar view shows tasks by due date
8. ✅ Notifications work (in-app + webhook)
9. ✅ Deployed on Vercel
10. ✅ Jarvis-style UI with glowing effects

---

## Deployment

**Stack:**
- Frontend: Next.js 14 (App Router)
- Backend: Next.js API Routes
- Database: Supabase (PostgreSQL)
- Realtime: Supabase Realtime
- Auth: NextAuth.js with password provider
- Drag & Drop: @dnd-kit
- Styling: Tailwind CSS
- Deployment: Vercel

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=
NEXT_PUBLIC_APP_URL=
```
