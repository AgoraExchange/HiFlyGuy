import { test, expect } from '@playwright/test';
import { Simulation } from '../../src/simulation.js';
import { ROOMS } from '../../src/life.js';
import { encodeSession } from '../../src/session.js';

test('Room cameras, local inventory, invitations and an absent fly survive reloads', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await page.locator('#pause-btn').click();
  await page.getByRole('button', { name: 'Place ripe banana', exact: true }).click(); await page.locator('#place-center').click();
  await page.getByRole('button', { name: '02 Fire escape', exact: true }).click();
  await expect(page.locator('#viewport')).toHaveAttribute('data-fly-present', 'false');
  await expect(page.locator('#actual-room')).toHaveText('Habitat'); await expect(page.locator('#object-count')).toHaveText('0 objects');
  await expect(page.locator('#fly-label')).toBeHidden();
  await page.getByRole('button', { name: 'Place fresh tomato', exact: true }).click(); await page.locator('#place-center').click();
  await page.reload(); await expect(page.locator('#viewport')).toHaveAttribute('data-environment', 'fireescape');
  await expect(page.locator('#viewport')).toHaveAttribute('data-fly-present', 'false'); await expect(page.locator('#object-count')).toHaveText('1 object');
  await page.locator('#invite-fly').click(); await page.locator('#pause-btn').click();
  await expect(page.locator('#viewport')).toHaveAttribute('data-fly-present', 'true', { timeout: 22000 });
  await expect(page.locator('#actual-room')).toHaveText('Fire escape');
  await page.getByRole('button', { name: '01 Habitat', exact: true }).click();
  await expect(page.locator('#object-count')).toHaveText('1 object'); await expect(page.locator('#viewport')).toHaveAttribute('data-fly-present', 'false');
  await page.locator('#find-fly').click(); await expect(page.locator('#viewport')).toHaveAttribute('data-environment', 'fireescape');
  expect(errors).toEqual([]);
});

for (const room of ['habitat', 'fireescape', 'bar', 'rooftop']) test(`${room} renders its saved routine with stable animations`, async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const sim = new Simulation(); sim.environment = room; [sim.x, sim.z] = ROOMS[room].station; sim.y = sim.groundHeight() + .87;
  sim.life.action = sim.state = ROOMS[room].action; sim.life.actionUntil = 30; sim.heading = room === 'fireescape' ? 0 : Math.PI;
  if (room === 'habitat') { sim.life.tidiness = .15; sim.life.mood = .25; sim.life.motivation = .25; }
  const raw = encodeSession(sim, { paused: true });
  await page.addInitScript(raw => { if (!localStorage.getItem('hiflyguy.world.v1')) localStorage.setItem('hiflyguy.world.v1', raw); }, raw);
  await page.goto('/'); await expect(page.locator('#viewport')).toHaveAttribute('data-fly-present', 'true');
  await expect(page.locator('#behavior-pill')).toHaveText(ROOMS[room].action);
  await expect(page.locator('#vitals-note')).not.toHaveText('undefined');
  await page.locator('#viewport').screenshot({ path: `test-results/routine-${room}.png` });
  await page.locator('#focus-btn').click(); await page.locator('#viewport').screenshot({ path: `test-results/routine-${room}-close.png` });
  await page.locator('#pause-btn').click(); await page.waitForTimeout(1500); await page.locator('#pause-btn').click();
  const position = await page.locator('#coordinates').textContent(); await page.reload(); await expect(page.locator('#coordinates')).toHaveText(position);
  expect(errors).toEqual([]);
});

test('Six rooms, location controls and inventory fit phone fullscreen', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/'); await page.locator('#pause-btn').click();
  await page.locator('#fullscreen-btn').click();
  for (const room of ['habitat', 'fireescape', 'bar', 'rooftop']) {
    await page.locator(`button[data-environment="${room}"]`).click();
    for (const selector of ['.environment-controls', '.life-location', '.view-tools', '#inventory']) {
      const rect = await page.locator(selector).boundingBox(); expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.x + rect.width).toBeLessThanOrEqual(390);
    }
    await page.screenshot({ path: `test-results/life-mobile-${room}.png` });
  }
  await page.locator('#find-fly').click(); await expect(page.locator('#viewport')).toHaveAttribute('data-environment', 'habitat');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
});
