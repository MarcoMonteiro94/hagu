---
active: true
iteration: 1
max_iterations: 30
completion_promise: "COMPLETE"
started_at: "2026-01-18T21:26:40Z"
---

Hagu Mobile - Critical Bug Fixes, Data Integration & Visual Verification.

Skills to use:
- Read frontend-design for design quality guidelines
- Read software-engineering if available for code best practices

Context:
- React Native/Expo app migration from Next.js
- Several critical UI bugs and Supabase integration issues
- Screenshots show broken layouts and wrong colors

PHASE 0 - SETUP PLAYWRIGHT FOR VISUAL TESTING:

0.1 Configure Playwright:
- Install @playwright/test if not present
- Configure playwright.config.ts for mobile viewport testing
- Create test directory structure
- Set up screenshot comparison baseline

0.2 Create Visual Regression Tests:
- Test for Saúde (Health) page layout
- Test for Conquistas (Achievements) page layout
- Test for Finanças (Finance) page colors
- Test for Login page styling
- Test for Nova Transação modal
- Run tests to capture current broken state

PHASE 1 - FIX BROKEN LAYOUTS (Priority: CRITICAL):

1.1 Saúde (Health) Page - COMPLETELY BROKEN:
- Text is rendering VERTICALLY instead of horizontally
- Cards layout is broken - should be grid/horizontal layout
- Labels 'Peso', 'Humor', 'Energia', 'Sono', 'Água' should be horizontal text
- Values like '86.5kg' should display normally
- Fix the metric cards to match proper card layout
- Check flexbox/layout styles - likely missing flexDirection or width

1.2 Conquistas (Achievements) Page - TEXT TRUNCATED:
- Achievement names are truncated incorrectly ('Pri m...', 'Sequê ncia')
- Card layout is too small or text wrapping is wrong
- Fix card sizing to show full achievement names
- Ensure proper numberOfLines and ellipsizeMode if needed
- Prefer showing full text over truncation

1.3 Run Playwright Tests:
- Verify Saúde layout is now horizontal and readable
- Verify Conquistas shows full text
- Screenshot comparison with expected layout

PHASE 2 - FIX COLOR/THEME ISSUES (Priority: HIGH):

2.1 Finanças (Finance) - WRONG PURPLE COLOR:
- The purple (#8b5cf6 violet) is NOT the project standard
- Check web app theme colors for this section
- Replace hardcoded purple with proper theme colors from theme.ts
- Fix: Saldo card, Receita/Despesa badges
- Fix: Categorias/Metas/Orçamentos/Análises buttons
- Use colors.accent or colors.primary from theme

2.2 Nova Transação - INPUT FOCUS WRONG:
- Input border/focus color showing red/wrong color
- Should use theme accent or primary color for focus
- Fix all TextInput focus states globally
- Check for hardcoded colors in input components

2.3 Login Screen - AUTOFILL BACKGROUND:
- Autofill input background color is wrong
- Fix autofill styles using proper RN techniques
- Verify text colors: placeholder, filled text, labels
- Test on both iOS and Android autofill

2.4 Run Playwright Tests:
- Verify Finanças uses correct theme colors
- Verify input focus states are correct
- Screenshot all fixed screens

PHASE 3 - FIX AUTHENTICATION ISSUES (Priority: CRITICAL):

3.1 Login Check on App Start:
- App is NOT checking if user is logged in on startup
- Implement auth check in app/_layout.tsx or root layout
- Use Supabase auth.getSession() on mount
- Use onAuthStateChange listener for session changes
- Redirect to /(auth)/login if no session
- Redirect to /(tabs) if session exists
- Show loading state while checking auth

3.2 Remove Social Login:
- Remove Google login button/option completely
- Remove Discord login button/option completely
- Remove any other social login options
- Keep only email/password login
- Clean up unused OAuth code and dependencies
- Update UI to only show email/password form

3.3 Run Playwright Tests:
- Test auth flow: unauthenticated user sees login
- Test auth flow: authenticated user sees home
- Verify social login buttons are gone

PHASE 4 - FIX SUPABASE DATA NOT LOADING (Priority: CRITICAL):

4.1 Debug Data Fetching:
- Add console.log to check auth state on app load
- Log session token to verify it exists
- Check if auth token is being sent with Supabase requests
- Verify React Query is configured with auth context
- Check Supabase client singleton configuration

4.2 Fix Common Issues:
- Verify EXPO_PUBLIC_SUPABASE_URL in .env
- Verify EXPO_PUBLIC_SUPABASE_ANON_KEY in .env
- Ensure auth session is passed to Supabase client
- Check RLS policies allow reads for authenticated users
- Verify user_id filter matches auth.uid() in queries

4.3 Verify Each Module Loads Data:
- Habits: Test useHabits hook returns real data
- Tasks: Test useTasks hook returns real data
- Finances: Test useTransactions hook returns real data
- Health: Test health metrics hooks return real data
- Projects: Test useProjects hook returns real data

4.4 Run Playwright Tests:
- Verify screens show real data, not empty states
- Test data appears after login
- Screenshot all screens with loaded data

PHASE 5 - FINAL VERIFICATION:

5.1 Run Full Playwright Test Suite:
- Execute all visual regression tests
- Compare before/after screenshots
- Generate test report

5.2 Manual Checklist Verification:
- [ ] Saúde page displays cards horizontally with readable text
- [ ] Conquistas shows full achievement names without weird breaks
- [ ] Finanças uses correct theme colors (no hardcoded purple)
- [ ] Input focus uses correct theme color across app
- [ ] Login autofill has correct background color
- [ ] App checks auth on startup and redirects appropriately
- [ ] Social login buttons completely removed
- [ ] Real user data loads from Supabase after login
- [ ] All screens show actual data, not empty states
- [ ] Dark mode works correctly on all fixed screens

5.3 Document Changes:
- List all files modified
- List all bugs fixed
- Note any remaining issues found

Output <promise>COMPLETE</promise> when done.
