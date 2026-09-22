import {test,expect} from './member-fixture.js';

test('Comeback shoes and seated desk pose stay attached, grounded and separated',async({page})=>{
  test.setTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:540,height:960});
  await page.route('**/__comeback-preview',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>body{margin:0;background:#080d10;--mono:monospace}#preview{position:fixed;inset:0;overflow:hidden}</style></head><body><div id="preview"></div></body></html>'}));
  await page.goto('/__comeback-preview');
  await page.evaluate(async()=>{
    await import('/src/director.css');const {ComebackStage}=await import('/src/director-comeback-stage.js');
    window.previewStage=new ComebackStage(document.querySelector('#preview'));
  });
  for(const [name,time] of [['shoe-detail',6.7],['second-pair',8.1],['six-sandals',10],['seated-start',14],['seated-lift',14.8],['seated-wide',16],['seated-final',17.8]]){
    await page.evaluate(time=>window.previewStage.render(time),time);
    await page.screenshot({path:`test-results/refined-${name}.png`});
  }
  const geometry=await page.evaluate(async()=>{
    const T=await import('/node_modules/three/build/three.module.js');
    const s=window.previewStage,fly=s.suite.fly.group;s.deskSet.scene.updateMatrixWorld(true);
    const monitor=new T.Box3().setFromObject(s.deskSet.monitor),chair=new T.Box3().setFromObject(s.deskSet.chair);
    const shoes=s.outfit.feet.map(f=>({bottom:new T.Box3().setFromObject(f.shoe).min.y,center:f.shoe.getWorldPosition(new T.Vector3()).toArray(),normal:new T.Vector3(0,1,0).applyQuaternion(f.shoe.getWorldQuaternion(new T.Quaternion())).toArray()}));
    const forward=new T.Vector3(0,0,1).applyQuaternion(fly.quaternion);
    return {intersection:monitor.intersectsBox(chair),gap:chair.min.z-monitor.max.z,shoes,forward:forward.toArray(),fly:fly.position.toArray()};
  });
  expect(geometry.intersection).toBe(false);expect(geometry.gap).toBeGreaterThan(2);
  expect(geometry.forward[2]).toBeLessThan(-.6);
  for(const shoe of geometry.shoes){
    expect(shoe.bottom).toBeCloseTo(2.513,2);expect(shoe.normal[1]).toBeCloseTo(1,5);
    expect(shoe.center[2]).toBeLessThan(-.5);expect(shoe.center[2]).toBeGreaterThan(-1.5);
  }
  await page.evaluate(()=>window.previewStage.render(6.7));
  await expect(page.locator('#preview')).toHaveAttribute('data-shot','pair-one');
  await page.evaluate(()=>window.previewStage.dispose());expect(errors).toEqual([]);
});
