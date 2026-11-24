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

test('opens the vault, a card and its back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Enter the vault' }).click();
  await expect(page.getByRole('heading', { name: 'The vault', level: 1 })).toBeVisible();
  await expect(page.getByText('4 of 20 tiles lit')).toBeVisible();

  await page
    .getByRole('button', { name: /^Achilles, Swift-footed\. .*In your collection\./ })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Achilles' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Strikes the enemy for 180% of attack.')).toBeVisible();

  await dialog.getByRole('button', { name: 'Turn over' }).click();
  await expect(dialog.getByText('Homer, Iliad').first()).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/#\/collection$/);
});
