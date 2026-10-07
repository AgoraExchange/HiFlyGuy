import { test, expect } from './member-fixture.js';

test('enter the familiar presence, fly, look, place fruit, and restore orbit', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await page.locator('#pause-btn').click();
  await expect(page.locator('#first-person-btn')).toBeVisible();
  await page.locator('[data-environment="playground"]').click();
  await expect(page.locator('#first-person-btn')).toBeVisible();
  await expect(page.locator('.life-location-actions #first-person-btn')).toHaveText('Join World');
  await page.locator('#viewport').screenshot({path:'test-results/join-world-desktop.png'});
  await page.locator('#first-person-btn').click();
  await expect(page.locator('#viewport')).toHaveAttribute('data-first-person', 'true');
  await expect(page.locator('#first-person-presence')).toContainText('Habitat');
  await page.locator('#first-person-find').click(); await expect(page.locator('#toast')).toContainText('Invitation saved');
  const canvas = page.locator('#viewport > canvas');
  const before = await canvas.screenshot();
  await page.keyboard.down('KeyW'); await page.waitForTimeout(550); await page.keyboard.up('KeyW');
  const after = await canvas.screenshot(); expect(before.equals(after)).toBe(false);
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 40, { steps: 8 }); await page.mouse.up();
  await page.locator('[data-fruit="banana"]').click(); await page.locator('#first-person-drop').click();
  await expect(page.locator('#object-count')).toHaveText('1 object');
  await expect(page.locator('#viewport')).toHaveAttribute('data-first-person', 'true');
  await page.screenshot({ path: 'test-results/first-person-desktop.png' });
  await page.keyboard.press('Escape'); await expect(page.locator('#first-person-btn')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#first-person-btn').click(); await page.locator('#exit-first-person').click();
  await page.locator('[data-environment="habitat"]').click(); await expect(page.locator('#first-person-btn')).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile first person has touch movement and fruit placement without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.locator('[data-environment="playground"]').click();
  await page.locator('#viewport').screenshot({path:'test-results/join-world-mobile.png'});
  await page.setViewportSize({width:320,height:844});
  const join=await page.locator('#first-person-btn').boundingBox(),training=await page.locator('#playground-controls').boundingBox();
  expect(join.y+join.height).toBeLessThan(training.y);
  await page.locator('#viewport').screenshot({path:'test-results/join-world-narrow.png'});
  await page.locator('#first-person-btn').click();
  await expect(page.locator('#movement-joystick')).toBeVisible();
  await page.locator('[data-fruit="tomato"]').click(); await page.locator('#first-person-drop').click();
  await expect(page.locator('#object-count')).toHaveText('1 object');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/first-person-mobile.png', fullPage: true });
  await page.locator('#exit-first-person').click(); await expect(page.locator('#first-person-btn')).toHaveAttribute('aria-pressed', 'false');
});
