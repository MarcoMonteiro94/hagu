-- Hagu Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LIFE AREAS
-- ============================================
CREATE TABLE life_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
  icon VARCHAR(50) NOT NULL DEFAULT 'star',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_slug UNIQUE (user_id, slug)
);

CREATE INDEX idx_life_areas_user ON life_areas(user_id);

-- ============================================
-- HABITS
-- ============================================
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  frequency_type VARCHAR(20) NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'specificDays', 'monthly')),
  frequency_data JSONB DEFAULT '{}',
  tracking_type VARCHAR(20) NOT NULL CHECK (tracking_type IN ('boolean', 'quantitative')),
  tracking_target NUMERIC,
  tracking_unit VARCHAR(50),
  color VARCHAR(20) NOT NULL DEFAULT '#22c55e',
  icon VARCHAR(50),
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_habits_user ON habits(user_id);
CREATE INDEX idx_habits_area ON habits(area_id);
CREATE INDEX idx_habits_archived ON habits(user_id, archived_at);

-- Habit completions
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_habit_date UNIQUE (habit_id, date)
);

CREATE INDEX idx_habit_completions_habit ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, date);

-- ============================================
-- PROJECTS
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_area ON projects(area_id);

-- ============================================
-- TASKS
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  tags TEXT[] DEFAULT '{}',
  estimated_minutes INTEGER,
  recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurrence_interval INTEGER,
  recurrence_end_date DATE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_area ON tasks(area_id);
CREATE INDEX idx_tasks_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(user_id, due_date);

-- Subtasks
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subtasks_task ON subtasks(task_id);

-- ============================================
-- METRICS
-- ============================================
CREATE TABLE metric_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES life_areas(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(20),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metrics_user ON metric_entries(user_id);
CREATE INDEX idx_metrics_area_type ON metric_entries(area_id, type);
CREATE INDEX idx_metrics_date ON metric_entries(user_id, date);

-- ============================================
-- GAMIFICATION
-- ============================================
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  habits_completed INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  data JSONB DEFAULT '{}',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_achievement UNIQUE (user_id, type)
);

CREATE INDEX idx_achievements_user ON achievements(user_id);

CREATE TABLE habit_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,

  CONSTRAINT unique_user_habit_streak UNIQUE (user_id, habit_id)
);

CREATE INDEX idx_streaks_user ON habit_streaks(user_id);

-- ============================================
-- FINANCES
-- ============================================
CREATE TABLE transaction_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_key VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_user ON transaction_categories(user_id);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id VARCHAR(100) NOT NULL, -- Can be default category ID or UUID
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL,
  description VARCHAR(500) NOT NULL,
  date DATE NOT NULL,
  payment_method VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  recurrence_next_date DATE,
  recurrence_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_type ON transactions(user_id, type);

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id VARCHAR(100) NOT NULL,
  monthly_limit NUMERIC(12, 2) NOT NULL,
  month VARCHAR(7) NOT NULL,

  CONSTRAINT unique_budget_category_month UNIQUE (user_id, category_id, month)
);

CREATE INDEX idx_budgets_user ON budgets(user_id);

CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deadline DATE,
  color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
  icon VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_goals_user ON financial_goals(user_id);

CREATE TABLE goal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contributions_goal ON goal_contributions(goal_id);

-- ============================================
-- POMODORO
-- ============================================
CREATE TABLE pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  focus_minutes INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pomodoro_user_date ON pomodoro_sessions(user_id, date);

-- ============================================
-- USER SETTINGS
-- ============================================
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(10) NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  locale VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
  week_starts_on SMALLINT NOT NULL DEFAULT 0 CHECK (week_starts_on IN (0, 1)),
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  user_name VARCHAR(100),
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  pomodoro_settings JSONB NOT NULL DEFAULT '{
    "focusDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "sessionsBeforeLongBreak": 4,
    "autoStartBreaks": false,
    "autoStartFocus": false
  }',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE life_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Life Areas policies
CREATE POLICY "Users can view own life_areas" ON life_areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own life_areas" ON life_areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own life_areas" ON life_areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own life_areas" ON life_areas FOR DELETE USING (auth.uid() = user_id);

-- Habits policies
CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

-- Habit completions policies
CREATE POLICY "Users can view own habit_completions" ON habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own habit_completions" ON habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit_completions" ON habit_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit_completions" ON habit_completions FOR DELETE USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Subtasks policies (through task ownership)
CREATE POLICY "Users can view own subtasks" ON subtasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can create own subtasks" ON subtasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can update own subtasks" ON subtasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "Users can delete own subtasks" ON subtasks FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

-- Metric entries policies
CREATE POLICY "Users can view own metric_entries" ON metric_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own metric_entries" ON metric_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metric_entries" ON metric_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own metric_entries" ON metric_entries FOR DELETE USING (auth.uid() = user_id);

-- User stats policies
CREATE POLICY "Users can view own user_stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own user_stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own achievements" ON achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Habit streaks policies
CREATE POLICY "Users can view own habit_streaks" ON habit_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own habit_streaks" ON habit_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit_streaks" ON habit_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Transaction categories policies
CREATE POLICY "Users can view own transaction_categories" ON transaction_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transaction_categories" ON transaction_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transaction_categories" ON transaction_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transaction_categories" ON transaction_categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- Financial goals policies
CREATE POLICY "Users can view own financial_goals" ON financial_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own financial_goals" ON financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial_goals" ON financial_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial_goals" ON financial_goals FOR DELETE USING (auth.uid() = user_id);

-- Goal contributions policies
CREATE POLICY "Users can view own goal_contributions" ON goal_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own goal_contributions" ON goal_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pomodoro sessions policies
CREATE POLICY "Users can view own pomodoro_sessions" ON pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pomodoro_sessions" ON pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own user_settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own user_settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create user_stats and user_settings on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user stats
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id);

  -- Create user settings
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);

  -- Create default life areas
  INSERT INTO life_areas (user_id, name, slug, color, icon, is_default, "order")
  VALUES
    (NEW.id, 'Health', 'health', '#22c55e', 'heart', TRUE, 0),
    (NEW.id, 'Studies', 'studies', '#3b82f6', 'book', TRUE, 1),
    (NEW.id, 'Finances', 'finances', '#eab308', 'wallet', TRUE, 2),
    (NEW.id, 'Hobbies', 'hobbies', '#a855f7', 'palette', TRUE, 3);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
