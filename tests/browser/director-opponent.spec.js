import {test,expect} from './member-fixture.js';
test('Opponent camera review: independent reflection, chair reveal, transformation and replay',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:540,height:960});
  await page.route('**/__opponent-preview',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>body{margin:0;--mono:monospace;background:#071118}#preview{position:fixed;inset:0}</style></head><body><div id="preview"></div></body></html>'}));
  await page.goto('/__opponent-preview');
  await page.evaluate(async()=>{await import('/src/director.css');const {OpponentStage}=await import('/src/director-opponent-stage.js');window.opponent=new OpponentStage(document.querySelector('#preview'));});
  for(const [name,time] of [['desk',1.5],['reflection',4.5],['chair-back',5],['chair-face',6.8],['red-eyes',7.3],['green-eyes',8],['hands',9.2],['red-chart',9.9],['green-chart',10.6],['empty',11.7],['final',13.8]]){
    await page.evaluate(t=>window.opponent.render(t),time);await page.screenshot({path:`test-results/opponent-${name}.png`});
  }
  const result=await page.evaluate(()=>{
    const s=window.opponent,pose=fly=>[...fly.group.rotation.toArray(),...fly.forelegs.flatMap(leg=>leg.segments.flatMap(m=>m.position.toArray()))];
    s.render(3.2);const lead=pose(s.fly),reflection=pose(s.reflectionFly);s.render(4.8);const leadAfter=pose(s.fly),reflectionAfter=pose(s.reflectionFly);
    s.render(6.8);const revealed=s.double.group.visible;s.render(13.8);const transformed=s.accessories.every(o=>o.visible)&&!s.double.group.visible&&s.rivalChair.visible;
    s.render(0);const reset=s.accessories.every(o=>!o.visible)&&!s.double.group.visible;
    return {lead,leadAfter,reflection,reflectionAfter,revealed,transformed,reset};
  });
  expect(result.lead).toEqual(result.leadAfter);expect(result.reflection).not.toEqual(result.reflectionAfter);
  expect(result.revealed&&result.transformed&&result.reset).toBe(true);
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
