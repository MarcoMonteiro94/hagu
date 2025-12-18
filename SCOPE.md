# Hagu - Life Management & Planning App

> MVP Scope Document | PWA Frontend Application

## Vision

Hagu is a comprehensive life management application that combines habit tracking, task management, and life area organization into a unified daily experience. The app focuses on helping users build better habits, complete meaningful tasks, and track progress across all important areas of their lives.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | SSG, PWA support via next-pwa, modern React 19 features |
| UI Components | shadcn/ui + Tailwind CSS | Customizable, accessible, modern design system |
| State Management | Zustand | Simple, lightweight, excellent localStorage integration |
| Internationalization | next-intl | Type-safe i18n for Next.js App Router |
| Data Storage | localStorage (JSON) | MVP simplicity, easy debugging, no backend needed |
| PWA | next-pwa + Workbox | Offline support, installable, push notifications |

---

## Core Features

### 1. Habit Tracker

#### Tracking Types
- **Boolean habits**: Simple check (done/not done)
- **Quantitative habits**: Numeric tracking (e.g., 8 glasses of water, 30 min exercise)

#### Frequency Options
- Daily (every day)
- Weekly (X times per week)
- Specific days (Mon, Wed, Fri)
- Monthly (X times per month)
- Custom intervals

#### Gamification System
| Feature | Description |
|---------|-------------|
| Streaks | Consecutive days of completion |
| Points | XP earned per habit completion |
| Badges | Achievement unlocks for milestones |
| Levels | User progression based on total XP |
| Achievements | Special rewards for specific accomplishments |

#### Visualization
- **Heatmap calendar**: GitHub-style contribution graph
- **Progress bars**: Weekly/monthly completion rates
- **Streak counters**: Current and best streaks
- **Charts**: Trend analysis over time

---

### 2. Task Management

#### Structure
```
Life Area
└── Project
    └── Task
        └── Subtask (1 level)
```

#### Task Attributes
| Attribute | Type | Required |
|-----------|------|----------|
| Title | string | Yes |
| Description | string | No |
| Due date | date | No |
| Priority | low/medium/high/urgent | No |
| Category/Area | reference | No |
| Tags | string[] | No |
| Recurrence | pattern | No |
| Estimated time | minutes | No |
| Status | pending/in_progress/done | Yes |

#### Views
- **List view**: Chronological, grouped by date
- **Kanban board**: Drag-and-drop columns (To Do, Doing, Done)
- **Calendar view**: Monthly/weekly calendar with tasks

#### Habit Integration
- Daily habits appear as tasks in the daily agenda
- Unified "Today" view showing both habits and tasks
- Habits completion reflects in task completion stats

---

### 3. Life Areas (Modules)

#### Default Areas

##### Health
- Habit presets: Water, exercise, sleep, meditation, vitamins
- Metrics tracking: Weight, measurements, mood, energy level
- Goals: Health-related targets with progress tracking
- Evolution charts: Weight over time, habit consistency

##### Studies
- Pomodoro timer: 25/5 or custom intervals
- Subject/course organization: Track different learning paths
- Study time logging: Hours per subject/day
- Spaced repetition reminders: Review schedule for retention
- Study goals: Hours per week, courses to complete

##### Finances
- Income/expense tracking: Simple transaction logging
- Categories: Customizable expense/income categories
- Monthly budget: Set and track budget per category
- Financial goals: Savings targets, debt payoff
- Charts: Spending by category, income vs expenses

##### Hobbies (and Custom Areas)
- Users can create custom life areas
- Each area can have its own:
  - Habits
  - Projects/tasks
  - Metrics to track
  - Goals
  - Color theme

---

### 4. Home Screen (Daily Agenda)

The main screen focuses on **what to do today**:

```
┌─────────────────────────────────────┐
│  Today, December 18                 │
│  "Quote of the day" (optional)      │
├─────────────────────────────────────┤
│  HABITS (5/8 done)          [━━━━░] │
│  ☑ Morning meditation              │
│  ☑ Drink water (6/8 glasses)       │
│  ☐ Exercise                        │
│  ☐ Read 30 min                     │
│  ...                               │
├─────────────────────────────────────┤
│  TASKS FOR TODAY (3 pending)       │
│  ☐ Review project proposal  🔴     │
│  ☐ Call dentist            🟡     │
│  ☐ Buy groceries           🟢     │
├─────────────────────────────────────┤
│  QUICK STATS                       │
│  🔥 7-day streak | ⭐ Level 5      │
│  📊 This week: 85% habits done     │
└─────────────────────────────────────┘
```

---

### 5. PWA Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Installable | P0 | Add to home screen on mobile |
| Offline mode | P0 | Full functionality without internet |
| Push notifications | P1 | Habit reminders, task due dates |
| Background sync | P2 | Sync when connection restored (future) |
| Share target | P2 | Receive shared content as tasks |

---

### 6. Data Management

#### Storage Schema (localStorage)
```typescript
interface AppData {
  version: string
  user: UserSettings
  habits: Habit[]
  tasks: Task[]
  projects: Project[]
  areas: LifeArea[]
  metrics: MetricEntry[]
  achievements: Achievement[]
  streak: StreakData
}
```

#### Export/Import
- **Export**: Download all data as JSON file
- **Import**: Upload JSON to restore/migrate data
- **Format**: Human-readable, versioned schema

---

## Design System

### Theme
- **Primary**: Dark mode first
- **Secondary**: Light mode option
- **Approach**: Each life area has an accent color

### Typography
- Clean, readable sans-serif
- Good contrast for accessibility
- Responsive sizing

### Components (shadcn/ui)
- Cards for habit/task items
- Modals for create/edit forms
- Bottom navigation for mobile
- Sidebar for desktop
- Toast notifications for feedback

---

## Internationalization

### Supported Languages (MVP)
- Portuguese (BR) - pt-BR
- English (US) - en-US

### i18n Strategy
- All UI strings in translation files
- Date/number formatting per locale
- Easy to add new languages

---

## Information Architecture

```
/                     → Daily agenda (home)
/habits               → Habit list and management
/habits/[id]          → Habit detail and history
/tasks                → Task list (multiple views)
/tasks/[id]           → Task detail
/areas                → Life areas overview
/areas/[slug]         → Specific area (health, studies, etc.)
/areas/[slug]/[module]→ Area module (e.g., /areas/studies/pomodoro)
/stats                → Statistics and progress
/achievements         → Badges and achievements
/settings             → App settings
/settings/export      → Data export/import
```

---

## MVP Scope (Vertical Slice)

### Phase 1: Foundation
- [ ] Project setup (Next.js 15, Tailwind, shadcn/ui)
- [ ] PWA configuration
- [ ] Zustand store with localStorage persistence
- [ ] i18n setup (pt-BR, en-US)
- [ ] Design system and theme (dark/light)
- [ ] Base layout and navigation

### Phase 2: Health Area (Complete Vertical)
- [ ] Habit CRUD with all frequency options
- [ ] Boolean and quantitative tracking
- [ ] Daily check-in interface
- [ ] Health metrics (weight, mood)
- [ ] Heatmap calendar visualization
- [ ] Progress bars and basic stats
- [ ] Streak tracking

### Phase 3: Core Task System
- [ ] Task CRUD with all attributes
- [ ] List view with filters
- [ ] Integration with daily agenda
- [ ] Recurring tasks

### Phase 4: Gamification
- [ ] Points system
- [ ] Levels and XP
- [ ] Achievements/badges
- [ ] Stats dashboard

### Phase 5: Additional Areas
- [ ] Studies module (Pomodoro, subjects)
- [ ] Finances module (transactions, budget)
- [ ] Custom areas creation

### Phase 6: Polish
- [ ] Kanban view
- [ ] Calendar view
- [ ] Push notifications
- [ ] Data export/import
- [ ] Performance optimization

---

## Non-Goals (MVP)

- User authentication / accounts
- Backend API / database
- Data sync across devices
- Social features
- Native mobile apps
- AI/ML features
- Integrations with external services

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse PWA score | > 90 |
| Lighthouse Performance | > 80 |
| Lighthouse Accessibility | > 95 |
| Time to Interactive | < 3s |
| Offline functionality | 100% |
| Mobile usability | Excellent |

---

## Future Considerations

When evolving beyond MVP:

1. **Backend integration**: Supabase or similar for auth + sync
2. **Multi-device sync**: Real-time data synchronization
3. **Advanced analytics**: Insights and recommendations
4. **Widgets**: Home screen widgets for quick access
5. **Calendar integration**: Sync with Google Calendar, Apple Calendar
6. **Reminders**: Smart notification scheduling
7. **Templates**: Pre-built habit/task templates
8. **Community**: Share achievements, challenges

---

## References

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Zustand](https://zustand-demo.pmnd.rs)
- [next-pwa](https://github.com/shadowwalker/next-pwa)
- [next-intl](https://next-intl-docs.vercel.app)
