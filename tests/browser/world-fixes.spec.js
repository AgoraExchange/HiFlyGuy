import { test, expect } from './member-fixture.js';

test('Ambient patrons pause, stay bounded, complete visits, and closed 7-11 admits nobody', async ({ page }) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const { WorkdayStage }=await import('/src/director-workday-stage.js');
    const host=document.createElement('div');host.id='fix-preview';host.style.cssText='position:fixed;inset:0;z-index:10000;background:#101820';document.body.append(host);
    const stage=new WorkdayStage(host);window.fixPreview=stage;
    stage.render(28);const rooms=stage.rooms,a=stage.actor;
    const patron=rooms.company[10];
    a.time=25;rooms.update(a);const first=patron.group.position.toArray();
    rooms.update(a);const second=patron.group.position.toArray();
    let bounded=true,hiddenAtDoor=false;
    for(let t=26;t<=180;t+=.5){
      a.time=t;rooms.updateCompany(a);
      const p=patron.group.position;
      bounded &&= Math.abs(p.x)<=8.71 && p.z>=-1.61 && p.z<=8.01 && Number.isFinite(p.y);
      if(!patron.group.visible)hiddenAtDoor=true;
    }
    stage.render(10);
    const open={sign:rooms.storeClosedSign.visible,customers:rooms.company.slice(5).filter(f=>f.group.visible).length};
    a.life.social.onClock=false;a.life.social.visitors=2;rooms.update(a);
    const closed={sign:rooms.storeClosedSign.visible,openSign:rooms.storeOpenSign.visible,duty:rooms.storeDutySign.visible,customers:rooms.company.filter(f=>f.group.visible).length};
    stage.renderer.render(stage.scene,stage.camera);
    return {first,second,bounded,hiddenAtDoor,open,closed};
  });
  expect(result.first).toEqual(result.second);expect(result.bounded).toBe(true);expect(result.hiddenAtDoor).toBe(true);
  expect(result.open.sign).toBe(false);expect(result.open.customers).toBeGreaterThan(0);
  expect(result.closed).toEqual({sign:true,openSign:false,duty:false,customers:0});
  await page.locator('#fix-preview').screenshot({path:'test-results/store-closed.png'});
  await page.evaluate(()=>{window.fixPreview.render(10);});
  await page.locator('#fix-preview').screenshot({path:'test-results/store-counter-fixed.png'});
  expect(errors).toEqual([]);
});

test('Wider bed clears the nightstand and the working fly clears the counter',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {WorkdayStage}=await import('/src/director-workday-stage.js');
    const host=document.createElement('div');host.id='fix-preview';host.style.cssText='position:fixed;inset:0;z-index:10000';document.body.append(host);
    const stage=new WorkdayStage(host);window.fixPreview=stage;stage.render(10);stage.scene.updateMatrixWorld(true);
    let bounds;
    stage.fly.group.traverseVisible(o=>{if(o.isMesh){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);if(bounds)bounds.union(b);else bounds=b;}});
    const counterBack=-4.2-1.8/2;
    const cashierFront=bounds.max.z;
    stage.render(1);
    const room=stage.rooms.rooms.get('habitat');
    const nightstand=room.children.find(o=>o.geometry?.parameters?.width===1.5&&o.geometry.parameters.height===1);
    const bed=room.children.find(o=>o.geometry?.parameters?.width===6.6);
    const gap=bed.position.x-bed.geometry.parameters.width/2-(nightstand.position.x+nightstand.geometry.parameters.width/2);
    return {gap,cashierFront,counterBack};
  });
  expect(result.gap).toBeGreaterThan(.25);expect(result.cashierFront).toBeLessThan(result.counterBack-.2);
  await page.locator('#fix-preview').screenshot({path:'test-results/bed-clearance.png'});
});

