import { test, expect } from '@playwright/test'

/**
 * SafeArea validation tests
 * Verifies that critical UI elements are properly positioned and not overlapped by system UI
 */

test.describe('SafeArea - Bottom Safe Area', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:8081')

    // Wait for app to load
    await page.waitForLoadState('networkidle')
  })

  test('Home screen bottom content is not overlapped', async ({ page }) => {
    // Get viewport height
    const viewportSize = page.viewportSize()
    const viewportHeight = viewportSize?.height || 0

    // Find the last widget or content element
    const lastElement = page.locator('[data-testid*="widget"]').last()

    if (await lastElement.count() > 0) {
      const boundingBox = await lastElement.boundingBox()

      // Verify bottom element is not too close to viewport bottom
      // Allow at least 32px (spacing[8]) or safe area bottom
      const minBottomPadding = 32
      const distanceFromBottom = viewportHeight - (boundingBox?.y || 0) - (boundingBox?.height || 0)

      expect(distanceFromBottom).toBeGreaterThanOrEqual(minBottomPadding)
    }
  })

  test('Task filter modal footer is above safe area', async ({ page }) => {
    // Navigate to tasks
    await page.click('text=Tarefas')
    await page.waitForTimeout(500)

    // Open filter modal
    const filterButton = page.locator('[data-testid="filter-button"]')
    if (await filterButton.count() > 0) {
      await filterButton.click()
      await page.waitForTimeout(300)

      // Find the apply button
      const applyButton = page.locator('text=Aplicar Filtros')

      if (await applyButton.count() > 0) {
        const boundingBox = await applyButton.boundingBox()
        const viewportHeight = page.viewportSize()?.height || 0

        // Button should have at least 24px padding from bottom
        const distanceFromBottom = viewportHeight - (boundingBox?.y || 0) - (boundingBox?.height || 0)
        expect(distanceFromBottom).toBeGreaterThanOrEqual(24)
      }
    }
  })

  test('Batch actions bar is above safe area', async ({ page }) => {
    // Navigate to tasks
    await page.click('text=Tarefas')
    await page.waitForTimeout(500)

    // Long press to select a task (if available)
    const firstTask = page.locator('[data-testid*="task-item"]').first()

    if (await firstTask.count() > 0) {
      await firstTask.press('Space') // Simulate long press with keyboard
      await page.waitForTimeout(300)

      // Find batch actions bar
      const batchBar = page.locator('[data-testid="batch-actions-bar"]')

      if (await batchBar.count() > 0) {
        const boundingBox = await batchBar.boundingBox()
        const viewportHeight = page.viewportSize()?.height || 0

        // Bar should have proper bottom padding
        const distanceFromBottom = viewportHeight - (boundingBox?.y || 0) - (boundingBox?.height || 0)
        expect(distanceFromBottom).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('Bottom navigation is above safe area', async ({ page }) => {
    // Find bottom navigation
    const bottomNav = page.locator('[data-testid="bottom-nav"]').or(page.locator('nav').last())

    if (await bottomNav.count() > 0) {
      const boundingBox = await bottomNav.boundingBox()
      const viewportHeight = page.viewportSize()?.height || 0

      // Navigation should be at the very bottom with proper padding
      const distanceFromBottom = viewportHeight - (boundingBox?.y || 0) - (boundingBox?.height || 0)

      // Should be close to bottom but not negative
      expect(distanceFromBottom).toBeGreaterThanOrEqual(0)
      expect(distanceFromBottom).toBeLessThanOrEqual(10) // Allow small margin
    }
  })
})

test.describe('SafeArea - Top Safe Area', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081')
    await page.waitForLoadState('networkidle')
  })

  test('Modal headers are below notch area', async ({ page }) => {
    // Navigate to tasks and open task detail
    await page.click('text=Tarefas')
    await page.waitForTimeout(500)

    const firstTask = page.locator('[data-testid*="task-item"]').first()

    if (await firstTask.count() > 0) {
      await firstTask.click()
      await page.waitForTimeout(300)

      // Find header close button
      const closeButton = page.locator('button').first()

      if (await closeButton.count() > 0) {
        const boundingBox = await closeButton.boundingBox()

        // Button should have at least 20px from top (safe area)
        expect(boundingBox?.y || 0).toBeGreaterThanOrEqual(20)
      }
    }
  })

  test('Auth screens header is below notch', async ({ page }) => {
    // Navigate to login (assuming not authenticated)
    await page.goto('http://localhost:8081/login')
    await page.waitForLoadState('networkidle')

    // Find first interactive element (should be below safe area)
    const firstElement = page.locator('input, button').first()

    if (await firstElement.count() > 0) {
      const boundingBox = await firstElement.boundingBox()

      // Should have safe area padding from top
      expect(boundingBox?.y || 0).toBeGreaterThanOrEqual(40)
    }
  })
})

test.describe('SafeArea - Scrollable Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081')
    await page.waitForLoadState('networkidle')
  })

  test('Tab screens have proper scroll padding', async ({ page }) => {
    const tabs = ['Hábitos', 'Tarefas', 'Áreas', 'Configurações']

    for (const tab of tabs) {
      // Navigate to tab
      await page.click(`text=${tab}`)
      await page.waitForTimeout(500)

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(300)

      // Get last visible element
      const elements = page.locator('[data-testid], button, a').all()
      const lastElement = (await elements).pop()

      if (lastElement) {
        const boundingBox = await lastElement.boundingBox()
        const viewportHeight = page.viewportSize()?.height || 0

        // Should have padding at bottom
        const distanceFromBottom = viewportHeight - (boundingBox?.y || 0) - (boundingBox?.height || 0)
        expect(distanceFromBottom).toBeGreaterThanOrEqual(24)
      }
    }
  })
})
