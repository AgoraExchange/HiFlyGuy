import {test,expect} from '@playwright/test';

test('Lab take plays, replays and switches to Maybach without changing the saved world',async({page})=>{
 test.setTimeout(70000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://api.coinbase.com/**',r=>r.fulfill({json:{data:{amount:'78000',currency:'USD'}}}));
 await page.route('https://s3.tradingview.com/**',r=>r.abort());await page.goto('/');
 await page.locator('#pause-btn').click();
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('hiflyguy.world.v1')));
 await page.locator('#director-btn').click();await page.locator('#director-actions-btn').click();await page.locator('#lab-action').click();
 await expect(page.locator('#director-cinema')).toHaveAttribute('data-state','lead-in');
 await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','loss');
 for(const shot of ['isolation','interrogation','correction','aftermath']){
   await expect(page.locator('#director-frame')).toHaveAttribute('data-shot',shot,{timeout:8500});
   if(shot==='correction')await page.waitForTimeout(900);
   await page.screenshot({path:`test-results/lab-${shot}.png`});
 }
 await expect(page.locator('#director-finish')).toBeVisible({timeout:8500});
 await page.locator('#director-replay').click();await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','loss');
 await page.keyboard.press('Escape');await page.locator('#director-return').click();
 await page.locator('#director-actions-btn').click();await page.locator('#maybach-action').click();
 await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','elevator');await expect(page.locator('.lab-overlay')).toHaveCount(0);
 await page.keyboard.press('Escape');await page.locator('#director-return').click();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('hiflyguy.world.v1')));delete before.savedAt;delete after.savedAt;expect(after).toEqual(before);
 expect(errors).toEqual([]);
});
