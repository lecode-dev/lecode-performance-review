import { test, expect } from '@playwright/test'
import { loginAs, logout } from './helpers/auth'

test.describe('Admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
    await expect(page).toHaveURL(/\/admin/)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('vê o dashboard com stats', async ({ page }) => {
    await expect(page.locator('h2')).toBeVisible()
    await expect(page.locator('.stat, .card')).toHaveCount({ minimum: 1 } as any)
  })

  test('navega para ciclos de avaliação', async ({ page }) => {
    await page.goto('/admin/cycles')
    await expect(page).toHaveURL(/\/admin\/cycles/)
    await expect(page.locator('h2')).toContainText('Ciclos')
  })

  test('navega para contratados', async ({ page }) => {
    await page.goto('/admin/contractors/all')
    await expect(page).toHaveURL(/\/admin\/contractors/)
    await expect(page.locator('h2')).toContainText('Contratados')
  })

  test('navega para clientes', async ({ page }) => {
    await page.goto('/admin/clients')
    await expect(page).toHaveURL(/\/admin\/clients/)
    await expect(page.locator('h2')).toContainText('Clientes')
  })

  test('navega para formulário', async ({ page }) => {
    await page.goto('/admin/form')
    await expect(page).toHaveURL(/\/admin\/form/)
    await expect(page.locator('h2')).toContainText('Formulário')
  })

  test('gate de role: admin não acessa /contractor', async ({ page }) => {
    await page.goto('/contractor')
    await expect(page).toHaveURL(/\/admin/)
  })

  test('gate de role: admin não acessa /client', async ({ page }) => {
    await page.goto('/client/team')
    await expect(page).toHaveURL(/\/admin/)
  })
})
