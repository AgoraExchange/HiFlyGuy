import {test,expect} from './member-fixture.js';

test('Tesla camera review renders story, wallet, smoke, and solo/crew montage',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:540,height:960});
  await page.route('**/__tesla-preview',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>body{margin:0;--mono:monospace;background:#071118}#preview{position:fixed;inset:0}</style></head><body><div id="preview"></div></body></html>'}));
  await page.goto('/__tesla-preview');
  await page.evaluate(async()=>{await import('/src/director.css');const {TeslaStage}=await import('/src/director-tesla-stage.js');window.tesla=new TeslaStage(document.querySelector('#preview'));});
  for(const [name,time] of [['open',.2],['elevator',2.2],['mount',3.7],['scooter',5.3],['chair-hop',6],['chair-seated',6.49],['terminal',7.4],['wallet',8.8],['lighter',9.6],['crew',11.3],['drop',12.2],['hands',14.5],['smoke',15.5],['eyes',21.0],['hero',24.5]]){
    await page.evaluate(t=>window.tesla.render(t),time);await page.screenshot({path:`test-results/tesla-${name}.png`});
  }
  await page.evaluate(()=>window.tesla.render(8.8));await expect(page.locator('.tesla-terminal-insert')).toHaveAttribute('data-view','wallet');
  const contacts=await page.evaluate(async()=>{
    const T=await import('/node_modules/three/build/three.module.js'),s=window.tesla;
    s.render(5.3);s.scene.updateMatrixWorld(true);
    const grips=s.fly.forelegs.map(leg=>{
      const tip=new T.Vector3(0,.5,0).applyMatrix4(leg.segments[2].matrixWorld);
      const grip=new T.Vector3(leg.side*.68,2.05,1.12).applyMatrix4(s.scooter.group.matrixWorld);
      return tip.distanceTo(grip);
    });
    const {sampleTeslaTake}=await import('/src/director-tesla-timeline.js');
    const typing=[true,true];
    for(let time=6.5;time<s.duration;time+=.043){
      const frame=sampleTeslaTake(time);if(!frame.typing&&!frame.wallet)continue;
      s.render(time);s.night.scene.updateMatrixWorld(true);
      s.fly.forelegs.forEach((leg,i)=>{
        const tip=new T.Vector3(0,.5,0).applyMatrix4(leg.segments[2].matrixWorld);
        const key=s.keys.find(key=>{const b=new T.Box3().setFromObject(key);return tip.x>=b.min.x&&tip.x<=b.max.x&&tip.z>=b.min.z&&tip.z<=b.max.z;});
        const top=key?new T.Box3().setFromObject(key).max.y:Infinity;
        const clear=leg.segments.slice(1).every(segment=>new T.Box3().setFromObject(segment).min.y>=top);
        typing[i]&&=clear&&tip.y>=top+.02&&tip.y<=top+.09;
      });
    }
    return {grips,typing};
  });
  contacts.grips.forEach(distance=>expect(distance).toBeLessThan(.00001));expect(contacts.typing).toEqual([true,true]);
  const arrival=await page.evaluate(()=>{
    const s=window.tesla;s.render(0);const opening={fly:s.fly.group.visible,scooter:s.scooter.group.visible,girls:s.girls.some(g=>g.group.visible)};
    s.render(5.5);const start=s.fly.group.position.toArray();s.render(6);const middle=s.fly.group.position.toArray();s.render(6.4999);const seated=s.fly.group.position.toArray();
    s.render(20);s.render(0);return {opening,start,middle,seated,replayHidden:!s.fly.group.visible&&!s.scooter.group.visible};
  });
  expect(arrival.opening).toEqual({fly:false,scooter:false,girls:false});expect(arrival.replayHidden).toBe(true);
  expect(arrival.start[0]).toBeLessThan(-4);expect(arrival.middle[0]).toBeGreaterThan(arrival.start[0]);expect(arrival.middle[1]).toBeGreaterThan(arrival.seated[1]);
  expect(arrival.seated[0]).toBeCloseTo(0,4);expect(arrival.seated[1]).toBeCloseTo(2.35,4);
  await page.evaluate(()=>window.tesla.render(12));await expect(page.locator('#preview')).toHaveAttribute('data-girls','false');
  await page.evaluate(()=>{window.tesla.configure({drop:18,bpm:90});window.tesla.render(17);});await expect(page.locator('#preview')).toHaveAttribute('data-phase','story');
  await page.evaluate(()=>window.tesla.render(18));await expect(page.locator('#preview')).toHaveAttribute('data-phase','montage');
  await page.evaluate(()=>window.tesla.render(0));await expect(page.locator('#preview')).toHaveAttribute('data-shot','nightdesk-open');
  await page.evaluate(()=>window.tesla.dispose());expect(errors).toEqual([]);
});

test('Tesla action plays to completion, replays, and leaves the saved world untouched',async({page})=>{
  test.setTimeout(65000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://api.coinbase.com/**',r=>r.fulfill({json:{data:{amount:'78000',currency:'USD'}}}));await page.route('https://s3.tradingview.com/**',r=>r.abort());
  await page.goto('/');await page.locator('#pause-btn').click();
  const before=await page.evaluate(()=>localStorage.getItem('hiflyguy.account.test-creator.hiflyguy.world.v1'));
  await page.locator('#director-btn').click();await page.locator('#director-actions-btn').click();
  await page.locator('#tesla-drop').fill('8');await page.locator('#tesla-bpm').fill('160');await expect(page.locator('#tesla-duration')).toHaveText('17.0');
  await page.locator('#tesla-action').click();await expect(page.locator('#director-cinema')).toHaveAttribute('data-state','lead-in');
  await expect(page.locator('#director-frame')).toHaveAttribute('data-phase','montage',{timeout:14000});
  await expect(page.locator('#director-finish')).toBeVisible({timeout:12000});
  await page.locator('#director-replay').click();await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','nightdesk-open');
  await page.keyboard.press('Escape');await page.locator('#director-return').click();
  const after=await page.evaluate(()=>localStorage.getItem('hiflyguy.account.test-creator.hiflyguy.world.v1'));const a=JSON.parse(before),b=JSON.parse(after);delete a.savedAt;delete b.savedAt;expect(b).toEqual(a);
  await page.locator('#director-actions-btn').click();await page.locator('#comeback-action').click();await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','comeback-lab');
  expect(errors).toEqual([]);
});

test('Tesla timing controls and filming fit a phone without native fullscreen',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Unsupported'));});
  await page.goto('/');await page.locator('#director-btn').click();await page.locator('#director-actions-btn').click();
  await page.locator('#tesla-action').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/tesla-actions-phone.png'});
  await page.locator('#tesla-action').click();await expect(page.locator('#director-frame')).toHaveAttribute('data-shot','nightdesk-open');
  const bounds=await page.locator('#director-frame').boundingBox();expect(bounds.width).toBe(390);expect(bounds.height).toBe(844);
  await page.keyboard.press('Escape');await expect(page.locator('#director-finish')).toBeVisible();await page.locator('#director-return').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
