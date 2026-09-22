import {test,expect} from './member-fixture.js';
test('Opponent camera review: reflection, match-cut transformation and replay',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:540,height:960});
  await page.route('**/__opponent-preview',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>body{margin:0;--mono:monospace;background:#071118}#preview{position:fixed;inset:0}</style></head><body><div id="preview"></div></body></html>'}));
  await page.goto('/__opponent-preview');
  await page.evaluate(async()=>{await import('/src/director.css');const {OpponentStage}=await import('/src/director-opponent-stage.js');window.opponent=new OpponentStage(document.querySelector('#preview'));});
  for(const [name,time] of [['desk',1.5],['reflection',3.5],['resolve',4.8],['mirror-match',5.6],['ready',6.99],['transform',7],['hands',8.9],['green-chart',9.7],['green-eyes',10.4],['final',13.8]]){
    await page.evaluate(t=>window.opponent.render(t),time);await page.screenshot({path:`test-results/opponent-${name}.png`});
  }
  const result=await page.evaluate(()=>{
    const s=window.opponent,pose=fly=>[...fly.group.rotation.toArray(),...fly.forelegs.flatMap(leg=>leg.segments.flatMap(m=>m.position.toArray()))];
    s.render(6.999);const readyCamera=s.camera.position.toArray(),readyPose=s.fly.group.rotation.toArray();
    s.render(7);const dropCamera=s.camera.position.toArray(),dropPose=s.fly.group.rotation.toArray();
    const transformed=s.accessories.every(o=>o.visible)&&!s.double.group.visible;
    s.render(13.8);const mirrored=s.reflectionAccessories.every(o=>o.visible)&&s.screen.material===s.mirrorMaterial;
    const handsMatch=JSON.stringify(s.fly.forelegs.map(l=>l.segments.map(m=>m.position.toArray())))===JSON.stringify(s.reflectionFly.forelegs.map(l=>l.segments.map(m=>m.position.toArray())));
    s.render(0);const reset=s.accessories.every(o=>!o.visible)&&!s.double.group.visible;
    return {readyCamera,dropCamera,readyPose,dropPose,transformed,mirrored,handsMatch,reset};
  });
  expect(result.readyCamera).toEqual(result.dropCamera);expect(result.readyPose[0]).toBeCloseTo(result.dropPose[0],3);
  expect(result.transformed&&result.mirrored&&result.handsMatch&&result.reset).toBe(true);
  await page.evaluate(()=>window.opponent.dispose());expect(errors).toEqual([]);
});
test('Opponent action completes, replays and preserves the saved world',async({page})=>{
  await page.route('https://api.coinbase.com/**',r=>r.fulfill({json:{data:{amount:'78000',currency:'USD'}}}));await page.route('https://s3.tradingview.com/**',r=>r.abort());
  await page.goto('/');await page.locator('#pause-btn').click();const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('hiflyguy.account.test-creator.hiflyguy.world.v1')));
  await page.locator('#director-btn').click();await page.locator('#director-actions-btn').click();await page.locator('#opponent-action').click();
  await expect(page.locator('#director-cinema')).toHaveAttribute('data-state','lead-in');await expect(page.locator('#director-finish')).toBeVisible({timeout:22000});
  await page.locator('#director-replay').click();await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','red-desk');
  await page.keyboard.press('Escape');await page.locator('#director-return').click();
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('hiflyguy.account.test-creator.hiflyguy.world.v1')));delete before.savedAt;delete after.savedAt;expect(after).toEqual(before);
  await page.locator('#director-actions-btn').click();await page.locator('#tesla-action').click();await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','nightdesk-open');
});
