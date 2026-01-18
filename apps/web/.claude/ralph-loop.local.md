---
active: true
iteration: 1
max_iterations: 50
completion_promise: "COMPLETE"
started_at: "2026-01-18T13:29:32Z"
---

Complete Next.js to React Native Migration - Visual Parity & Quality Assurance.

Skills to use:
* Read frontend-design for design quality guidelines
* Read software-engineering before starting any code work
* Apply design thinking principles: avoid generic AI aesthetics, commit to bold and intentional design choices

Context:
* Migrating web app (Next.js) to mobile app (React Native)
* Current state: Migration started but layout/design significantly different from web
* Goal: Achieve visual parity with web version, optimized for mobile UX

Requirements:

Phase 0 - Project Discovery & State Mapping:
* Read available skills before starting any work
* Map complete structure of Next.js project (pages, components, styles, assets)
* Map complete structure of React Native project (screens, components, theme)
* Create inventory: screens in web vs screens in mobile
* Identify gaps: missing screens, components, features
* Document current tech stack on both sides:
  * UI libraries (styled-components, tailwind, native-base, etc.)
  * State management (redux, zustand, context, etc.)
  * Navigation patterns
* Extract design tokens from web: colors, typography, spacing, shadows
* Generate a comprehensive migration status report

Phase 1 - Visual Gap Analysis:
* Screenshot or document each web screen
* Compare with current React Native implementation
* Document all visual discrepancies:
  * Color palette (extract exact hex values)
  * Typography (font families, sizes, weights, line-heights)
  * Spacing system (margins, paddings, gaps)
  * Component styling (buttons, inputs, cards, headers, modals)
  * Icons and assets
  * Animations and transitions
  * Shadows and elevation
* Create prioritized fix list by impact

Phase 2 - Design System Implementation:
* Create/update theme.ts with exact web values:
  * Colors (primary, secondary, background, text, etc.)
  * Typography scale matching web
  * Spacing scale (4, 8, 12, 16, 24, 32, etc.)
  * Border radius values
  * Shadow/elevation values
* Implement design tokens as constants
* Ensure dark/light mode parity if applicable
* Document the design system for team reference

Phase 3 - Component Migration & Visual Fixes:
* Fix all identified visual discrepancies systematically
* Migrate remaining components with pixel-perfect attention
* Apply frontend-design skill principles:
  * Intentional typography choices
  * Cohesive color application
  * Proper spatial composition
  * Meaningful animations/transitions
* Adapt web patterns to React Native appropriately:
  * CSS Grid/Flexbox → RN Flexbox
  * hover states → press states
  * scroll behaviors → FlatList/ScrollView optimizations
* Ensure touch targets minimum 44px
* Implement proper keyboard handling (KeyboardAvoidingView)
* Add loading, error, and empty states matching web

Phase 4 - Testing & Quality Assurance:
* Write unit tests for utility functions and helpers
* Add component tests using React Native Testing Library
* Implement integration tests for critical user flows
* Target minimum 80% code coverage
* Fix all ESLint/TypeScript errors
* Run accessibility audit (a11y)
* Performance profiling (avoid unnecessary re-renders)

Phase 5 - UX Polish & Final Review:
* Smooth navigation transitions (react-navigation animations)
* Optimize list performance (FlatList, memo, useCallback)
* Test thoroughly on iOS and Android simulators/devices
* Verify SafeAreaView handling on all screens
* Final side-by-side visual comparison with web
* Update README and component documentation

Success criteria:
* Phase 0 report generated with complete project state
* All visual discrepancies documented and fixed
* Design system implemented and documented
* All web screens/features present in mobile
* Tests passing with >80% coverage
* Zero linter/TypeScript errors
* Smooth 60fps performance
* Passes accessibility checks
* Documentation complete and up-to-date

Output <promise>COMPLETE</promise> when all phases done.
