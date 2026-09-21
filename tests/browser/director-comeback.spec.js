import {test,expect} from '@playwright/test';

test('Comeback films all shots, replays, switches takes and preserves the world',async({page})=>{
  test.setTimeout(65000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://api.coinbase.com/**',r=>r.fulfill({json:{data:{amount:'78000',currency:'USD'}}}));
  await page.route('https://s3.tradingview.com/**',r=>r.abort());
  await page.goto('/');await page.locator('#pause-btn').click();
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('hiflyguy.world.v1')));
  await page.locator('#director-btn').click();await page.locator('#director-actions-btn').click();await page.locator('#comeback-action').click();
  await expect(page.locator('#director-cinema')).toHaveAttribute('data-state','lead-in');
  for(const shot of ['comeback-lab','profit','comeback-elevator','pair-one','pair-two','three-pairs','comeback-strut','feet-on-desk']){
    await expect(page.locator('#director-frame')).toHaveAttribute('data-shot',shot,{timeout:6500});
    if(shot==='profit')await expect(page.locator('.comeback-profit')).toBeVisible();
    if(['three-pairs','feet-on-desk'].includes(shot))await page.waitForTimeout(1300);
    await page.screenshot({path:`test-results/${shot}.png`});
  }
  await expect(page.locator('#director-finish')).toBeVisible({timeout:6000});
  await page.locator('#director-replay').click();await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','comeback-lab');
  await page.keyboard.press('Escape');await page.locator('#director-return').click();
  await page.locator('#director-actions-btn').click();await page.locator('#lab-action').click();
  await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','loss');await expect(page.locator('.comeback-overlay')).toHaveCount(0);
  await page.keyboard.press('Escape');await page.locator('#director-return').click();
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('hiflyguy.world.v1')));delete before.savedAt;delete after.savedAt;expect(after).toEqual(before);
  expect(errors).toEqual([]);
});

test('Comeback action fits a phone and works without fullscreen',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Unsupported'));});
  await page.goto('/');await page.locator('#director-btn').click();await page.locator('#director-actions-btn').click();
  await page.locator('#comeback-action').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/comeback-actions-phone.png'});
  await page.locator('#comeback-action').click();
  await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','comeback-lab');
  const bounds=await page.locator('#director-frame').boundingBox();expect(bounds.width).toBe(390);expect(bounds.height).toBe(844);
  await page.keyboard.press('Escape');await expect(page.locator('#director-finish')).toBeVisible();
  await page.locator('#director-return').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
