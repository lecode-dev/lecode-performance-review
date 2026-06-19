import type { Page } from '@playwright/test'

export async function loginAs(page: Page, role: 'admin' | 'contractor' | 'client') {
  const credentials = {
    admin:      { email: process.env.TEST_ADMIN_EMAIL!,      password: process.env.TEST_ADMIN_PASSWORD! },
    contractor: { email: process.env.TEST_CONTRACTOR_EMAIL!, password: process.env.TEST_CONTRACTOR_PASSWORD! },
    client:     { email: process.env.TEST_CLIENT_EMAIL!,     password: process.env.TEST_CLIENT_PASSWORD! },
  }

  const { email, password } = credentials[role]

  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

export async function logout(page: Page) {
  await page.goto('/logout')
}
