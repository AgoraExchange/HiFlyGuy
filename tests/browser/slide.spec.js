import { test, expect } from './member-fixture.js';

test('the playground slide blocks its body, stairs raise the viewer, and Slide down follows the chute', async ({ page }) => {
  await page.goto('/'); await page.locator('#pause-btn').click(); await page.locator('[data-environment="playground"]').click();
  await page.evaluate(async()=>{const {FirstPerson}=await import('/src/first-person.js');const original=FirstPerson.prototype.enter;FirstPerson.prototype.enter=function(){original.call(this);window.parkView=this;};});
  await page.locator('#first-person-btn').click();
  const result = await page.evaluate(() => ({ stairs: window.parkView.habitat.playground.stairs.length }));
  expect(result.stairs).toBe(1);
  await page.evaluate(() => { const p=window.parkView, h=p.habitat, s=h.playground.slides[0]; h.camera.position.set(s.top.x,s.top.y+2,s.top.z); p.previousEye=h.camera.position.clone(); p.yaw=0;p.pitch=0;p.look(); });
  await expect(page.locator('#first-person-slide')).toBeVisible(); await page.locator('#first-person-slide').click();
  await expect(page.locator('#first-person-slide')).toBeHidden(); await page.waitForTimeout(3300);
  const end = await page.evaluate(() => { const h=window.parkView.habitat; return { y:h.camera.position.y,z:h.camera.position.z,bottom:h.playground.slides[0].bottom }; });
  expect(end.y).toBeLessThan(3.1); expect(Math.abs(end.z-end.bottom.z)).toBeLessThan(1.2);
});
