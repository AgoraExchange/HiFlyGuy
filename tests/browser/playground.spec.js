import { test, expect } from './member-fixture.js';

for (const mobile of [false, true]) test(`FlyGuy comes to YOU and can be rewarded (${mobile ? 'phone fullscreen' : 'desktop with reload'})`, async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  if (mobile) await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/'); await page.getByRole('button', { name: '06 Playground', exact: true }).click();
  await page.locator('#invite-fly').click(); await expect(page.locator('#viewport')).toHaveAttribute('data-fly-present', 'true', { timeout: 25000 });
  if (mobile) await page.getByRole('button', { name: 'Fullscreen habitat', exact: true }).click();
  await page.locator('#perch-select').selectOption('1');
  await page.getByRole('button', { name: 'Practice with me', exact: true }).click();
  await expect(page.locator('#perch-select')).toHaveValue('you');
  await expect(page.locator('#reward-btn')).toBeEnabled({ timeout: 30000 });
  await expect(page.locator('#lesson-message')).toContainText('He came to you');
  if (!mobile) {
    await page.getByRole('button', { name: 'Pause virtual world', exact: true }).click();
    await page.reload(); await expect(page.locator('#perch-select')).toHaveValue('you');
    await expect(page.locator('#lesson-message')).toContainText('He came to you');
    await page.getByRole('button', { name: 'Resume virtual world', exact: true }).click();
  }
  await page.locator('#training-toggle').click();
  await page.screenshot({ path: `test-results/come-to-me-${mobile ? 'phone' : 'desktop'}.png` });
  await page.locator('#training-toggle').click(); await page.locator('#reward-btn').click();
  await expect(page.locator('#training-history .trial-row').first()).toContainText('Come to me');
  await expect(page.locator('#training-history .trial-row').first()).toContainText('rewarded');
  await expect(page.locator('#bond-mini')).not.toHaveText('12%');
  if (!mobile) {
    await page.getByRole('button', { name: 'Come to me', exact: true }).click();
    const latest = await page.evaluate(() => JSON.parse(localStorage.getItem('hiflyguy.account.test-creator.hiflyguy.world.v1')).world.training.trials[0]);
    expect(latest.destination).toBe('you'); expect(latest.guided).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('Playground practice builds saved bond, improves recall, and unlocks a full backflip', async ({ page }) => {
  test.setTimeout(100000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await page.getByRole('button', { name: '06 Playground', exact: true }).click();
  await page.locator('#invite-fly').click(); await expect(page.locator('#viewport')).toHaveAttribute('data-fly-present', 'true', { timeout: 25000 });
  await expect(page.locator('#viewport')).toHaveAttribute('data-environment', 'playground');
  await expect(page.locator('#bond-value')).toHaveText('12%');
  await expect(page.getByRole('button', { name: 'Practice flip', exact: true })).toBeDisabled();
  await page.locator('[data-speed="2"]').click();
  await page.screenshot({ path: 'test-results/playground-first-lesson.png', fullPage: true });
  const practice = async kind => {
    await page.getByRole('button', { name: `Practice ${kind}`, exact: true }).click();
    await expect(page.locator('#reward-btn')).toBeEnabled({ timeout: 25000 });
    await page.locator('#reward-btn').click();
    await expect(page.locator('#training-history .trial-row').first()).toContainText('rewarded');
  };
  for (let i = 0; i < 3; i++) await practice('call');
  await expect(page.getByRole('button', { name: 'Practice flip', exact: true })).toBeEnabled();
  for (let i = 0; i < 4; i++) await practice('flip');
  await expect(page.getByRole('button', { name: 'Backflip!', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Practice flip', exact: true }).click();
  await expect(page.locator('#behavior-pill')).toHaveText('Backflipping');
  await page.screenshot({ path: 'test-results/playground-backflip.png', fullPage: true });
  await expect(page.locator('#reward-btn')).toBeEnabled(); await page.locator('#reward-btn').click();
  await page.getByRole('button', { name: 'Pause virtual world', exact: true }).click(); await page.waitForTimeout(200);
  const bond = await page.locator('#bond-value').textContent(), skill = await page.locator('#flip-skill').textContent();
  await page.reload(); await expect(page.locator('#viewport')).toHaveAttribute('data-environment', 'playground');
  await expect(page.locator('#bond-value')).toHaveText(bond); await expect(page.locator('#flip-skill')).toHaveText(skill);
  await page.getByRole('button', { name: '01 Habitat', exact: true }).click();
  await expect(page.locator('#training-dock')).toBeHidden(); await expect(page.locator('#bond-value')).toHaveText(bond);
  await page.getByRole('button', { name: 'Reset world', exact: true }).click(); await expect(page.locator('#bond-value')).toHaveText('12%');
  expect(errors).toEqual([]);
});

test('Playground training, rewards, and inventory fit in phone fullscreen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByRole('button', { name: '06 Playground', exact: true }).click();
  await page.locator('#invite-fly').click(); await expect(page.locator('#viewport')).toHaveAttribute('data-fly-present', 'true', { timeout: 25000 });
  await page.getByRole('button', { name: 'Fullscreen habitat', exact: true }).click();
  await page.locator('#perch-select').selectOption('1');
  await page.getByRole('button', { name: 'Practice call', exact: true }).click();
  await expect(page.locator('#reward-btn')).toBeEnabled({ timeout: 25000 });
  await page.locator('#reward-btn').click();
  const dock = await page.locator('#training-dock').boundingBox(), inventory = await page.locator('#inventory').boundingBox();
  expect(dock.x).toBeGreaterThanOrEqual(0); expect(dock.x + dock.width).toBeLessThan(390); expect(dock.y + dock.height).toBeLessThan(inventory.y);
  await page.screenshot({ path: 'test-results/playground-mobile.png' });
  await page.locator('#training-toggle').click(); await expect(page.locator('#training-dock')).toBeHidden();
  await page.getByRole('button', { name: 'Inventory: ripe banana', exact: true }).click();
  await page.getByRole('button', { name: 'Place near FlyGuy', exact: true }).click();
  await expect(page.locator('#object-count')).toHaveText('1 object');
  await page.screenshot({ path: 'test-results/playground-mobile-view.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
