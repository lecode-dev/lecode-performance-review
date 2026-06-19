import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test('redireciona usuário não autenticado para /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redireciona rotas protegidas para /login', async ({ page }) => {
    for (const route of ['/admin', '/contractor', '/client/team']) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('exibe erro com credenciais incorretas', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'invalido@lecode.dev')
    await page.fill('input[type="password"]', 'senhaerrada')
    await page.click('button[type="submit"]')
    await expect(page.locator('.field-err')).toBeVisible()
  })

  test('login como admin redireciona para /admin', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL!)
    await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin/)
  })

  test('login como contractor redireciona para /contractor', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_CONTRACTOR_EMAIL!)
    await page.fill('input[type="password"]', process.env.TEST_CONTRACTOR_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/contractor/)
  })

  test('login como client rep redireciona para /client/team', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', process.env.TEST_CLIENT_EMAIL!)
    await page.fill('input[type="password"]', process.env.TEST_CLIENT_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/client\/team/)
  })
})
