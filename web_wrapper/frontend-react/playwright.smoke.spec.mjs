import { expect, test } from '@playwright/test'

test.use({
  channel: 'chrome',
  headless: true,
})

test('signup and generate through the website', async ({ page }) => {
  test.setTimeout(240000)

  const stamp = Date.now()
  const email = `imagyn_ui_${stamp}@example.com`
  const prompt = `An editorial bronze sculpture in warm window light with tactile stone textures ${stamp}`
  const promptSnippet = prompt.slice(0, 48)

  await page.goto('http://127.0.0.1:8890/login')

  await page.getByRole('button', { name: /^Sign up$/ }).click()
  await page.getByPlaceholder('Tarek').fill('Imagyn Browser Test')
  await page.getByPlaceholder('name@example.com').fill(email)
  await page.getByPlaceholder('At least one strong password').fill('ImagynPass123!')
  await page.getByRole('button', { name: /Create account and start generating/i }).click()

  await expect(page).toHaveURL('http://127.0.0.1:8890/')
  await expect(page.getByText('Compose, queue, and monitor image jobs from one place.')).toBeVisible()

  await page.locator('textarea').first().fill(prompt)
  await page.locator('select').first().selectOption('dreamshaper_8.safetensors')

  const generateButton = page.getByRole('button', { name: /Generate on GPU/i })
  await expect(generateButton).toBeEnabled({ timeout: 60000 })
  await generateButton.click()

  await expect(page.getByText('Generation queued')).toBeVisible({ timeout: 20000 })

  await page.goto('http://127.0.0.1:8890/gallery')
  await expect(page.getByText('Browse every completed render with real metadata.')).toBeVisible({ timeout: 60000 })

  let promptVisible = false
  for (let attempt = 0; attempt < 36; attempt++) {
    if (await page.getByText(promptSnippet, { exact: false }).count()) {
      promptVisible = true
      break
    }
    await page.getByRole('button', { name: /Refresh gallery/i }).click()
    await page.waitForTimeout(5000)
  }

  expect(promptVisible).toBeTruthy()

  await page.screenshot({ path: 'playwright-gallery-proof.png', fullPage: true })
})
