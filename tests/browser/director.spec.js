import {test,expect} from '@playwright/test';
async function fixtures(page){
 await page.route('https://api.coinbase.com/**',route=>{const symbol=route.request().url().match(/prices\/(\w+)-USD/)[1];return route.fulfill({json:{data:{amount:String({BTC:78000,ETH:2500,SOL:106}[symbol]),base:symbol,currency:'USD'}}});});
 await page.route('https://s3.tradingview.com/**',r=>r.abort());
}
test('Director action hides UI, plays every shot, replays, and leaves the world intact',async({page})=>{
 test.setTimeout(70000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await fixtures(page);await page.goto('/');
 await page.locator('#pause-btn').click();const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('hiflyguy.world.v1')));
 await expect(page.locator('#director-actions-btn')).toBeHidden();
 await page.locator('#director-btn').click();await expect(page.locator('#director-actions-btn')).toBeVisible();
 expect(await page.locator('#memory-btn').evaluate(e=>e.nextElementSibling.id)).toBe('director-actions-btn');
 await page.locator('#director-actions-btn').click();await expect(page.locator('#director-actions')).toBeVisible();
 await page.locator('#maybach-action').click();await expect(page.locator('#director-cinema')).toHaveAttribute('data-state','lead-in');
 await expect(page.locator('#director-actions')).toBeHidden();await expect(page.locator('.view-tools')).toBeHidden();
 await page.waitForTimeout(500);
 await expect(page.locator('#director-cinema')).toHaveAttribute('data-state','playing',{timeout:3000});
 await page.waitForTimeout(2200);await page.screenshot({path:'test-results/director-elevator.png'});
 await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','turn',{timeout:5000});await page.screenshot({path:'test-results/director-turn.png'});
 await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','apartment',{timeout:4000});await page.screenshot({path:'test-results/director-apartment.png'});
 await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','wallet',{timeout:9000});
 const wallet=page.frameLocator('iframe[title="Aster Wallet cinematic display"]');await expect(wallet.locator('#portfolio')).toBeVisible();await expect(wallet.locator('#wallet-total')).not.toHaveText('\u2014');await page.screenshot({path:'test-results/director-wallet.png'});
 await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','chair',{timeout:6000});await page.waitForTimeout(2600);await page.screenshot({path:'test-results/director-chair.png'});
 await expect(page.locator('#director-finish')).toBeVisible({timeout:5000});
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('hiflyguy.world.v1')));delete before.savedAt;delete after.savedAt;expect(after).toEqual(before);
 await page.locator('#director-replay').click();await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','elevator');await expect(page.locator('#director-cinema')).toHaveAttribute('data-state','lead-in');
 await page.locator('#director-frame').dblclick();await expect(page.locator('#director-finish-title')).toContainText('Take stopped');
 await page.locator('#director-return').click();await expect(page.locator('#director-cinema')).toBeHidden();await expect(page.locator('.view-tools')).toBeVisible();
 await expect(page.locator('#pause-btn')).toHaveAttribute('aria-label','Resume simulation');
 await page.locator('#director-btn').click();await expect(page.locator('#director-actions-btn')).toBeHidden();
 expect(errors).toEqual([]);
});
test('Phone filming works when native fullscreen is unavailable and Escape cancels',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Not supported'));});await fixtures(page);await page.goto('/');
 await page.locator('#director-btn').click();await page.locator('#director-actions-btn').click();await page.screenshot({path:'test-results/director-actions-phone.png'});await page.locator('#maybach-action').click();
 const box=await page.locator('#director-frame').boundingBox();expect(box.width).toBe(390);expect(box.height).toBe(844);
 await page.waitForTimeout(3000);await page.screenshot({path:'test-results/director-phone.png'});
 await page.keyboard.press('Escape');await expect(page.locator('#director-finish')).toBeVisible();await page.locator('#director-return').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
