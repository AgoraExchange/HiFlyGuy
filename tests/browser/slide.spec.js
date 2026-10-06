import { test, expect } from './member-fixture.js';
for (const index of [0, 1]) test(`slide ${index + 1}: climb original stairs, ride to ground, and block walking through chute`, async ({ page }) => {
  await page.goto('/'); await page.locator('#pause-btn').click(); await page.locator('[data-environment="playground"]').click();
  await page.evaluate(async()=>{const {FirstPerson}=await import('/src/first-person.js');const original=FirstPerson.prototype.enter;FirstPerson.prototype.enter=function(){original.call(this);window.parkView=this;};});
  await page.locator('#first-person-btn').click();
  const climb = await page.evaluate(index => {
    const fp=window.parkView,h=fp.habitat,s=h.playground.slides[index],st=s.stairs;
    h.camera.position.set(st.x,2.05,st.z-.3);fp.previousEye=h.camera.position.clone();fp.walking=true;fp.yaw=Math.PI;fp.pitch=0;fp.look();
    fp.keys.add('KeyW');const heights=[];
    for(let i=0;i<100;i++){fp.update(1/60,fp.sim);fp.previousEye=h.camera.position.clone();heights.push(h.camera.position.y);}
    fp.keys.clear();return {y:h.camera.position.y,z:h.camera.position.z,top:s.top,heights,stairs:h.playground.stairs.length};
  },index);
  expect(climb.stairs).toBe(2);expect(climb.y).toBeCloseTo(climb.top.y+2.05,2);
  expect(new Set(climb.heights.map(y=>y.toFixed(2))).size).toBeGreaterThanOrEqual(8);
  await expect(page.locator('#first-person-slide')).toBeVisible();
  await page.locator('#viewport').screenshot({path:`test-results/slide-${index}-deck.png`});
  await page.locator('#first-person-slide').click();
  await expect.poll(()=>page.evaluate(()=>!!window.parkView.sliding)).toBe(false);
  expect(await page.evaluate(()=>window.parkView.habitat.camera.position.y)).toBeCloseTo(2.05,2);
  const collision=await page.evaluate(index=>{
    const fp=window.parkView,h=fp.habitat,s=h.playground.slides[index],c=s.path.getPoint(.65),t=s.path.getTangent(.65);
    const length=Math.hypot(t.x,t.z),nx=-t.z/length,nz=t.x/length;
    h.camera.position.set(c.x+nx*2.5,2.05,c.z+nz*2.5);fp.previousEye=h.camera.position.clone();fp.walking=true;
    fp.yaw=Math.atan2(nx,nz);fp.keys.add('KeyW');
    for(let i=0;i<60;i++){fp.update(1/60,fp.sim);fp.previousEye=h.camera.position.clone();}
    fp.keys.clear();return {side:(h.camera.position.x-c.x)*nx+(h.camera.position.z-c.z)*nz,bottom:s.path.getPoint(1).y};
  },index);
  expect(collision.side).toBeGreaterThan(.8);expect(collision.bottom).toBeCloseTo(.08,3);
  const descent=await page.evaluate(index=>{
    const fp=window.parkView,h=fp.habitat,st=h.playground.slides[index].stairs;
    h.camera.position.set(st.x,st.topY+2.05,st.z+st.length+.1);fp.previousEye=h.camera.position.clone();fp.walking=true;fp.yaw=0;fp.keys.add('KeyW');
    for(let i=0;i<55;i++){fp.update(1/60,fp.sim);fp.previousEye=h.camera.position.clone();}
    fp.keys.clear();return h.camera.position.y;
  },index);
  expect(descent).toBeCloseTo(2.05,2);
  await page.locator('#exit-first-person').click();
  await page.evaluate(()=>{
    const h=window.parkView.habitat;h.controls.target.set(-14,1,-16);h.camera.position.set(-29,14,-29);h.controls.update();
  });
  await page.locator('#viewport').screenshot({path:`test-results/slide-${index}-stairs.png`});
});
