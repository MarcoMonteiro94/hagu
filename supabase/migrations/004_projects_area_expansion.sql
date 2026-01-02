-- Projects Area Expansion Migration
-- This migration:
-- 1. Expands the projects table with new columns
-- 2. Creates objectives, milestones, and project_metrics tables
-- 3. Updates the default "Hobbies" area to "Projects"
-- 4. Adds objective_id to tasks and project_id to habits

-- ============================================
-- EXPAND PROJECTS TABLE
-- ============================================

-- Add new columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(user_id, status);

-- ============================================
-- OBJECTIVES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  "order" INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_objectives_project ON objectives(project_id);
CREATE INDEX IF NOT EXISTS idx_objectives_user ON objectives(user_id);
CREATE INDEX IF NOT EXISTS idx_objectives_status ON objectives(project_id, status);

-- ============================================
-- MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'missed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON milestones(project_id, target_date);

-- ============================================
-- PROJECT METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS project_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(50),
  target_value NUMERIC,
  current_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_metrics_project ON project_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_project_metrics_user ON project_metrics(user_id);

-- ============================================
-- PROJECT METRIC ENTRIES TABLE (History)
-- ============================================
CREATE TABLE IF NOT EXISTS project_metric_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES project_metrics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metric_entries_metric ON project_metric_entries(metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_entries_date ON project_metric_entries(metric_id, date);

-- ============================================
-- ADD OBJECTIVE_ID TO TASKS
-- ============================================
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS objective_id UUID REFERENCES objectives(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_objective ON tasks(objective_id);

-- ============================================
-- ADD PROJECT_ID TO HABITS
-- ============================================
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_habits_project ON habits(project_id);

-- ============================================
-- UPDATE DEFAULT AREA: HOBBIES -> PROJECTS
-- ============================================
UPDATE life_areas
SET
  name = 'Projects',
  slug = 'projects',
  icon = 'rocket'
WHERE
  slug = 'hobbies'
  AND is_default = TRUE;

-- Also update the trigger for new users
CREATE OR REPLACE FUNCTION create_default_areas()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO life_areas (user_id, name, slug, color, icon, is_default, "order")
  VALUES
    (NEW.id, 'Health', 'health', '#22c55e', 'heart', TRUE, 0),
    (NEW.id, 'Studies', 'studies', '#3b82f6', 'book', TRUE, 1),
    (NEW.id, 'Finances', 'finances', '#eab308', 'wallet', TRUE, 2),
    (NEW.id, 'Projects', 'projects', '#a855f7', 'rocket', TRUE, 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================

-- Enable RLS
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_metric_entries ENABLE ROW LEVEL SECURITY;

-- Objectives policies
CREATE POLICY "Users can view own objectives" ON objectives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own objectives" ON objectives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own objectives" ON objectives FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own objectives" ON objectives FOR DELETE USING (auth.uid() = user_id);

-- Milestones policies
CREATE POLICY "Users can view own milestones" ON milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own milestones" ON milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own milestones" ON milestones FOR DELETE USING (auth.uid() = user_id);

-- Project metrics policies
CREATE POLICY "Users can view own project_metrics" ON project_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own project_metrics" ON project_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project_metrics" ON project_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own project_metrics" ON project_metrics FOR DELETE USING (auth.uid() = user_id);

-- Project metric entries policies
CREATE POLICY "Users can view own project_metric_entries" ON project_metric_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own project_metric_entries" ON project_metric_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own project_metric_entries" ON project_metric_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own project_metric_entries" ON project_metric_entries FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_objectives_updated_at ON objectives;
CREATE TRIGGER update_objectives_updated_at
  BEFORE UPDATE ON objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON milestones;
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_metrics_updated_at ON project_metrics;
CREATE TRIGGER update_project_metrics_updated_at
  BEFORE UPDATE ON project_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
