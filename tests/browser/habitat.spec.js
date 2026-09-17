import { test, expect } from '@playwright/test';
import { stat, utimes } from 'node:fs/promises';

test('FlyGuy renders, responds to experiments, pauses and resets', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.locator('#viewport > canvas')).toBeVisible();
  await page.waitForTimeout(1500); await expect(page.locator('#render-error')).toBeHidden();
  await page.screenshot({ path: 'test-results/habitat-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  const time = await page.locator('#session-time').textContent(); await page.waitForTimeout(1100); await expect(page.locator('#session-time')).toHaveText(time);
  await page.getByRole('button', { name: 'Place ripe banana', exact: true }).click(); await expect(page.locator('#placement-banner')).toBeVisible();
  await page.getByRole('button', { name: 'Place near FlyGuy' }).click(); await expect(page.locator('#object-count')).toHaveText('1 object');
  await page.getByRole('button', { name: 'Resume simulation', exact: true }).click();
  await expect(page.locator('#behavior-pill')).toHaveText(/Seeking food|Feeding/, { timeout: 12000 });
  await page.getByRole('button', { name: 'Follow FlyGuy up close', exact: true }).click(); await expect(page.locator('#focus-btn')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(1200); await page.screenshot({ path: 'test-results/flyguy-closeup.png', fullPage: true });
  await page.getByRole('button', { name: 'Show scent fields', exact: true }).click(); await expect(page.locator('#scent-btn')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Place peppermint candy', exact: true }).click(); await page.getByRole('button', { name: 'Place near FlyGuy' }).click();
  await expect(page.locator('#behavior-pill')).toHaveText('Avoiding', { timeout: 10000 });
  await page.getByRole('button', { name: 'Clear objects', exact: true }).click(); await expect(page.locator('#object-count')).toHaveText('0 objects');
  await page.getByRole('button', { name: 'Reset world', exact: true }).click(); await expect(page.locator('#focus-btn')).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'About this world' }).click(); await expect(page.locator('#dialog')).toBeVisible(); await expect(page.locator('#dialog-body')).toContainText('No FlyWire dataset is loaded');
  const close = await page.locator('#close-dialog').boundingBox(), cross = await page.locator('#close-dialog svg').boundingBox();
  expect(Math.abs(close.x + close.width / 2 - cross.x - cross.width / 2)).toBeLessThan(1);
  expect(Math.abs(close.y + close.height / 2 - cross.y - cross.height / 2)).toBeLessThan(1);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  expect(errors).toEqual([]);
});

test('Fullscreen inventory has six slots and placed objects can be selected and removed', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  await expect(page.locator('#inventory')).toBeHidden();
  await page.getByRole('button', { name: 'Fullscreen habitat', exact: true }).click();
  await expect(page.locator('#inventory')).toBeVisible(); await expect(page.locator('.inventory-slot')).toHaveCount(6);
  await expect(page.locator('.inventory-slot.empty')).toHaveCount(2);
  await page.keyboard.press('2'); await expect(page.getByRole('button', { name: 'Inventory: fresh tomato' })).toHaveAttribute('aria-pressed', 'true');
  const canvas = page.locator('#viewport > canvas'); const rect = await canvas.boundingBox();
  const position = { x: rect.width * 0.5, y: rect.height * 0.61 };
  await canvas.click({ position }); await expect(page.locator('#object-count')).toHaveText('1 object');
  await page.waitForTimeout(250); await canvas.click({ position });
  await expect(page.locator('#remove-selected-btn')).toBeVisible(); await expect(page.locator('#selection-label')).toContainText('Fresh tomato selected');
  await page.screenshot({ path: 'test-results/fullscreen-inventory.png' });
  await page.getByRole('button', { name: 'Remove selected object', exact: true }).click();
  await expect(page.locator('#object-count')).toHaveText('0 objects'); await expect(page.locator('#remove-selected-btn')).toBeHidden();
  await page.getByRole('button', { name: 'Inventory: peppermint candy' }).click(); await page.getByRole('button', { name: 'Place near FlyGuy' }).click();
  await expect(page.locator('#object-count')).toHaveText('1 object');
  await page.getByRole('button', { name: 'Exit fullscreen habitat', exact: true }).click(); await expect(page.locator('#inventory')).toBeHidden();
  await page.getByRole('button', { name: 'Resume simulation', exact: true }).click();
  await expect(page.locator('#memory-count')).toHaveText('1 place', { timeout: 12000 });
  await expect(page.locator('#memory-list')).toContainText('encounter');
  await page.getByRole('button', { name: 'Remove peppermint candy 2', exact: true }).click();
  await expect(page.locator('#memory-count')).toHaveText('1 place');
  await page.screenshot({ path: 'test-results/learned-memory.png', fullPage: true });
  await page.getByRole('button', { name: 'Reset world', exact: true }).click(); await expect(page.locator('#memory-count')).toHaveText('0 places');
  expect(errors).toEqual([]);
});

test('Fullscreen inventory fits on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByRole('button', { name: 'Fullscreen habitat', exact: true }).click();
  await expect(page.locator('#inventory')).toBeVisible();
  const bounds = await page.locator('#inventory').boundingBox();
  const viewport = page.viewportSize(); expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  await page.getByRole('button', { name: 'Inventory: ripe banana' }).click();
  await expect(page.locator('#placement-banner')).toBeVisible();
  const banner = await page.locator('#placement-banner').boundingBox(); expect(banner.y + banner.height).toBeLessThan(bounds.y);
  await page.screenshot({ path: 'test-results/fullscreen-mobile.png' });
  await page.getByRole('button', { name: 'Cancel placement' }).click();
  await page.getByRole('button', { name: 'Exit fullscreen habitat', exact: true }).click();
});

test('Mobile layout, keyboard placement, and session export', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/'); await page.waitForTimeout(1200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.getByRole('button', { name: 'Place fresh tomato', exact: true }).click(); await page.keyboard.press('Escape'); await expect(page.locator('#placement-banner')).toBeHidden();
  await page.getByRole('button', { name: 'Place fresh tomato', exact: true }).click(); await page.getByRole('button', { name: 'Place near FlyGuy' }).click();
  await page.screenshot({ path: 'test-results/habitat-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Experiment log', exact: true }).filter({ visible: true }).first().click();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export session' }).click(); expect((await download).suggestedFilename()).toBe('hiflyguy-session.json');
});

test('Camera drag changes the view and direct floor placement works', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  const canvas = page.locator('#viewport > canvas'); const rect = await canvas.boundingBox();
  await page.waitForTimeout(500); const before = await canvas.screenshot();
  await page.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.55); await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.65, rect.y + rect.height * 0.6, { steps: 15 }); await page.mouse.up();
  await page.waitForTimeout(500); const after = await canvas.screenshot(); expect(Buffer.compare(before, after)).not.toBe(0);
  await page.getByRole('button', { name: 'Reset camera', exact: true }).click();
  await page.getByRole('button', { name: 'Place ripe banana', exact: true }).click();
  await canvas.click({ position: { x: rect.width * 0.5, y: rect.height * 0.61 } });
  await expect(page.locator('#object-count')).toHaveText('1 object'); await expect(page.locator('#placement-banner')).toBeHidden();
  await page.getByRole('button', { name: 'Remove ripe banana 1', exact: true }).click(); await expect(page.locator('#object-count')).toHaveText('0 objects');
});

test('Reloading preserves feeding, objects, memories, and an explicit reset', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-speed="2"]').click();
  await page.getByRole('button', { name: 'Place ripe banana', exact: true }).click(); await page.getByRole('button', { name: 'Place near FlyGuy' }).click();
  await expect(page.locator('#behavior-pill')).toHaveText('Feeding', { timeout: 12000 });
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  await expect(page.locator('#save-label')).toHaveText('WORLD SAVED');
  await page.waitForTimeout(200); const time = await page.locator('#session-time').textContent();
  await page.reload(); await expect(page.locator('#session-time')).toHaveText(time);
  await expect(page.locator('#behavior-pill')).toHaveText('Feeding'); await expect(page.locator('#object-count')).toHaveText('1 object');
  await expect(page.getByRole('button', { name: 'Resume simulation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resume simulation', exact: true }).click();
  await expect(page.locator('#behavior-pill')).toHaveText(/Exploring|Grooming/, { timeout: 25000 });
  await expect(page.locator('#object-count')).toHaveText('1 object');
  await page.getByRole('button', { name: 'Place peppermint candy', exact: true }).click(); await page.getByRole('button', { name: 'Place near FlyGuy' }).click();
  await expect(page.locator('#memory-count')).toHaveText('1 place');
  await page.getByRole('button', { name: 'Remove peppermint candy 2', exact: true }).click();
  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  // Telemetry redraws every 150 ms; let it display the final paused value.
  await page.waitForTimeout(200);
  const memory = await page.locator('#memory-list').textContent(); await page.reload();
  await expect(page.locator('#object-count')).toHaveText('1 object'); await expect(page.locator('#memory-list')).toHaveText(memory);
  await page.getByRole('button', { name: 'Reset world', exact: true }).click(); await page.reload();
  await expect(page.locator('#object-count')).toHaveText('0 objects'); await expect(page.locator('#memory-count')).toHaveText('0 places');
});

test('Editing a source file does not reload a live world', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Place fresh tomato', exact: true }).click(); await page.getByRole('button', { name: 'Place near FlyGuy' }).click();
  let navigations = 0; page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++; });
  const source = new URL('../../src/main.js', import.meta.url), original = await stat(source);
  try {
    await utimes(source, new Date(), new Date()); await page.waitForTimeout(2500);
    expect(navigations).toBe(0); await expect(page.locator('#object-count')).toHaveText('1 object');
  } finally { await utimes(source, original.atime, original.mtime); }
});

test('Unavailable browser storage is reported without breaking play', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); }; });
  await page.goto('/'); await expect(page.locator('#save-label')).toHaveText('SAVE UNAVAILABLE');
  await page.getByRole('button', { name: 'Place ripe banana', exact: true }).click(); await page.getByRole('button', { name: 'Place near FlyGuy' }).click();
  await expect(page.locator('#object-count')).toHaveText('1 object'); await expect(page.locator('#render-error')).toBeHidden();
});

test('Swatter follows the pointer, causes panic, and can be put away or switched', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await page.getByRole('button', { name: 'Pause simulation', exact: true }).click();
  await page.getByRole('button', { name: 'Follow FlyGuy up close', exact: true }).click();
  await page.getByRole('button', { name: 'Use fly swatter', exact: true }).click();
  await expect(page.locator('#swatter-banner')).toBeVisible();
  const canvas = page.locator('#viewport > canvas');
  const aimAtFly = async () => { await canvas.scrollIntoViewIfNeeded(); const rect = await canvas.boundingBox(); await page.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5); };
  await aimAtFly();
  await expect(page.locator('#viewport')).toHaveAttribute('data-swatter-visible', 'true');
  await page.getByRole('button', { name: 'Resume simulation', exact: true }).click();
  await aimAtFly();
  await expect(page.locator('#behavior-pill')).toHaveText('Panicking');
  await expect(page.locator('#object-count')).toHaveText('0 objects');
  await expect(page.locator('#distress-value')).not.toHaveText('Distress 0%');
  await page.screenshot({ path: 'test-results/swatter-chase.png', fullPage: true });
  await page.keyboard.press('Escape'); await expect(page.locator('#swatter-banner')).toBeHidden();
  await expect(page.locator('#viewport')).toHaveAttribute('data-swatter-visible', 'false');
  await expect(page.locator('#behavior-pill')).not.toHaveText('Panicking', { timeout: 5000 });
  await page.getByRole('button', { name: 'Fullscreen habitat', exact: true }).click();
  await page.getByRole('button', { name: 'Inventory: fly swatter', exact: true }).click();
  await expect(page.locator('#inventory [data-tool="swatter"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('1'); await expect(page.locator('#swatter-banner')).toBeHidden();
  await expect(page.locator('#placement-banner')).toBeVisible();
  await page.getByRole('button', { name: 'Place near FlyGuy' }).click(); await expect(page.locator('#object-count')).toHaveText('1 object');
  await page.keyboard.press('4'); await expect(page.locator('#swatter-banner')).toBeVisible();
  await page.getByRole('button', { name: 'Put away', exact: false }).click(); await expect(page.locator('#swatter-banner')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Swatter can be dragged on a touchscreen without orbiting the camera', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5180'); await page.getByRole('button', { name: 'Fullscreen habitat', exact: true }).click();
    await page.getByRole('button', { name: 'Inventory: fly swatter', exact: true }).tap();
    const rect = await page.locator('#viewport > canvas').boundingBox(), client = await context.newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rect.width * 0.5, y: rect.height * 0.5 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: rect.width * 0.55, y: rect.height * 0.52 }] });
    await expect(page.locator('#viewport')).toHaveAttribute('data-swatter-visible', 'true');
    await page.screenshot({ path: 'test-results/swatter-touch.png' });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('#viewport')).toHaveAttribute('data-swatter-visible', 'false');
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});
