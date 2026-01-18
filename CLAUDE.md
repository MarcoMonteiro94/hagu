# Hagu - Development Guidelines

> Life Management & Planning PWA

## Project Overview

- **Type**: PWA Frontend Application (MVP)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand with localStorage persistence
- **i18n**: next-intl (pt-BR, en-US)

## Architecture Principles

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/          # i18n routing
│   │   ├── (app)/         # Main app routes (with layout)
│   │   │   ├── page.tsx   # Home (daily agenda)
│   │   │   ├── habits/
│   │   │   ├── tasks/
│   │   │   ├── areas/
│   │   │   └── settings/
│   │   └── layout.tsx
│   └── manifest.ts        # PWA manifest
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── habits/            # Habit-specific components
│   ├── tasks/             # Task-specific components
│   ├── areas/             # Life area components
│   └── shared/            # Shared/common components
├── stores/                # Zustand stores
│   ├── habits.ts
│   ├── tasks.ts
│   ├── areas.ts
│   ├── achievements.ts
│   └── settings.ts
├── lib/                   # Utilities and helpers
│   ├── storage.ts         # localStorage helpers
│   ├── dates.ts           # Date utilities
│   ├── gamification.ts    # XP, levels, badges logic
│   └── utils.ts           # General utilities
├── types/                 # TypeScript types
│   ├── habit.ts
│   ├── task.ts
│   ├── area.ts
│   └── index.ts
├── hooks/                 # Custom React hooks
├── messages/              # i18n translation files
│   ├── pt-BR.json
│   └── en-US.json
└── config/                # App configuration
    ├── areas.ts           # Default life areas
    ├── achievements.ts    # Achievement definitions
    └── constants.ts       # App constants
```

### State Management Pattern

```typescript
// stores/habits.ts - Example pattern
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HabitsStore {
  habits: Habit[]
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void
  updateHabit: (id: string, updates: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  toggleHabitCompletion: (id: string, date: string) => void
}

export const useHabitsStore = create<HabitsStore>()(
  persist(
    (set, get) => ({
      habits: [],
      addHabit: (habit) => set((state) => ({
        habits: [...state.habits, {
          ...habit,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }]
      })),
      // ... other actions
    }),
    { name: 'hagu-habits' }
  )
)
```

### Component Patterns

```typescript
// Keep components pure - no constants/functions inside
const HABIT_COLORS = ['green', 'blue', 'purple'] as const

function getCompletionPercentage(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

export function HabitCard({ habit, onToggle }: HabitCardProps) {
  // Component body - pure render logic only
}
```

## Code Standards

### TypeScript
- Strict mode enabled
- Explicit return types on functions
- Use `type` for data shapes, `interface` for component props
- Avoid `any` - use `unknown` when needed
- Prefer discriminated unions for state

### Components
- Functional components only
- Use Suspense for loading states
- Error boundaries for error handling
- Keep components small and focused
- Extract logic to custom hooks

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HabitCard.tsx` |
| Hooks | camelCase, use prefix | `useHabits.ts` |
| Stores | camelCase, Store suffix | `habitsStore.ts` |
| Types | PascalCase | `Habit`, `Task` |
| Utils | camelCase | `formatDate.ts` |
| Constants | SCREAMING_SNAKE | `MAX_STREAK_DAYS` |

### File Naming
- Components: `ComponentName.tsx`
- Hooks: `use-hook-name.ts`
- Types: `type-name.ts`
- Utils: `util-name.ts`

## Data Models

### Core Types
```typescript
// types/habit.ts
type HabitFrequency =
  | { type: 'daily' }
  | { type: 'weekly'; daysPerWeek: number }
  | { type: 'specificDays'; days: number[] } // 0-6 (Sun-Sat)
  | { type: 'monthly'; timesPerMonth: number }

type HabitTracking =
  | { type: 'boolean' }
  | { type: 'quantitative'; target: number; unit: string }

interface Habit {
  id: string
  title: string
  description?: string
  areaId: string
  frequency: HabitFrequency
  tracking: HabitTracking
  color: string
  icon?: string
  completions: HabitCompletion[]
  createdAt: string
  archivedAt?: string
}

interface HabitCompletion {
  date: string // ISO date string (YYYY-MM-DD)
  value: number // 1 for boolean, actual value for quantitative
  completedAt: string // ISO datetime
}
```

```typescript
// types/task.ts
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
type TaskStatus = 'pending' | 'in_progress' | 'done'

interface Task {
  id: string
  title: string
  description?: string
  projectId?: string
  areaId?: string
  dueDate?: string
  priority?: TaskPriority
  status: TaskStatus
  tags: string[]
  estimatedMinutes?: number
  recurrence?: RecurrencePattern
  subtasks: Subtask[]
  createdAt: string
  completedAt?: string
}

interface Subtask {
  id: string
  title: string
  done: boolean
}
```

### Storage Keys
```typescript
const STORAGE_KEYS = {
  habits: 'hagu-habits',
  tasks: 'hagu-tasks',
  areas: 'hagu-areas',
  achievements: 'hagu-achievements',
  settings: 'hagu-settings',
  user: 'hagu-user',
} as const
```

## i18n Guidelines

### Translation Structure
```json
// messages/pt-BR.json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir"
  },
  "habits": {
    "title": "Hábitos",
    "addNew": "Novo hábito",
    "streak": "{count, plural, =0 {Sem sequência} =1 {# dia} other {# dias}}"
  },
  "areas": {
    "health": "Saúde",
    "studies": "Estudos",
    "finances": "Finanças"
  }
}
```

### Usage
```typescript
import { useTranslations } from 'next-intl'

function Component() {
  const t = useTranslations('habits')
  return <h1>{t('title')}</h1>
}
```

## PWA Configuration

### Service Worker
- Cache static assets
- Cache API responses (when implemented)
- Offline fallback page
- Background sync preparation

### Manifest
- App name: "Hagu"
- Short name: "Hagu"
- Theme color: Match dark mode primary
- Icons: Multiple sizes (192x192, 512x512)
- Display: standalone
- Orientation: portrait

## Testing Strategy

### Unit Tests (Vitest)
- Zustand store logic
- Utility functions
- Date calculations
- Gamification logic
- Service layer functions

```bash
pnpm test          # Run unit tests
pnpm test:coverage # Run with coverage report
```

### Component Tests
- Critical user flows
- Form validation
- State interactions

### E2E Tests (Playwright)
- Authentication flows (login, signup)
- Navigation and routing
- Home page functionality
- PWA features verification
- UI quality and visual consistency

```bash
pnpm test:e2e       # Run E2E tests
pnpm test:e2e:ui    # Interactive UI mode
pnpm test:e2e:debug # Debug mode
```

E2E tests are located in `apps/web/e2e/`:
- `auth.spec.ts` - Authentication flow tests
- `home.spec.ts` - Home page tests
- `navigation.spec.ts` - Navigation and PWA tests
- `ui-quality.spec.ts` - UI quality, accessibility, and visual consistency tests

### Playwright MCP Integration
The project is configured with Playwright MCP for enhanced debugging:
- Browser automation via accessibility tree
- Visual testing and screenshot capture
- Cross-browser testing (Chromium, Firefox, WebKit)
- Mobile viewport testing

## UI Design System

### Color Scheme
The app uses oklch color space for perceptually uniform colors:
- **Primary**: Vibrant indigo (`oklch(0.55 0.25 270)`)
- **Success**: Green for positive feedback
- **Warning**: Amber for alerts
- **Info**: Blue for informational elements

### Component Variants
Enhanced shadcn/ui components with custom variants:

**Card variants**:
- `default` - Standard card styling
- `elevated` - Raised with shadow effect
- `outlined` - Border only, no background
- `glass` - Glassmorphism effect

**Progress variants**:
- `default` - Standard progress bar
- `gradient` - Gradient fill
- `success` - Green color
- `warning` - Amber color

### Design Tokens
- **Border radius**: `0.75rem` (rounded-xl for cards)
- **Shadows**: Modern soft shadows with opacity
- **Animations**: Float, pulse-soft, shimmer, glow effects
- **Transitions**: 200-300ms for smooth interactions

### Responsive Design
- Mobile-first approach
- Bottom navigation on mobile
- Sidebar navigation on desktop (lg breakpoint)
- Consistent padding and spacing

## Performance Guidelines

- Use dynamic imports for heavy components
- Implement virtual scrolling for long lists
- Optimize images with next/image
- Minimize bundle size
- Lazy load non-critical features

## Git Workflow

### Branch Naming
- `feat/habit-tracking`
- `fix/streak-calculation`
- `refactor/store-structure`

### Commit Messages
- Conventional commits (brief and descriptive)
- No "Claude Code" references
- Examples:
  - `feat: add habit completion tracking`
  - `fix: correct streak calculation for weekly habits`
  - `refactor: extract gamification logic to separate module`

## Development Phases

Reference `SCOPE.md` for detailed phase breakdown:
1. Foundation (setup, PWA, stores, i18n)
2. Health Area (complete vertical slice)
3. Core Task System
4. Gamification
5. Additional Areas
6. Polish

## Commands

```bash
# Development
pnpm dev           # Start dev server
pnpm build         # Build for production

# Quality
pnpm typecheck     # TypeScript check
pnpm lint          # ESLint

# Unit Tests
pnpm test          # Run Vitest
pnpm test:coverage # With coverage

# E2E Tests (Playwright)
pnpm test:e2e       # Run all E2E tests
pnpm test:e2e:ui    # Interactive UI mode
pnpm test:e2e:debug # Debug mode
pnpm test:e2e:report # View HTML report
```
