// Database types generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      life_areas: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          color: string
          icon: string
          is_default: boolean
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          color?: string
          icon?: string
          is_default?: boolean
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          color?: string
          icon?: string
          is_default?: boolean
          order?: number
          created_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          area_id: string | null
          title: string
          description: string | null
          frequency_type: 'daily' | 'weekly' | 'specificDays' | 'monthly'
          frequency_data: Json
          tracking_type: 'boolean' | 'quantitative'
          tracking_target: number | null
          tracking_unit: string | null
          color: string
          icon: string | null
          order: number
          created_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          area_id?: string | null
          title: string
          description?: string | null
          frequency_type: 'daily' | 'weekly' | 'specificDays' | 'monthly'
          frequency_data?: Json
          tracking_type: 'boolean' | 'quantitative'
          tracking_target?: number | null
          tracking_unit?: string | null
          color?: string
          icon?: string | null
          order?: number
          created_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          area_id?: string | null
          title?: string
          description?: string | null
          frequency_type?: 'daily' | 'weekly' | 'specificDays' | 'monthly'
          frequency_data?: Json
          tracking_type?: 'boolean' | 'quantitative'
          tracking_target?: number | null
          tracking_unit?: string | null
          color?: string
          icon?: string | null
          order?: number
          created_at?: string
          archived_at?: string | null
        }
      }
      habit_completions: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          date: string
          value: number
          completed_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          date: string
          value?: number
          completed_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          date?: string
          value?: number
          completed_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          area_id: string | null
          title: string
          description: string | null
          color: string | null
          created_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          area_id?: string | null
          title: string
          description?: string | null
          color?: string | null
          created_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          area_id?: string | null
          title?: string
          description?: string | null
          color?: string | null
          created_at?: string
          archived_at?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          area_id: string | null
          title: string
          description: string | null
          due_date: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent' | null
          status: 'pending' | 'in_progress' | 'done'
          tags: string[]
          estimated_minutes: number | null
          recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_interval: number | null
          recurrence_end_date: string | null
          order: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          area_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null
          status?: 'pending' | 'in_progress' | 'done'
          tags?: string[]
          estimated_minutes?: number | null
          recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_interval?: number | null
          recurrence_end_date?: string | null
          order?: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          area_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null
          status?: 'pending' | 'in_progress' | 'done'
          tags?: string[]
          estimated_minutes?: number | null
          recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurrence_interval?: number | null
          recurrence_end_date?: string | null
          order?: number
          created_at?: string
          completed_at?: string | null
        }
      }
      subtasks: {
        Row: {
          id: string
          task_id: string
          title: string
          done: boolean
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          title: string
          done?: boolean
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          title?: string
          done?: boolean
          order?: number
          created_at?: string
        }
      }
      metric_entries: {
        Row: {
          id: string
          user_id: string
          area_id: string
          type: string
          value: number
          unit: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          area_id: string
          type: string
          value: number
          unit?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          area_id?: string
          type?: string
          value?: number
          unit?: string | null
          date?: string
          created_at?: string
        }
      }
      user_stats: {
        Row: {
          user_id: string
          total_xp: number
          level: number
          habits_completed: number
          tasks_completed: number
          current_streak: number
          longest_streak: number
          updated_at: string
        }
        Insert: {
          user_id: string
          total_xp?: number
          level?: number
          habits_completed?: number
          tasks_completed?: number
          current_streak?: number
          longest_streak?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_xp?: number
          level?: number
          habits_completed?: number
          tasks_completed?: number
          current_streak?: number
          longest_streak?: number
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          type: string
          data: Json
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          data?: Json
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          data?: Json
          unlocked_at?: string
        }
      }
      habit_streaks: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          current_streak: number
          longest_streak: number
          last_completed_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          habit_id: string
          current_streak?: number
          longest_streak?: number
          last_completed_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string
          current_streak?: number
          longest_streak?: number
          last_completed_date?: string | null
        }
      }
      transaction_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          name_key: string
          type: 'income' | 'expense'
          icon: string
          color: string
          is_custom: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          name_key: string
          type: 'income' | 'expense'
          icon: string
          color: string
          is_custom?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          name_key?: string
          type?: 'income' | 'expense'
          icon?: string
          color?: string
          is_custom?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string
          type: 'income' | 'expense'
          amount: number
          description: string
          date: string
          payment_method: string | null
          tags: string[]
          is_recurring: boolean
          recurrence_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrence_next_date: string | null
          recurrence_end_date: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          type: 'income' | 'expense'
          amount: number
          description: string
          date: string
          payment_method?: string | null
          tags?: string[]
          is_recurring?: boolean
          recurrence_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrence_next_date?: string | null
          recurrence_end_date?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          type?: 'income' | 'expense'
          amount?: number
          description?: string
          date?: string
          payment_method?: string | null
          tags?: string[]
          is_recurring?: boolean
          recurrence_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null
          recurrence_next_date?: string | null
          recurrence_end_date?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          monthly_limit: number
          month: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          monthly_limit: number
          month: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          monthly_limit?: number
          month?: string
        }
      }
      financial_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          target_amount: number
          current_amount: number
          deadline: string | null
          color: string
          icon: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          target_amount: number
          current_amount?: number
          deadline?: string | null
          color?: string
          icon?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          target_amount?: number
          current_amount?: number
          deadline?: string | null
          color?: string
          icon?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      goal_contributions: {
        Row: {
          id: string
          goal_id: string
          user_id: string
          amount: number
          date: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          user_id: string
          amount: number
          date: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          user_id?: string
          amount?: number
          date?: string
          note?: string | null
          created_at?: string
        }
      }
      pomodoro_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          focus_minutes: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          focus_minutes: number
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          focus_minutes?: number
          completed_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          theme: 'dark' | 'light' | 'system'
          locale: string
          week_starts_on: number
          notifications_enabled: boolean
          onboarding_completed: boolean
          user_name: string | null
          currency: string
          pomodoro_settings: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          theme?: 'dark' | 'light' | 'system'
          locale?: string
          week_starts_on?: number
          notifications_enabled?: boolean
          onboarding_completed?: boolean
          user_name?: string | null
          currency?: string
          pomodoro_settings?: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          theme?: 'dark' | 'light' | 'system'
          locale?: string
          week_starts_on?: number
          notifications_enabled?: boolean
          onboarding_completed?: boolean
          user_name?: string | null
          currency?: string
          pomodoro_settings?: Json
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Specific table types
export type DbLifeArea = Tables<'life_areas'>
export type DbHabit = Tables<'habits'>
export type DbHabitCompletion = Tables<'habit_completions'>
export type DbProject = Tables<'projects'>
export type DbTask = Tables<'tasks'>
export type DbSubtask = Tables<'subtasks'>
export type DbMetricEntry = Tables<'metric_entries'>
export type DbUserStats = Tables<'user_stats'>
export type DbAchievement = Tables<'achievements'>
export type DbHabitStreak = Tables<'habit_streaks'>
export type DbTransaction = Tables<'transactions'>
export type DbBudget = Tables<'budgets'>
export type DbFinancialGoal = Tables<'financial_goals'>
export type DbGoalContribution = Tables<'goal_contributions'>
export type DbPomodoroSession = Tables<'pomodoro_sessions'>
export type DbUserSettings = Tables<'user_settings'>
