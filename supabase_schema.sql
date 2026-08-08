-- ========================================================
-- SUPABASE DATABASE SCHEMA & SEED DATA FOR TO-DO LIST APP
-- Paste this script directly into Supabase SQL Editor and click RUN
-- ========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Boards Table
CREATE TABLE IF NOT EXISTS public.boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  "boardId" TEXT NOT NULL,
  "taskName" TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  assignees JSONB DEFAULT '[]'::jsonb,
  "createdBy" TEXT NOT NULL,
  "createdOn" TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- TABLE PERMISSIONS & ROW LEVEL SECURITY (RLS) POLICIES
-- Fixes permission denied (42501) for anon & authenticated roles
-- ========================================================

GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.boards TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tasks TO anon, authenticated, service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write access to users" ON public.users;
DROP POLICY IF EXISTS "Allow public read/write access to boards" ON public.boards;
DROP POLICY IF EXISTS "Allow public read/write access to tasks" ON public.tasks;

CREATE POLICY "Allow public read/write access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to boards" ON public.boards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- SEED DATA FROM DB.JSON
-- ========================================================

-- Insert Initial Users
INSERT INTO public.users (id, "fullName", username, password) VALUES
  ('1', 'John Doe', 'john', '123456'),
  ('2', 'Jane Smith', 'jane', '123456'),
  ('3', 'Alex Rivera', 'alex', '123456'),
  ('LQzmYAv_Lf4', 'Rajith', 'rajithyes', '123456'),
  ('fE8sOoneE9E', 'Siva Bharrath', 'sivayes', '123456'),
  ('dTI8RkXKYUo', 'Aravind MS', 'aravindms', '123456'),
  ('y0jpCjXHtJQ', 'Keerthigan', 'keerthigan', '123456'),
  ('3g6zEQHLAww', 'Pranesh Karan', 'praneshkaran', '123456'),
  ('D7PKjWXQMMM', 'Harish Karan', 'harishkaran', '123456'),
  ('RVkr83UjNMQ', 'Jaison SL', 'jaisonsl', '123456')
ON CONFLICT (id) DO NOTHING;

-- Insert Initial Boards
INSERT INTO public.boards (id, name, "createdBy") VALUES
  ('1', 'Product Roadmap 2026', '1'),
  ('2', 'Sprint Alpha - Mobile App', '1'),
  ('3', 'Marketing & Launch', '2'),
  ('7HkUYYLHPgU', 'hi', '1'),
  ('qn3zUOWh9vI', 'hey', 'LQzmYAv_Lf4')
ON CONFLICT (id) DO NOTHING;

-- Insert Initial Tasks
INSERT INTO public.tasks (id, "boardId", "taskName", description, status, assignees, "createdBy", "createdOn") VALUES
  ('1', '1', 'Design Authentication UI', 'Create high-fidelity mockups for Login and Signup flows using Material components.', 'Completed', '["1", "2"]'::jsonb, '1', '2026-08-01'),
  ('2', '1', 'Implement JSON Server Backend', 'Configure mock REST API endpoint with users, boards, and tasks collections.', 'Completed', '["1"]'::jsonb, '1', '2026-08-02'),
  ('3', '1', 'Build Kanban Drag and Drop', 'Integrate Angular CDK Drag & Drop across the 5 status columns.', 'In Progress', '["1", "3"]'::jsonb, '1', '2026-08-03'),
  ('4', '1', 'Setup Dashboard Analytics', 'Embed Chart.js pie chart and summary table with status filters and sorting.', 'In Testing', '["2"]'::jsonb, '1', '2026-08-04'),
  ('5', '1', 'Write E2E Verification Tests', 'Verify task creation, moving, searching, and user profile updates.', 'Todo', '["3"]'::jsonb, '1', '2026-08-05'),
  ('6', '1', 'Optimize Responsive Mobile Drawer', 'Ensure navigation sidebar collapses seamlessly on mobile viewports.', 'Backlog', '["1", "2"]'::jsonb, '1', '2026-08-06'),
  ('7', '2', 'Push Notification Service', 'Configure FCM web push triggers for assigned tasks.', 'Backlog', '["2", "3"]'::jsonb, '1', '2026-08-05'),
  ('8', '2', 'Biometric Authentication', 'Support Face ID and Fingerprint login on iOS/Android.', 'Todo', '["1"]'::jsonb, '1', '2026-08-06'),
  ('9', '3', 'Landing Page Copywriting', 'Draft value propositions, feature highlights, and SaaS testimonials.', 'Completed', '["2"]'::jsonb, '2', '2026-08-04'),
  ('10', '3', 'Social Media Campaign Launch', 'Prepare graphics and scheduled tweets for product release announcement.', 'In Progress', '["2", "3"]'::jsonb, '2', '2026-08-07'),
  ('qNPga71XwuA', '7HkUYYLHPgU', 'new one', 'hey yo', 'In Progress', '["1", "2"]'::jsonb, '1', '2026-08-07'),
  ('rnYCHtnl398', 'qn3zUOWh9vI', 'task1', 'task1', 'Backlog', '["1", "2", "3", "LQzmYAv_Lf4", "fE8sOoneE9E", "dTI8RkXKYUo", "y0jpCjXHtJQ", "3g6zEQHLAww", "D7PKjWXQMMM", "RVkr83UjNMQ"]'::jsonb, 'LQzmYAv_Lf4', '2026-08-07'),
  ('3RmcSia34Ec', 'qn3zUOWh9vI', 'task2', 'task2', 'In Progress', '[]'::jsonb, 'LQzmYAv_Lf4', '2026-08-07'),
  ('yfUD-0rB2Ds', 'qn3zUOWh9vI', 'task3', '', 'Todo', '["LQzmYAv_Lf4"]'::jsonb, 'LQzmYAv_Lf4', '2026-08-07'),
  ('J38rDg00yxo', 'qn3zUOWh9vI', 'task4', 'atask4', 'In Testing', '["2", "LQzmYAv_Lf4"]'::jsonb, 'LQzmYAv_Lf4', '2026-08-07'),
  ('vcyaRY-ZDls', 'qn3zUOWh9vI', 'task5', 'rajith', 'Todo', '["3", "LQzmYAv_Lf4"]'::jsonb, 'LQzmYAv_Lf4', '2026-08-07'),
  ('kY8BE72N1m8', 'qn3zUOWh9vI', 'task6', 'task6', 'Todo', '[]'::jsonb, 'LQzmYAv_Lf4', '2026-08-08')
ON CONFLICT (id) DO NOTHING;
