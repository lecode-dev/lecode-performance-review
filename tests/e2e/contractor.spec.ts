import { test, expect } from '@playwright/test'
import { loginAs, logout } from './helpers/auth'

test.describe('Contractor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'contractor')
    await expect(page).toHaveURL(/\/contractor/)
  })

  test.afterEach(async ({ page }) => {
    await logout(page)
  })

  test('vê o dashboard com saudação', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Olá')
  })

  test('vê o histórico', async ({ page }) => {
    await page.goto('/contractor/history')
    await expect(page).toHaveURL(/\/contractor\/history/)
    await expect(page.locator('h2')).toContainText('Histórico')
  })

  test('gate de role: contractor não acessa /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/contractor/)
  })

  test('gate de role: contractor não acessa /client', async ({ page }) => {
    await page.goto('/client/team')
    await expect(page).toHaveURL(/\/contractor/)
  })
})
