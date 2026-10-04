import { test, expect } from './member-fixture.js';
import { Simulation } from '../../src/simulation.js';
import { encodeSession } from '../../src/session.js';
test('Buzz, corner store, payroll and director scenes render and save',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const sim=new Simulation();sim.environment='store';sim.x=0;sim.z=-5.8;sim.life.social.nextShift=0;
 await page.addInitScript(raw=>localStorage.setItem('hiflyguy.account.test-creator.hiflyguy.world.v1',raw),encodeSession(sim));
 await page.goto('/');await expect(page.locator('#work-ledger')).toContainText('ON THE CLOCK');
 await page.locator('#call-buzz').click();await expect(page.locator('#toast')).toContainText('Work time is his own');await expect(page.locator('#buzz-status')).toContainText('in his circle');
 await page.locator('#viewport').screenshot({path:'test-results/workday-store.png'});
 await page.locator('#paid-early').click();await expect(page.locator('#work-ledger')).toContainText('OFF THE CLOCK');
 await page.locator('#director-btn').click();await page.locator('#director-actions-btn').click();
 await page.locator('#workday-action').click();await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','wake');
 await page.waitForTimeout(11000);await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','shift');
 await page.locator('#director-frame').screenshot({path:'test-results/workday-director.png'});
 await page.waitForTimeout(11500);await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','company');
 await page.locator('#director-frame').screenshot({path:'test-results/workday-company.png'});
 await page.waitForTimeout(5500);await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','bar');
 await page.locator('#director-frame').screenshot({path:'test-results/workday-bar.png'});
 await page.keyboard.press('Escape');await page.locator('#director-return').click();expect(errors).toEqual([]);
});


test('Phone room tabs fit and free accounts cannot call The Buzz',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.locator('[data-environment="store"]').click();await expect(page.locator('#viewport')).toHaveAttribute('data-environment','store');
 expect(await page.locator('.environment-controls').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.locator('#viewport').screenshot({path:'test-results/workday-phone.png'});
 await page.evaluate(()=>window.testMembership.set({creator:false,entitlement:null}));
 await expect(page.locator('#header-tier')).toHaveText('Free Tier');
 await page.locator('#call-buzz').click();await expect(page.locator('#upgrade-dialog')).toBeVisible();
 await expect(page.locator('#buzz-status')).toContainText('in his circle');
});

test('Focus follows a trip across multiple room boundaries',async({page})=>{
 const sim=new Simulation();sim.x=7;sim.z=-4;sim.life.route=['computer','bar'];sim.life.destination='bar';
 await page.addInitScript(raw=>localStorage.setItem('hiflyguy.account.test-creator.hiflyguy.world.v1',raw),encodeSession(sim,{paused:true}));
 await page.goto('/');await page.locator('#focus-btn').click();await page.locator('#pause-btn').click();
 await expect(page.locator('#viewport')).toHaveAttribute('data-environment','computer',{timeout:10000});
 await expect(page.locator('#focus-btn')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#viewport')).toHaveAttribute('data-environment','bar',{timeout:10000});
 await expect(page.locator('#focus-btn')).toHaveAttribute('aria-pressed','true');
});
