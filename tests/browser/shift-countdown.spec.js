import {test,expect} from './member-fixture.js';
import {Simulation} from '../../src/simulation.js';
import {encodeSession} from '../../src/session.js';

test('Shift countdown freezes on a break, extends for overtime, and switches at clock-out',async({page})=>{
 const sim=new Simulation();sim.environment='store';sim.x=-2;sim.z=-7.2;sim.state='Working';
 sim.life.social.onClock=true;sim.life.social.worked=30;sim.life.social.earned=16;
 await page.addInitScript(raw=>localStorage.setItem('hiflyguy.account.test-creator.hiflyguy.world.v1',raw),encodeSession(sim));
 await page.goto('/');const label=page.locator('#shift-countdown');
 await expect(label).toContainText('Shift ends in');
 await page.keyboard.press('6');await expect(label).toContainText('On break');
 const seconds=async()=>{const text=await label.textContent();const match=text.match(/ends in (\d+):(\d+)/);return Number(match[1])*60+Number(match[2]);};
 const frozen=await seconds();await page.waitForTimeout(1100);expect(await seconds()).toBe(frozen);
 await page.locator('#overtime').click();await expect.poll(seconds).toBe(frozen+30);
 await page.locator('#paid-early').click();await expect(label).toContainText('Next shift in');
 await page.locator('#viewport').screenshot({path:'test-results/shift-countdown-after-work.png'});
});
