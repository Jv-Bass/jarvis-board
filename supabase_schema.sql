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
CREATE POLICY "Allow authenticated insert tasks" ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() IS NULL);
CREATE POLICY "Allow authenticated update tasks" ON tasks FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() IS NULL);
CREATE POLICY "Allow authenticated delete tasks" ON tasks FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert activity" ON activity_log FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() IS NULL);
CREATE POLICY "Allow authenticated update activity" ON activity_log FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() IS NULL);

CREATE POLICY "Allow authenticated update settings" ON settings FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() IS NULL);
CREATE POLICY "Allow authenticated insert settings" ON settings FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() IS NULL);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
  ('aging_thresholds', '{"doing": 4, "blocked": 1}'),
  ('notifications', '{"webhook": "", "email": ""}')
ON CONFLICT (key) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_activity_task_id ON activity_log(task_id);

-- Add some sample tasks for testing
INSERT INTO tasks (title, description, expectations, priority, status, tags) VALUES
  ('Set up Jarvis-Board deployment', 'Deploy the Jarvis-Board app to Vercel', 'App accessible at vercel.app URL', 1, 'doing', '["deployment", "frontend"]'),
  ('Configure Supabase database', 'Set up Supabase project with required tables', 'Database tables created and accessible', 2, 'backlog', '["backend", "database"]'),
  ('Add authentication', 'Implement password-based authentication', 'Login page working with password gate', 1, 'backlog', '["backend", "security"]');

SELECT 'Jarvis-Board Database Schema Created Successfully!' as result;
