import { test, expect } from '@playwright/test'
import { loginAs, logout } from './helpers/auth'

test.describe('Client Rep', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'client')
    await expect(page).toHaveURL(/\/client\/team/)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('vê a página do time', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Time')
  })

  test('vê o histórico', async ({ page }) => {
    await page.goto('/client/history')
    await expect(page).toHaveURL(/\/client\/history/)
    await expect(page.locator('h2')).toContainText('Histórico')
  })

  test('gate de role: client não acessa /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/client\/team/)
  })

  test('gate de role: client não acessa /contractor', async ({ page }) => {
    await page.goto('/contractor')
    await expect(page).toHaveURL(/\/client\/team/)
  })
})
