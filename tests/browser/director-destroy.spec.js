import {test,expect} from './member-fixture.js';
test('Destroy camera review: arrival, staged wallet progression and replay',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:540,height:960});
  await page.route('**/__destroy-preview',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>body{margin:0;--mono:monospace;background:#071118}#preview{position:fixed;inset:0}</style></head><body><div id="preview"></div></body></html>'}));
  await page.goto('/__destroy-preview');
  await page.evaluate(async()=>{await import('/src/director.css');const {DestroyStage}=await import('/src/director-destroy-stage.js');window.take=new DestroyStage(document.querySelector('#preview'));window.take.resize();});
  for(const [name,time] of [['check-in',.5],['walk',2.8],['sit',4.65],['locked',5.5],['hands',7],['chart',8.4],['wallet-one',9.6],['wallet-two',13.5],['wallet-three',18.3],['hero',21.3]]){
    await page.evaluate(t=>window.take.render(t),time);await page.screenshot({path:'test-results/destroy-'+name+'.png'});
  }
  const result=await page.evaluate(()=>{
    const s=window.take;s.render(9.6);const first=s.host.dataset.closedTrades;s.render(13.5);const second=s.host.dataset.closedTrades;
    s.render(18.3);const third=s.host.dataset.closedTrades,insert=s.terminal.insert.hidden;
    s.render(0);const reset=s.host.dataset.shot,low=s.fly.group.position.y;
    s.render(5);const seated=s.fly.group.position.y,hidden=s.girls.every(g=>!g.group.visible)&&!s.fly.lifeProps.smoke.visible;
    const finite=s.fly.forelegs.every(l=>l.segments.every(m=>m.position.toArray().every(Number.isFinite)));
    s.dispose();return {first,second,third,insert,reset,low,seated,hidden,finite};
  });
  expect([result.first,result.second,result.third]).toEqual(['1','2','3']);expect(result.insert).toBe(false);
  expect(result.reset).toBe('check-in');expect(result.low).toBeLessThan(result.seated);expect(result.hidden&&result.finite).toBe(true);expect(errors).toEqual([]);
});
test('Destroy completes with custom drop, replays and preserves the world',async({page})=>{
  await page.route('https://api.coinbase.com/**',r=>r.abort());await page.route('https://s3.tradingview.com/**',r=>r.abort());
  await page.goto('/');await page.locator('#pause-btn').click();
  const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hiflyguy.account.test-creator.hiflyguy.world.v1')));
  const before=await read();
  await page.locator('#director-btn').click();await page.locator('#director-actions-btn').click();
  await page.locator('#destroy-drop').fill('3');await page.locator('#destroy-action').click();
  await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','check-in');
  await expect(page.locator('#director-frame')).toHaveAttribute('data-phase','montage',{timeout:7000});
  await expect(page.locator('#director-finish')).toBeVisible({timeout:24000});
  await page.locator('#director-replay').click();await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','check-in');
  await page.keyboard.press('Escape');await page.locator('#director-return').click();
  const after=await read();delete before.savedAt;delete after.savedAt;expect(after).toEqual(before);
});
