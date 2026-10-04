import {test,expect} from './member-fixture.js';
test('Rooftop door has a clear opening and the fly clears it before turning',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {WorkdayStage}=await import('/src/director-workday-stage.js');
  const {Simulation}=await import('/src/simulation.js');
  const T=await import('/node_modules/three/build/three.module.js');
  const host=document.createElement('div');host.id='door-preview';host.style.cssText='position:fixed;inset:0;z-index:10000;background:#101820';document.body.append(host);
  const stage=new WorkdayStage(host);stage.render(0);stage.rooms.setRoom('rooftop');
  const sim=new Simulation();sim.environment='rooftop';sim.x=-6;sim.z=4;sim.y=1.8;sim.life.doorway='enter';sim.life.autonomous=false;
  stage.rooms.update(sim);stage.fly.group.position.set(sim.x,sim.y,sim.z);stage.fly.group.rotation.set(0,0,0);
  stage.camera.position.set(4,10,17);stage.camera.lookAt(-5,2,2);
  stage.scene.updateMatrixWorld(true);
  const ray=new T.Raycaster(new T.Vector3(-6,1.8,5),new T.Vector3(0,0,-1),0,1.5);
  const hits=ray.intersectObjects(stage.rooms.rooms.get('rooftop').children,true).filter(h=>h.object.isMesh);
  stage.renderer.render(stage.scene,stage.camera);window.doorPreview=stage;
  for(let i=0;i<120 && sim.life.doorway==='enter';i++)sim.tick(1/60);
  return {hits:hits.length,x:sim.x,z:sim.z,doorway:sim.life.doorway};
 });
 expect(result.hits).toBe(0);expect(result.z).toBeGreaterThan(5.5);expect(result.doorway).toBeNull();
 await page.locator('#door-preview').screenshot({path:'test-results/rooftop-doorway.png'});
});


