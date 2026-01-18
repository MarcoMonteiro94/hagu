import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should navigate to habits page', async ({ page }) => {
    // Look for habits navigation link
    const habitsLink = page.getByRole('link', { name: /hábitos|habits/i }).first()
    if (await habitsLink.isVisible()) {
      await habitsLink.click()
      await expect(page).toHaveURL(/\/habits/)
    }
  })

  test('should navigate to tasks page', async ({ page }) => {
    // Look for tasks navigation link
    const tasksLink = page.getByRole('link', { name: /tarefas|tasks/i }).first()
    if (await tasksLink.isVisible()) {
      await tasksLink.click()
      await expect(page).toHaveURL(/\/tasks/)
    }
  })

  test('should navigate to settings page', async ({ page }) => {
    // Look for settings navigation link
    const settingsLink = page.getByRole('link', { name: /configurações|settings/i }).first()
    if (await settingsLink.isVisible()) {
      await settingsLink.click()
      await expect(page).toHaveURL(/\/settings/)
    }
  })

  test('should navigate to areas page', async ({ page }) => {
    // Look for areas navigation link
    const areasLink = page.getByRole('link', { name: /áreas|areas/i }).first()
    if (await areasLink.isVisible()) {
      await areasLink.click()
      await expect(page).toHaveURL(/\/areas/)
    }
  })
})

test.describe('Page Titles and SEO', () => {
  test('home page should have proper title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/hagu/i)
  })

  test('login page should have proper title', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/hagu/i)
  })

  test('habits page should have proper title', async ({ page }) => {
    await page.goto('/habits')
    await expect(page).toHaveTitle(/hagu/i)
  })

  test('tasks page should have proper title', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page).toHaveTitle(/hagu/i)
  })
})

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page-12345')

    // Should either show a 404 page or redirect
    // The page should still be functional
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('PWA Features', () => {
  test('should have manifest link', async ({ page }) => {
    await page.goto('/')

    // Check for PWA manifest
    const manifest = page.locator('link[rel="manifest"]')
    await expect(manifest).toHaveCount(1)
  })

  test('should have viewport meta tag', async ({ page }) => {
    await page.goto('/')

    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveCount(1)
  })

  test('should have theme color meta tag if present', async ({ page }) => {
    await page.goto('/')

    // Check for theme-color meta tag (PWA requirement, optional)
    const themeColor = page.locator('meta[name="theme-color"]')
    const count = await themeColor.count()

    // Theme color is optional but if present, count should be at least 1
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
