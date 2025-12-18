# Hagu

Life Management & Planning PWA - Habit tracker, task manager, and life area organizer.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand with localStorage persistence
- **i18n**: next-intl (pt-BR, en-US)
- **PWA**: next-pwa

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
src/
├── app/            # Next.js App Router pages
├── components/     # React components
│   ├── ui/         # shadcn/ui components
│   ├── habits/     # Habit components
│   ├── tasks/      # Task components
│   ├── areas/      # Life area components
│   └── shared/     # Shared components
├── stores/         # Zustand stores
├── types/          # TypeScript types
├── hooks/          # Custom hooks
├── messages/       # i18n translations
├── lib/            # Utilities
└── config/         # App configuration
```

## Documentation

- [SCOPE.md](./SCOPE.md) - Full project scope and feature breakdown
- [CLAUDE.md](./CLAUDE.md) - Development guidelines and standards
