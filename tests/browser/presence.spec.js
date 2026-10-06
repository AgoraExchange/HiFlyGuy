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

for (const mobile of [false,true]) test(`direct conversation holds movement and look until finished on ${mobile?'mobile':'desktop'}`,async({page})=>{
  if(mobile)await page.setViewportSize({width:390,height:844});
  await enter(page);
  await page.keyboard.down('KeyD');await page.keyboard.down('Space');
  await page.evaluate(async()=>{
    const {FlyDialogue}=await import('/src/dialogue.js'),original=FlyDialogue.prototype.update;
    FlyDialogue.prototype.update=function(dt,sim,options){
      if(options.running&&options.canAddress){this.current=null;this.next=0;this.nextViewer=0;this.lastContext=sim.environment;FlyDialogue.prototype.update=original;}
      return original.call(this,dt,sim,options);
    };
  });
  await page.locator('#pause-btn').click();
  await expect(page.locator('#viewport')).toHaveClass(/fly-addressing/);
  const pose=()=>page.evaluate(()=>{const h=window.testPresence.habitat;return [...h.camera.position.toArray(),...h.camera.quaternion.toArray()];});
  const locked=await pose();
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowUp');await page.keyboard.press('Escape');
  const canvas=page.locator('#viewport > canvas'),box=await canvas.boundingBox();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.mouse.down();
  await page.mouse.move(box.x+box.width*.7,box.y+box.height*.4);await page.mouse.up();
  if(mobile){
    await page.locator('#movement-joystick').dispatchEvent('pointerdown',{pointerType:'touch',pointerId:10,clientX:80,clientY:500,button:0});
    await canvas.dispatchEvent('pointermove',{pointerType:'touch',pointerId:11,clientX:240,clientY:350});
  }
  await expect(page.locator('#fly-speech.to-viewer')).toBeVisible({timeout:12000});
  expect(await pose()).toEqual(locked);
  await expect(page.locator('#viewport')).not.toHaveClass(/fly-addressing/,{timeout:20000});
  await page.keyboard.up('KeyD');await page.keyboard.up('Space');
  await expect(page.locator('#viewport')).toHaveAttribute('data-first-person','true');
  const start=await pose();await page.keyboard.down('KeyA');await page.waitForTimeout(350);await page.keyboard.up('KeyA');
  const end=await pose();expect(Math.hypot(end[0]-start[0],end[2]-start[2])).toBeGreaterThan(.2);
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
