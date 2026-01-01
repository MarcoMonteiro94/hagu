-- Migration: Studies Module (Notebooks & Pages) + Push Notifications
-- Date: 2026-01-01

-- =====================================================
-- NOTEBOOKS (Cadernos)
-- =====================================================
CREATE TABLE IF NOT EXISTS notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notebooks
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notebooks"
  ON notebooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notebooks"
  ON notebooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebooks"
  ON notebooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebooks"
  ON notebooks FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_order ON notebooks(user_id, "order");

-- =====================================================
-- NOTEBOOK PAGES (Notas/Páginas)
-- =====================================================
CREATE TABLE IF NOT EXISTS notebook_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES notebooks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '[]'::jsonb, -- BlockNote JSON content
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notebook_pages
ALTER TABLE notebook_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pages"
  ON notebook_pages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pages"
  ON notebook_pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages"
  ON notebook_pages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages"
  ON notebook_pages FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notebook_pages_notebook_id ON notebook_pages(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notebook_pages_user_id ON notebook_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_notebook_pages_order ON notebook_pages(notebook_id, "order");

-- =====================================================
-- PUSH SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL, -- { p256dh, auth }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- =====================================================
-- HABITS - Add reminder fields and notebook link
-- =====================================================
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS reminder_time TIME,
  ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notebook_id UUID REFERENCES notebooks(id) ON DELETE SET NULL;

-- Index for habits with reminders (for scheduled jobs)
CREATE INDEX IF NOT EXISTS idx_habits_reminder ON habits(user_id, reminder_enabled, reminder_time)
  WHERE reminder_enabled = true;

-- Index for habits linked to notebooks
CREATE INDEX IF NOT EXISTS idx_habits_notebook_id ON habits(notebook_id)
  WHERE notebook_id IS NOT NULL;

-- =====================================================
-- TASKS - Add notebook link for integration
-- =====================================================
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS notebook_id UUID REFERENCES notebooks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES notebook_pages(id) ON DELETE SET NULL;

-- Index for tasks linked to notebooks/pages
CREATE INDEX IF NOT EXISTS idx_tasks_notebook_id ON tasks(notebook_id)
  WHERE notebook_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_page_id ON tasks(page_id)
  WHERE page_id IS NOT NULL;

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_notebooks_updated_at ON notebooks;
CREATE TRIGGER update_notebooks_updated_at
  BEFORE UPDATE ON notebooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notebook_pages_updated_at ON notebook_pages;
CREATE TRIGGER update_notebook_pages_updated_at
  BEFORE UPDATE ON notebook_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
