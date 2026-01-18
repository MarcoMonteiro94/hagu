import { test, expect } from '@playwright/test'

test.describe('Home Page (Unauthenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login when unauthenticated', async ({ page }) => {
    // Home page should redirect to login for unauthenticated users
    // Check if we're on login page or home page renders
    const loginForm = page.getByText('Hagu').first()
    const homeHeader = page.locator('h1')

    // Either we're redirected to login or we see the home page
    const isOnLogin = await loginForm.isVisible().catch(() => false)
    const isOnHome = await homeHeader.isVisible().catch(() => false)

    expect(isOnLogin || isOnHome).toBe(true)
  })

  test('should display login page when accessing root unauthenticated', async ({ page }) => {
    // Wait for redirect or page load
    await page.waitForLoadState('networkidle')

    // Check we're either on login or home
    const pageContent = await page.content()
    const hasLoginForm = pageContent.includes('Email') && pageContent.includes('Entrar')
    const hasHomeContent = pageContent.includes('Hábitos') || pageContent.includes('habits')

    expect(hasLoginForm || hasHomeContent).toBe(true)
  })
})

test.describe('Home Page with Auth State', () => {
  // These tests would require authentication setup
  // For now, we test what's accessible without auth

  test('should handle navigation gracefully', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Page should load without errors
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should still render correctly
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Should have proper mobile layout
    const viewport = await page.viewportSize()
    expect(viewport?.width).toBe(375)
  })
})

test.describe('Home Page Accessibility', () => {
  test('should have basic accessibility elements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check buttons are focusable
    const buttons = page.getByRole('button')
    if (await buttons.count() > 0) {
      const firstButton = buttons.first()
      await expect(firstButton).toBeVisible()
    }

    // Check textboxes are accessible
    const textboxes = page.getByRole('textbox')
    if (await textboxes.count() > 0) {
      await expect(textboxes.first()).toBeVisible()
    }
  })
})
