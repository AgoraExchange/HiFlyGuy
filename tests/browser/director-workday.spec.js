import {test,expect} from './member-fixture.js';

test('Workday call clears bed, Buzz uses stools, and the take ends sleeping together',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:620,height:1100});await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {WorkdayStage}=await import('/src/director-workday-stage.js');
    const host=document.createElement('div');host.id='workday-preview';host.style.cssText='position:fixed;inset:0;z-index:10000;background:#101820';document.body.append(host);
    const stage=new WorkdayStage(host);window.workdayPreview=stage;stage.render(18);stage.scene.updateMatrixWorld(true);
    let bounds;
    stage.fly.group.traverseVisible(o=>{if(o.isMesh){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);if(bounds)bounds.union(b);else bounds=b;}});
    let faceEdge=0;
    for(const part of stage.fly.group.children)if(part.isMesh&&part!==stage.phone&&part.position.z>.9){part.geometry.computeBoundingBox();faceEdge=Math.max(faceEdge,part.position.x+part.geometry.boundingBox.max.x*part.scale.x);}
    const phoneClearance=stage.phone.position.x-.17-faceEdge;
    const callClearance=bounds.min.x-(-3.5+6.9/2);
    stage.render(30);
    const stools=stage.rooms.company.slice(0,2).map(f=>({position:f.group.position.toArray(),drink:f.lifeProps.glass.visible}));
    stage.render(42);
    const sleepers=[stage.fly,...stage.rooms.company.slice(0,2)].map(f=>({position:f.group.position.toArray(),visible:f.group.visible,roll:f.group.rotation.z,drink:f.lifeProps.glass.visible}));
    stage.render(18);stage.render(42);
    const replay=[stage.fly,...stage.rooms.company.slice(0,2)].map(f=>f.group.position.toArray());
    return {phoneClearance,callClearance,stools,sleepers,replay,duration:stage.duration};
  });
  expect(result.phoneClearance).toBeGreaterThan(.15);
  expect(result.callClearance).toBeGreaterThan(.2);
  expect(result.stools.map(p=>p.position[0])).toEqual([-4,4]);expect(result.stools.every(p=>p.drink&&p.position[1]>1.9)).toBe(true);
  expect(result.sleepers.every(p=>p.visible&&!p.drink)).toBe(true);
  expect(result.sleepers[0].roll).toBeCloseTo(Math.PI);
  expect(result.sleepers[1].roll).toBeLessThan(0);expect(result.sleepers[2].roll).toBeGreaterThan(0);
  expect(result.replay).toEqual(result.sleepers.map(p=>p.position));expect(result.duration).toBe(48);
  for(const [time,name] of [[18,'call'],[30,'stools'],[35,'home'],[42,'sleep']]){
    await page.evaluate(t=>window.workdayPreview.render(t),time);
    await page.locator('#workday-preview').screenshot({path:`test-results/workday-${name}-fixed.png`});
  }
  expect(errors).toEqual([]);
});
