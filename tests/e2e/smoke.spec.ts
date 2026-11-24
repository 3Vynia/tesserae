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
  await page.getByRole('link', { name: /tiles lit/ }).click();
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

test('summons once, skips the ceremony and lands in the vault', async ({ page }) => {
  await page.goto('/#/summon');
  await expect(page.getByText('Mortal', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: '50%' })).toBeVisible();
  await page.getByRole('button', { name: /Summon ×1/ }).click();
  const ceremony = page.getByRole('dialog', { name: 'Summoning' });
  await expect(ceremony).toBeVisible();
  // The ceremony reveals on its own after a moment; waiting for it avoids racing the skip button.
  await ceremony.getByRole('button', { name: /Set (it|them) in the vault/ }).click();
  await expect(page).toHaveURL(/#\/collection$/);
  await expect(page.locator('#hud-starlight')).toContainText('1,440');
});

test('fights the first stage and returns to the formation', async ({ page }) => {
  await page.goto('/#/battle');
  await expect(page.getByRole('heading', { name: 'Formation' })).toBeVisible();
  await page.getByRole('button', { name: 'Fight' }).click();
  const stage = page.getByRole('dialog', { name: 'Battle' });
  await expect(stage).toBeVisible();
  await stage.getByRole('button', { name: 'Skip to the end' }).click();
  await expect(stage.getByRole('heading', { name: /Victory|Defeat|Time ran out/ })).toBeVisible();
  await stage.getByRole('button', { name: 'Back to the formation' }).click();
  await expect(stage).toBeHidden();
});
