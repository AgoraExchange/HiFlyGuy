import { test, expect } from './member-fixture.js';
import { Simulation } from '../../src/simulation.js';
import { encodeSession } from '../../src/session.js';

test('Megacity towers, HQ, pause, saving and room switching', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const sim = new Simulation(); sim.environment = 'megacity'; sim.x = 0; sim.z = -3; sim.y = .87; sim.heading = Math.PI;
  sim.state = sim.life.action = 'Working'; sim.life.actionUntil = 90; sim.life.holdUntil = 120;
  const raw = encodeSession(sim, { paused: true });
  await page.addInitScript(raw => localStorage.setItem('hiflyguy.account.test-creator.hiflyguy.world.v1', raw), raw);
  await page.goto('/');
  await expect(page.locator('#viewport')).toHaveAttribute('data-environment', 'megacity');
  await expect(page.locator('.megacity-panel')).toBeVisible();
  await page.locator('#viewport').screenshot({ path: 'test-results/megacity-skyline.png' });
  for (const id of ['power', 'food', 'lab', 'cargo', 'hq']) {
    await page.locator(`[data-building="${id}"]`).click();
    await expect(page.locator('#viewport')).toHaveAttribute('data-city-building', id);
    await expect(page.locator('[data-city-task]')).not.toBeEmpty();
    await page.locator('#viewport').screenshot({ path: `test-results/megacity-${id}.png` });
    await page.locator('[data-city-back]').click();
  }
  await page.locator('[data-city-hq]').click();
  await expect(page.locator('[data-city-lead]')).toContainText('Fly Guy · at headquarters');
  const status = await page.locator('[data-city-status]').textContent();
  await page.waitForTimeout(500); await expect(page.locator('[data-city-status]')).toHaveText(status);
  await page.keyboard.press('Escape'); await expect(page.locator('#viewport')).toHaveAttribute('data-city-building', 'skyline');
  await page.locator('[data-environment="habitat"]').click(); await expect(page.locator('.megacity-panel')).toBeHidden();
  await page.locator('[data-environment="megacity"]').click(); await expect(page.locator('.megacity-panel')).toBeVisible();
  await page.locator('#focus-btn').click(); await expect(page.locator('#viewport')).toHaveAttribute('data-city-building', 'hq');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#viewport').screenshot({ path: 'test-results/megacity-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('Skyline towers respond to a direct canvas click', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await page.locator('[data-environment="megacity"]').click();
  await expect(page.locator('#viewport')).toHaveAttribute('data-city-building', 'skyline');
  const point = await page.evaluate(async () => {
    const T = await import('/node_modules/three/build/three.module.js');
    const rect = document.querySelector('#viewport > canvas').getBoundingClientRect();
    const camera = new T.PerspectiveCamera(rect.width < rect.height ? 55 : 38, rect.width / rect.height, .1, 240);
    camera.position.set(96, 76, 118); camera.lookAt(0, 13, 0); camera.updateMatrixWorld();
    const p = new T.Vector3(23, 18, -15).project(camera);
    return { x: (p.x + 1) * rect.width / 2, y: (1 - p.y) * rect.height / 2 };
  });
  await page.locator('#viewport > canvas').click({ position: point });
  await expect(page.locator('#viewport')).toHaveAttribute('data-city-building', 'food');
  await expect(page.locator('[data-city-lead]')).toContainText('Registrar');
  expect(errors).toEqual([]);
});

test('Office laptops have close-up views and TradingView layers hide on room exit', async ({ page }) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.locator('#pause-btn').click();
  await expect(page.locator('button[data-environment] span')).toHaveText(['Habitat','Night desk','Fire escape','Rooftop','Bar','7-11','Playground','Megacity']);
  await page.locator('[data-environment="megacity"]').click();
  for(const id of ['power','food','lab','cargo']) {
    await page.locator(`[data-building="${id}"]`).click();
    if(id==='power') {
      await expect(page.locator('.city-market-layer iframe')).toHaveCount(3);
      await expect(page.frameLocator('iframe[title="Wing Street workstation 1 - TradingView"]').locator('header strong')).toHaveText('WING STREET / TERMINAL');
    }
    await page.locator('[data-desk="0"]').click();
    await page.locator('#viewport').screenshot({path:`test-results/megacity-laptop-${id}.png`});
    await page.locator('[data-city-back]').click();
    await page.locator('[data-city-toggle]').click();
  }
  await page.locator('[data-environment="habitat"]').click();
  await expect(page.locator('.city-market-layer')).toBeHidden();
  expect(errors).toEqual([]);
});
