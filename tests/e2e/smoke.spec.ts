import { expect, test } from '@playwright/test';

test('loads offline-only and switches language', async ({ page, baseURL }) => {
  const external: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== new URL(baseURL!).origin) {
      external.push(req.url());
    }
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tesserae');

  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByLabel('Language').selectOption('es');
  await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible();

  expect(external).toEqual([]);
});
