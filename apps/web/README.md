# Hagu Web Application

Life Management & Planning PWA built with Next.js 15, TypeScript, and Tailwind CSS.

## Design System

The application uses a clean, professional design system inspired by modern dashboard interfaces.

### Color Tokens

**Light Theme:**
- Background: `#f8f9fb` (clean off-white)
- Card: `#ffffff` (pure white)
- Primary: `#4f6ef7` (professional blue)
- Foreground: `#1a1d26` (dark charcoal)

**Dark Theme:**
- Background: `#0f1117` (deep dark)
- Card: `#1a1d26` (elevated surface)
- Primary: `#6b8aff` (bright blue)
- Foreground: `#f9fafb` (light text)

### Semantic Colors

- `--success`: `#10b981` (green)
- `--warning`: `#f59e0b` (amber)
- `--info`: `#3b82f6` (blue)
- `--destructive`: `#ef4444` (red)

### Component Variants

**Card Component:**
- `default`: Standard card with subtle shadow
- `elevated`: Card with elevated shadow
- `outlined`: Dashed border, transparent background
- `ghost`: No background or border

### Shadow System

- `shadow-card`: Subtle shadow for cards
- `shadow-card-hover`: Elevated shadow on hover
- `shadow-card-elevated`: Higher elevation shadow

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Testing

### Unit Tests (Vitest)

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report
```

#### E2E Test Structure

Tests are located in the `e2e/` directory:

- `auth.spec.ts` - Authentication flow tests (login, signup)
- `home.spec.ts` - Home page tests
- `navigation.spec.ts` - Navigation and PWA feature tests

#### Playwright Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- **Browsers**: Chromium, Firefox, WebKit, and mobile viewports
- **Base URL**: `http://localhost:3000`
- **Auto-server**: Starts dev server automatically before tests
- **Artifacts**: Screenshots, videos, and traces on failure

## Playwright MCP Integration

This project is configured to work with the Playwright MCP (Model Context Protocol) server for enhanced debugging capabilities.

### Configuration

The Playwright MCP server is configured in `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### MCP Capabilities

With Playwright MCP, you can:

- **Browser Automation**: Control browser instances programmatically
- **Visual Testing**: Capture screenshots and compare visual states
- **Accessibility Testing**: Analyze page accessibility trees
- **Performance Monitoring**: Collect performance metrics
- **Cross-browser Testing**: Test across Chromium, Firefox, and WebKit

### Using MCP for Debugging

1. Start a Playwright MCP session to inspect page state
2. Use accessibility tree snapshots for element identification
3. Capture screenshots for visual debugging
4. Record traces for step-by-step analysis

## Scripts Reference

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run unit tests |
| `pnpm test:coverage` | Run unit tests with coverage |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm test:e2e:ui` | Run Playwright with UI mode |
| `pnpm test:e2e:debug` | Run Playwright in debug mode |
| `pnpm test:e2e:report` | View Playwright test report |
