-- Jarvis-Board Database Schema
-- Run this in Supabase SQL Editor

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
  position INTEGER DEFAULT 0,
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

-- Public read/write access (for authenticated users and anon)
DROP POLICY IF EXISTS "Allow public read tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public insert tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public update tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public delete tasks" ON tasks;

CREATE POLICY "Allow public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert tasks" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete tasks" ON tasks FOR DELETE USING (true);

-- Activity log policies
DROP POLICY IF EXISTS "Allow public read activity" ON activity_log;
DROP POLICY IF EXISTS "Allow public insert activity" ON activity_log;

CREATE POLICY "Allow public read activity" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert activity" ON activity_log FOR INSERT WITH CHECK (true);

-- Settings policies
DROP POLICY IF EXISTS "Allow public read settings" ON settings;
DROP POLICY IF EXISTS "Allow public update settings" ON settings;
DROP POLICY IF EXISTS "Allow public insert settings" ON settings;

CREATE POLICY "Allow public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public update settings" ON settings FOR UPDATE USING (true);
CREATE POLICY "Allow public insert settings" ON settings FOR INSERT WITH CHECK (true);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
  ('aging_thresholds', '{"doing": 4, "blocked": 1}'),
  ('notifications', '{"webhook": "", "email": ""}')
ON CONFLICT (key) DO NOTHING;

-- Create indexes
DROP INDEX IF EXISTS idx_tasks_status_position;
DROP INDEX IF EXISTS idx_tasks_status;

CREATE INDEX idx_tasks_status_position ON tasks(status, position);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_activity_task_id ON activity_log(task_id);

SELECT '✅ Jarvis-Board Database Schema Created Successfully!' as result;
