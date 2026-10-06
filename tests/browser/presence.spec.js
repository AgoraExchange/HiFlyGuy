import { test, expect } from './member-fixture.js';
import { Simulation } from '../../src/simulation.js';
import { encodeSession } from '../../src/session.js';

async function enter(page, paused = true) {
  const sim = new Simulation(); sim.environment = 'playground'; sim.x = -3.5; sim.z = 2; sim.y = 2.05;
  sim.life.autonomous = false; sim.hunger = .2; sim.training.nextVisitAt = 1000;
  await page.addInitScript(raw => localStorage.setItem('hiflyguy.account.test-creator.hiflyguy.world.v1', raw), encodeSession(sim, { paused }));
  await page.goto('/');
  await page.evaluate(async () => {
    const { FirstPerson } = await import('/src/first-person.js');
    const original = FirstPerson.prototype.enter;
    FirstPerson.prototype.enter = function() { original.call(this); window.testPresence = this; };
  });
  await page.locator('#first-person-btn').click();
}

test('first person cannot move through FlyGuy and clears its live presence on exit', async ({ page }) => {
  await enter(page);
  await page.keyboard.down('KeyW'); await page.waitForTimeout(2200); await page.keyboard.up('KeyW');
  const state = await page.evaluate(() => {
    const p = window.testPresence, h = p.habitat;
    return { distance: h.camera.position.distanceTo(h.fly.group.position), z: h.camera.position.z, flyZ: h.fly.group.position.z, observer: p.sim.observer, eye: h.camera.position.toArray() };
  });
  expect(state.distance).toBeGreaterThanOrEqual(2.149); expect(state.z).toBeGreaterThan(state.flyZ);
  expect([state.observer.x, state.observer.y, state.observer.z]).toEqual(state.eye);
  await page.locator('#exit-first-person').click();
  expect(await page.evaluate(() => window.testPresence.sim.observer)).toBeNull();
});

test('FlyGuy approaches the first-person view, faces the viewer, and leaves their camera unchanged', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await enter(page, false);
  const eye = await page.evaluate(() => window.testPresence.habitat.camera.position.toArray());
  await page.evaluate(async () => {
    const { FlyDialogue } = await import('/src/dialogue.js'); const original = FlyDialogue.prototype.update;
    FlyDialogue.prototype.update = function(dt, sim, options) {
      if (options.canAddress) { this.current = null; this.next = 0; this.nextViewer = 0; this.lastContext = sim.environment; FlyDialogue.prototype.update = original; }
      return original.call(this, dt, sim, options);
    };
  });
  await expect(page.locator('#fly-speech.to-viewer')).toBeVisible({ timeout: 12000 });
  const result = await page.evaluate(() => {
    const h = window.testPresence.habitat, p = h.fly.group.position.clone().project(h.camera);
    const toward = h.camera.position.clone().sub(h.fly.group.position).normalize();
    const facing = h.fly.group.getWorldDirection(toward.clone());
    return { firstPerson: h.encounter.firstPerson, projection: p.toArray(), facing: facing.dot(toward), eye: h.camera.position.toArray() };
  });
  expect(result.firstPerson).toBe(true); expect(Math.abs(result.projection[0])).toBeLessThan(.1); expect(Math.abs(result.projection[1])).toBeLessThan(.1);
  expect(result.facing).toBeGreaterThan(.98); expect(result.eye).toEqual(eye);
  await page.screenshot({ path: 'test-results/first-person-conversation.png' });
  await expect(page.locator('#end-encounter')).toBeHidden({ timeout: 20000 });
  expect(await page.evaluate(() => window.testPresence.habitat.camera.position.toArray())).toEqual(eye);
  await expect(page.locator('#viewport')).toHaveAttribute('data-first-person', 'true'); expect(errors).toEqual([]);
});
