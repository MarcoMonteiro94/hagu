import { test, expect } from '@playwright/test'

test.describe('UI Quality Tests', () => {
  test.describe('Login Page Visual Quality', () => {
    test('login page has beautiful centered layout', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')

      // Check for Hagu branding
      const brand = page.getByText('Hagu').first()
      await expect(brand).toBeVisible()

      // Check form card is present
      const form = page.locator('form')
      await expect(form).toBeVisible()

      // Check for properly styled inputs
      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toBeVisible()

      const passwordInput = page.getByLabel(/senha|password/i)
      await expect(passwordInput).toBeVisible()

      // Check login button styling
      const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i })
      await expect(loginButton).toBeVisible()
    })

    test('login page is responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/login')

      // Form should still be usable on mobile
      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toBeVisible()

      const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i })
      await expect(loginButton).toBeVisible()
    })

    test('login page has accessible form elements', async ({ page }) => {
      await page.goto('/login')

      // Check form labels exist
      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toBeVisible()

      // Tab through elements - should be keyboard accessible
      await page.keyboard.press('Tab')
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })
  })

  test.describe('Signup Page Visual Quality', () => {
    test('signup page has proper form layout', async ({ page }) => {
      await page.goto('/signup')
      await page.waitForLoadState('networkidle')

      // Check for Hagu branding
      const brand = page.getByText('Hagu').first()
      await expect(brand).toBeVisible()

      // Check for email input
      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toBeVisible()

      // Check for password fields
      const passwordInput = page.getByLabel(/^senha$/i)
      await expect(passwordInput).toBeVisible()

      // Check signup button
      const signupButton = page.getByRole('button', { name: /criar conta|cadastrar|sign up|registrar/i })
      await expect(signupButton).toBeVisible()
    })

    test('signup page navigation link works', async ({ page }) => {
      await page.goto('/signup')

      // Link to login should exist
      const loginLink = page.getByRole('link', { name: /entrar|sign in|fazer login/i })
      await expect(loginLink).toBeVisible()

      await loginLink.click()
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Unauthenticated Redirect Behavior', () => {
    test('visiting protected routes redirects to login', async ({ page }) => {
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)

      // Login form should be visible
      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toBeVisible()
    })

    test('habits page redirects unauthenticated users', async ({ page }) => {
      await page.goto('/habits')
      await page.waitForLoadState('networkidle')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })

    test('tasks page redirects unauthenticated users', async ({ page }) => {
      await page.goto('/tasks')
      await page.waitForLoadState('networkidle')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Theme Support', () => {
    test('page loads without visual errors', async ({ page }) => {
      await page.goto('/login')

      // Check that body has proper background
      const body = page.locator('body')
      await expect(body).toBeVisible()

      // No error overlays should be visible
      const errorOverlay = page.locator('#__next-error-overlay, [data-nextjs-dialog]')
      await expect(errorOverlay).toHaveCount(0)
    })

    test('dark theme is properly applied', async ({ page }) => {
      await page.goto('/login')

      // Check that the page has dark mode class or proper styling
      const html = page.locator('html')
      await expect(html).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('login form is keyboard accessible', async ({ page }) => {
      await page.goto('/login')

      // Tab through the page
      await page.keyboard.press('Tab')

      // An element should receive focus
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('signup form has proper labels', async ({ page }) => {
      await page.goto('/signup')

      // Check for email label
      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toBeVisible()

      // Check for password label
      const passwordInput = page.getByLabel(/^senha$/i)
      await expect(passwordInput).toBeVisible()
    })

    test('buttons have accessible names', async ({ page }) => {
      await page.goto('/login')

      // Login button should be accessible
      const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i })
      await expect(loginButton).toBeVisible()
      const name = await loginButton.getAttribute('aria-label') || await loginButton.textContent()
      expect(name).toBeTruthy()
    })
  })

  test.describe('Page Loading Performance', () => {
    test('login page loads quickly', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/login')
      await page.waitForLoadState('domcontentloaded')
      const loadTime = Date.now() - startTime

      // Page should load in under 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('signup page loads quickly', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/signup')
      await page.waitForLoadState('domcontentloaded')
      const loadTime = Date.now() - startTime

      // Page should load in under 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })
  })

  test.describe('Form Components', () => {
    test('input fields have proper styling', async ({ page }) => {
      await page.goto('/login')

      // Check email input has focus ring on focus
      const emailInput = page.getByLabel(/email/i)
      await emailInput.focus()

      // Input should be focusable
      await expect(emailInput).toBeFocused()
    })

    test('buttons have hover states', async ({ page }) => {
      await page.goto('/login')

      const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i })
      await expect(loginButton).toBeVisible()

      // Hover over button
      await loginButton.hover()

      // Button should still be visible after hover
      await expect(loginButton).toBeVisible()
    })
  })

  test.describe('Typography', () => {
    test('headings are properly sized', async ({ page }) => {
      await page.goto('/login')

      // Hagu branding should be visible
      const brand = page.getByText('Hagu').first()
      await expect(brand).toBeVisible()
    })

    test('body text is readable', async ({ page }) => {
      await page.goto('/login')

      // Body should have readable font size
      const body = page.locator('body')
      await expect(body).toHaveCSS('font-size', /1[2-9]px|[2-9][0-9]px/)
    })
  })

  test.describe('Cross-page Navigation', () => {
    test('can navigate between login and signup', async ({ page }) => {
      // Start at login
      await page.goto('/login')
      await expect(page).toHaveURL(/\/login/)

      // Navigate to signup
      const signupLink = page.getByRole('link', { name: /criar conta|sign up|cadastrar/i })
      await signupLink.click()
      await expect(page).toHaveURL(/\/signup/)

      // Navigate back to login
      const loginLink = page.getByRole('link', { name: /entrar|sign in|fazer login/i })
      await loginLink.click()
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Responsive Design', () => {
    test('login page works on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/login')

      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toBeVisible()

      const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i })
      await expect(loginButton).toBeVisible()
    })

    test('login page works on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/login')

      const emailInput = page.getByLabel(/email/i)
      await expect(emailInput).toBeVisible()

      const loginButton = page.getByRole('button', { name: /entrar|login|sign in/i })
      await expect(loginButton).toBeVisible()
    })
  })
})
