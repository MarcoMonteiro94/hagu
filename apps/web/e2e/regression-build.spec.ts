import { test, expect } from '@playwright/test'

/**
 * Regression tests for white screen bug fix
 * Root cause: Missing entities package dependency causing build failures
 * Fix: Added entities ^6.0.0 override in root package.json
 */
test.describe('Regression: White Screen Fix', () => {
  test('home page should load without errors', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    // Page should load and render content (either login form or home page)
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Body should have substantial content (not white screen)
    const bodyHTML = await body.innerHTML()
    expect(bodyHTML.length).toBeGreaterThan(1000)

    // No critical page errors
    expect(pageErrors).toHaveLength(0)

    // Check that we have interactive elements
    const buttons = page.getByRole('button')
    expect(await buttons.count()).toBeGreaterThan(0)
  })

  test('login page should render correctly', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })

    // Check essential elements are present
    const title = page.getByText('Hagu')
    await expect(title.first()).toBeVisible()

    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeVisible()

    const passwordInput = page.getByLabel(/senha|password/i)
    await expect(passwordInput).toBeVisible()

    const submitButton = page.getByRole('button', { name: /entrar|sign in|login/i })
    await expect(submitButton).toBeVisible()
  })

  test('habits page should load', async ({ page }) => {
    await page.goto('/habits', { waitUntil: 'networkidle' })

    // Page should redirect to login if not authenticated, or show habits
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Should have content
    const bodyHTML = await body.innerHTML()
    expect(bodyHTML.length).toBeGreaterThan(500)
  })

  test('tasks page should load', async ({ page }) => {
    await page.goto('/tasks', { waitUntil: 'networkidle' })

    const body = page.locator('body')
    await expect(body).toBeVisible()

    const bodyHTML = await body.innerHTML()
    expect(bodyHTML.length).toBeGreaterThan(500)
  })

  test('areas page should load', async ({ page }) => {
    await page.goto('/areas', { waitUntil: 'networkidle' })

    const body = page.locator('body')
    await expect(body).toBeVisible()

    const bodyHTML = await body.innerHTML()
    expect(bodyHTML.length).toBeGreaterThan(500)
  })

  test('settings page should load', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' })

    const body = page.locator('body')
    await expect(body).toBeVisible()

    const bodyHTML = await body.innerHTML()
    expect(bodyHTML.length).toBeGreaterThan(500)
  })

  test('studies page with blocknote editor should load', async ({ page }) => {
    // This is the page that was causing the build error due to blocknote/parse5/entities
    await page.goto('/areas/studies', { waitUntil: 'networkidle' })

    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Page should have content, not be white
    const bodyHTML = await body.innerHTML()
    expect(bodyHTML.length).toBeGreaterThan(500)
  })
})
