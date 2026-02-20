import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

// Database schema for Jarvis-Board
export const DB_SCHEMA = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  expectations TEXT,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 4),
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'this_week', 'doing', 'blocked', 'done')),
  due_date DATE,
  blocker_reason TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  moved_to_doing_at TIMESTAMPTZ,
  test_log JSONB DEFAULT '[]',
  created_by TEXT DEFAULT 'system'
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read access (for authenticated users)
CREATE POLICY "Allow public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public read activity" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Allow public read settings" ON settings FOR SELECT USING (true);

-- Allow authenticated users to modify
CREATE POLICY "Allow authenticated insert tasks" ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update tasks" ON tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete tasks" ON tasks FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert activity" ON activity_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update activity" ON activity_log FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update settings" ON settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert settings" ON settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
  ('aging_thresholds', '{"doing": 4, "blocked": 1}'),
  ('notifications', '{"webhook": "", "email": ""}')
ON CONFLICT (key) DO NOTHING;
`

// Status constants
export const STATUSES = {
  BACKLOG: 'backlog',
  THIS_WEEK: 'this_week',
  DOING: 'doing',
  BLOCKED: 'blocked',
  DONE: 'done',
}

export const STATUS_LABELS = {
  backlog: 'Backlog',
  this_week: 'This Week',
  doing: 'Currently Doing',
  blocked: 'Blocked',
  done: 'Done',
}

export const STATUS_COLORS = {
  backlog: '#3a3a5a',
  this_week: '#ffaa00',
  doing: '#00d4ff',
  blocked: '#ff3366',
  done: '#00ff88',
}

export const PRIORITY_LABELS = {
  1: 'P1 - Critical',
  2: 'P2 - High',
  3: 'P3 - Medium',
  4: 'P4 - Low',
}

export const PRIORITY_COLORS = {
  1: '#ff3366',
  2: '#ff6b00',
  3: '#00d4ff',
  4: '#8888aa',
}
