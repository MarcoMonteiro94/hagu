import { test } from '@playwright/test'

test.describe('Debug Home Page White Screen', () => {
  test('capture home page state and console errors', async ({ page }) => {
    // Collect console messages
    const consoleMessages: string[] = []
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`
      consoleMessages.push(text)
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      }
    })

    // Collect page errors
    const pageErrors: string[] = []
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    // Navigate to home page
    await page.goto('/', { waitUntil: 'networkidle' })

    // Take screenshot
    await page.screenshot({ path: 'debug-home-initial.png', fullPage: true })

    // Get page content
    const content = await page.content()
    console.log('=== PAGE URL ===')
    console.log(page.url())

    console.log('\n=== CONSOLE ERRORS ===')
    consoleErrors.forEach((e) => console.log(e))

    console.log('\n=== PAGE ERRORS ===')
    pageErrors.forEach((e) => console.log(e))

    console.log('\n=== PAGE BODY (first 2000 chars) ===')
    const bodyText = await page.locator('body').textContent()
    console.log(bodyText?.substring(0, 2000) || 'NO BODY TEXT')

    // Check for hydration errors
    const hydrationError = content.includes('Hydration') || content.includes('hydration')
    console.log('\n=== HYDRATION ERROR DETECTED ===', hydrationError)

    // Check for React error boundary
    const hasErrorBoundary = content.includes('error') || content.includes('Error')
    console.log('=== ERROR IN CONTENT ===', hasErrorBoundary)

    // Get visible elements
    const visibleElements = await page.locator('body > *').count()
    console.log('\n=== VISIBLE ROOT ELEMENTS ===', visibleElements)

    // Check if body is empty or white
    const bodyHTML = await page.locator('body').innerHTML()
    console.log('\n=== BODY HTML LENGTH ===', bodyHTML.length)

    if (bodyHTML.length < 100) {
      console.log('=== BODY HTML ===')
      console.log(bodyHTML)
    }

    // Log all console messages
    console.log('\n=== ALL CONSOLE MESSAGES ===')
    consoleMessages.slice(0, 20).forEach((m) => console.log(m))
  })

  test('simulate authenticated user with completed onboarding', async ({ page }) => {
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

    // Set localStorage for completed onboarding before navigating
    await page.goto('/login')

    // Set the settings in localStorage to simulate completed onboarding
    await page.evaluate(() => {
      const settings = {
        state: {
          theme: 'dark',
          locale: 'pt-BR',
          weekStartsOn: 0,
          notificationsEnabled: true,
          onboardingCompleted: true,
          userName: 'Test User',
          homeWidgets: [
            { id: 'habits', visible: true, order: 0 },
            { id: 'tasks', visible: true, order: 1 },
            { id: 'notebooks', visible: true, order: 2 },
            { id: 'finances', visible: true, order: 3 },
            { id: 'health', visible: true, order: 4 },
          ],
          hideBalances: false,
        },
        version: 0,
      }
      localStorage.setItem('hagu-settings', JSON.stringify(settings))
    })

    // Navigate to home (will redirect if not authenticated, but let's check behavior)
    await page.goto('/', { waitUntil: 'networkidle' })

    // Wait a bit for any client-side rendering
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'debug-home-with-settings.png', fullPage: true })

    console.log('\n=== WITH COMPLETED ONBOARDING ===')
    console.log('URL:', page.url())
    console.log('Console Errors:', consoleErrors)
    console.log('Page Errors:', pageErrors)

    const bodyText = await page.locator('body').textContent()
    console.log('Body text (first 500 chars):', bodyText?.substring(0, 500))

    // Check if the page is blank (white screen)
    const bodyHTML = await page.locator('body').innerHTML()
    console.log('Body HTML length:', bodyHTML.length)

    // Check for specific elements
    const hasHeader = await page.locator('h1').count()
    const hasButtons = await page.locator('button').count()
    const hasCards = await page.locator('[class*="card"]').count()

    console.log('Has h1 elements:', hasHeader)
    console.log('Has buttons:', hasButtons)
    console.log('Has cards:', hasCards)
  })

  test('check login page rendering', async ({ page }) => {
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

    await page.goto('/login', { waitUntil: 'networkidle' })

    await page.screenshot({ path: 'debug-login.png', fullPage: true })

    console.log('=== LOGIN PAGE URL ===')
    console.log(page.url())

    console.log('\n=== LOGIN PAGE ERRORS ===')
    consoleErrors.forEach((e) => console.log(e))
    pageErrors.forEach((e) => console.log(e))

    // Check login form
    const emailInput = page.getByLabel(/email/i)
    const isEmailVisible = await emailInput.isVisible().catch(() => false)
    console.log('\n=== EMAIL INPUT VISIBLE ===', isEmailVisible)

    const bodyText = await page.locator('body').textContent()
    console.log('\n=== LOGIN PAGE TEXT (first 1000 chars) ===')
    console.log(bodyText?.substring(0, 1000) || 'NO TEXT')
  })
})
