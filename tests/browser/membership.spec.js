import {test,expect} from '@playwright/test';
import {mockMembership} from './member-mock.js';
const guest={user:null,profile:null,creator:false,entitlement:null};
const free={user:{uid:'test-member',email:'visitor@example.test'},profile:{username:'test_member'},creator:false,entitlement:null};
async function fixtures(page,state=guest){await mockMembership(page,state);await page.route('https://s3.tradingview.com/**',r=>r.abort());await page.route('https://api.coinbase.com/**',r=>r.fulfill({json:{data:{amount:'78000',currency:'USD'}}}));}
test('Splash leads to visitor entry, fruit stays in Habitat and keyboard tools stay locked',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await fixtures(page);await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#world-splash')).toBeVisible();await expect(page.locator('#entry-dialog')).toBeVisible({timeout:6000});
  await page.screenshot({path:'test-results/member-entry-desktop.png'});await page.locator('#guest-enter').click();
  await expect(page.locator('#director-btn')).toBeHidden();await expect(page.locator('#playback-status')).toHaveText('Virtual World Running');
  await page.locator('[data-environment="computer"]').click();await page.locator('.stimulus-card[data-stimulus="banana"]').click();
  await expect(page.locator('#viewport')).toHaveAttribute('data-environment','habitat');await page.locator('#place-center').click();
  await expect(page.locator('#object-count')).toHaveText('1 object');await page.keyboard.press('4');await expect(page.locator('#entry-dialog')).toBeVisible();
  await page.locator('#guest-enter').click();await page.locator('#memory-btn').click();await expect(page.locator('#science-brain canvas')).toBeVisible();
  await expect(page.locator('#dialog-body')).toContainText('768 model units');await page.screenshot({path:'test-results/member-brain.png'});
  await page.locator('#close-dialog').click();await expect(page.locator('.neural-panel #brain-view')).toBeVisible();
  await page.locator('[data-open="help"]').click();await expect(page.locator('#dialog-body')).toContainText('visitor pass');await page.locator('#close-dialog').click();
  await page.locator('#developer-notes').click();await expect(page.locator('#developer-dialog')).toContainText('Small wings.');
  expect(errors).toEqual([]);
});
test('Free members confirm their username before Square; verified grants unlock and expiry re-locks',async({page})=>{
  await fixtures(page,free);await page.goto('/');await expect(page.locator('#world-splash')).toBeHidden({timeout:6000});
  await expect(page.locator('#header-tier')).toHaveText('Free Tier');await page.locator('.swatter-launch').click();
  await expect(page.locator('#upgrade-dialog')).toBeVisible();await page.locator('[data-plan="god"]').click();
  await page.locator('#upgrade-username').fill('someone_else');await page.locator('#prepare-checkout').click();
  await expect(page.locator('#upgrade-status')).toContainText('signed-in account');await expect(page.locator('#square-checkout')).toBeHidden();
  await page.locator('#upgrade-username').fill('test_member');await page.locator('#prepare-checkout').click();
  await expect(page.locator('#square-checkout')).toHaveAttribute('href','https://square.link/u/u4wSCV1J');await expect(page.locator('#header-tier')).toHaveText('Free Tier');
  await page.screenshot({path:'test-results/member-plans-desktop.png'});
  await page.locator('#upgrade-dialog [data-member-close]').click();
  await page.evaluate(()=>window.testMembership.set({verified:true,entitlement:{tier:'god',expiresAt:Date.now()+3600000}}));
  await expect(page.locator('#header-tier')).toHaveText('Da God');await expect(page.locator('#director-btn')).toBeHidden();
  await page.locator('.swatter-launch').click();await expect(page.locator('#swatter-banner')).toBeVisible();
  await page.evaluate(()=>window.testMembership.set({entitlement:{tier:'god',expiresAt:Date.now()-1}}));
  await expect(page.locator('#header-tier')).toHaveText('Free Tier');await expect(page.locator('#swatter-banner')).toBeHidden();await expect(page.locator('#director-btn')).toBeHidden();
});
test('Phone entry, signup, account separation and scrollable membership fit without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await fixtures(page);await page.goto('/');await expect(page.locator('#entry-dialog')).toBeVisible({timeout:6000});
  await page.screenshot({path:'test-results/member-entry-phone.png'});await page.locator('[data-auth-mode="signup"]').click();
  await page.locator('#auth-username').fill('new_fly');await page.locator('#auth-password').fill('strongPassword123');await page.locator('#auth-submit').click();
  await expect(page.locator('#header-tier')).toHaveText('Free Tier');await page.locator('#account-button').click();await expect(page.locator('#account-name')).toHaveText('@new_fly');
  await page.locator('#account-upgrade').click();await expect(page.locator('#upgrade-dialog')).toBeVisible();await page.screenshot({path:'test-results/member-plans-phone.png'});
  expect(await page.locator('#upgrade-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.locator('#upgrade-dialog [data-member-close]').click();await page.locator('#account-button').click();await page.locator('#account-signout').click();await page.locator('#guest-enter').click();
  await expect(page.locator('#header-tier')).toHaveText('Visitor pass');await expect(page.locator('#object-count')).toHaveText('0 objects');
});

test('Godfather has exclusive creator access and loses it when the owner role is removed',async({page})=>{
 await fixtures(page,{...free,creator:true});await page.goto('/');await expect(page.locator('#world-splash')).toBeHidden({timeout:6000});
 await expect(page.locator('#header-tier')).toHaveText('Godfather');await page.locator('#director-btn').click();await page.locator('#director-actions-btn').click();
 await expect(page.locator('#opponent-action')).toBeVisible();await page.locator('#director-close').click();
 await page.evaluate(()=>window.testMembership.set({creator:false,verified:true,entitlement:{tier:'god',expiresAt:Date.now()+10000}}));
 await expect(page.locator('#header-tier')).toHaveText('Da God');await expect(page.locator('#director-btn')).toBeHidden();
});

test('Username login errors and password changes work without an email field',async({page})=>{
 await fixtures(page);await page.goto('/');await expect(page.locator('#entry-dialog')).toBeVisible({timeout:6000});
 await page.locator('#auth-username').fill('test_member');await page.locator('#auth-password').fill('wrongpass');await page.locator('#auth-submit').click();
 await expect(page.locator('#auth-status')).toContainText('username or password');await expect(page.locator('#auth-email')).toHaveCount(0);
 await page.locator('#auth-password').fill('testPassword123');await page.locator('#auth-submit').click();await page.locator('#account-button').click();
 await page.locator('#account-dialog summary').click();await page.locator('#current-password').fill('testPassword123');await page.locator('#new-password').fill('newTestPassword123');await page.locator('#confirm-password').fill('newTestPassword123');
 await page.locator('#password-change-form button').click();await expect(page.locator('#password-change-status')).toHaveText('Password updated.');
});

test('Night desk laptop and terminal require membership and close on expiry',async({page})=>{
  await fixtures(page);await page.goto('/');await page.locator('#guest-enter').click();
  await page.locator('[data-environment="computer"]').click();
  const terminal=page.frameLocator('.laptop-display iframe');
  const screenButton=terminal.locator('#scene-market-button');
  await expect(screenButton).toBeVisible();
  await expect(page.locator('#terminal-btn')).toHaveClass(/access-locked/);
  const box=await screenButton.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  await expect(page.locator('#entry-dialog')).toBeVisible();
  await expect(screenButton).not.toHaveAttribute('aria-expanded','true');
  await page.locator('#guest-enter').click();await page.locator('#terminal-btn').click();
  await expect(page.locator('#entry-dialog')).toBeVisible();await expect(page.locator('#terminal-dialog')).toBeHidden();
  await page.locator('#guest-enter').click();
  await page.evaluate(state=>window.testMembership.set(state),free);
  await page.locator('[data-environment="computer"]').click();await page.locator('#terminal-btn').click();
  await expect(page.locator('#upgrade-dialog')).toBeVisible();await page.locator('#upgrade-dialog [data-member-close]').click();
  await screenButton.focus();await page.keyboard.press('Enter');await expect(page.locator('#upgrade-dialog')).toBeVisible();
  await page.locator('#upgrade-dialog [data-member-close]').click();
  await page.evaluate(()=>window.testMembership.set({verified:true,entitlement:{tier:'flyest',expiresAt:Date.now()+3600000}}));
  await page.locator('#terminal-btn').click();await expect(page.locator('#terminal-dialog')).toBeVisible();
  await page.evaluate(()=>window.testMembership.set({entitlement:{tier:'flyest',expiresAt:Date.now()-1}}));
  await expect(page.locator('#terminal-dialog')).toBeHidden();await expect(page.locator('#terminal-btn')).toHaveClass(/access-locked/);
});
