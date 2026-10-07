import {test,expect} from './member-fixture.js';

for(const mobile of [false,true])test(`gift hotbar, personal notes, props and first-person catalog on ${mobile?'mobile':'desktop'}`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await page.evaluate(async()=>{const {Habitat}=await import('/src/scene.js');const original=Habitat.prototype.update;Habitat.prototype.update=function(sim,...args){window.giftWorld=sim;window.giftHabitat=this;return original.call(this,sim,...args);};});
 await page.locator('#pause-btn').click();
 await expect(page.locator('#world-hotbar .hotbar-slot:visible')).toHaveCount(4);
 await page.locator('[data-category="Cozy"]').click();await page.locator('.hotbar-slot[data-stimulus="note"]').click();
 await page.locator('#gift-note').fill('Hello <FlyGuy> & welcome');await page.locator('#place-center').click();
 await expect(page.locator('#object-count')).toHaveText('1 object');
 await page.locator('[data-inspect]').click();await expect(page.locator('#gift-note')).toHaveValue('Hello <FlyGuy> & welcome');
 await page.locator('#gift-note').fill('Your cozy corner');await page.locator('#catalog-done').click();
 expect(await page.evaluate(()=>window.giftWorld.objects[0].text)).toBe('Your cozy corner');
 await page.locator('[data-category="Play"]').click();await page.locator('.hotbar-slot[data-stimulus="radio"]').click();
 await page.locator('#gift-station').selectOption('Space disco');await page.locator('#place-center').click();
 expect(await page.evaluate(()=>window.giftWorld.objects.find(o=>o.kind==='radio').station)).toBe('Space disco');
 await page.locator('.interaction-section').screenshot({path:`test-results/hotbar-${mobile?'mobile':'desktop'}.png`});
 // Render every new mesh, including the mirror's offscreen reflection, in two batches.
 for(const kinds of [['water','sugar','mirror','radio','box','note','hoop','lamp'],['airplane','couch'],['mirror','mirror','mirror']]){
  await page.evaluate(kinds=>{const s=window.giftWorld;s.clear('habitat');kinds.forEach((k,i)=>s.add(k,(i%4-1.5)*4,Math.floor(i/4)*5-3,'habitat'));},kinds);
  await page.waitForTimeout(600);
  expect(await page.evaluate(()=>[...window.giftHabitat.objects.values()].filter(g=>g.visible).length)).toBe(kinds.length);
  await page.locator('#viewport').screenshot({path:`test-results/gifts-${kinds[0]}-${mobile?'mobile':'desktop'}.png`});
 }
 await page.locator('[data-environment="playground"]').click();await page.locator('#first-person-btn').click();await page.locator('#first-person-objects').click();
 await expect(page.locator('#object-catalog-dialog')).toBeVisible();await page.locator('[data-category="Cozy"]').click();await page.locator('.hotbar-slot[data-stimulus="couch"]').click();await page.locator('#catalog-done').click();
 await page.locator('#first-person-drop').click();expect(await page.evaluate(()=>window.giftWorld.objects.some(o=>o.kind==='couch'&&o.room==='playground'))).toBe(true);
 await expect(page.locator('#viewport')).toHaveAttribute('data-first-person','true');
 // Walk directly into a newly placed couch: dynamic furniture blocks the viewer.
 const blocked=await page.evaluate(()=>{const s=window.giftWorld,h=window.giftHabitat,fp=h.firstPerson;s.clear('playground');s.add('couch',0,0,'playground');h.camera.position.set(0,2.05,2.7);fp.previousEye=h.camera.position.clone();fp.yaw=0;fp.walking=true;fp.keys.add('KeyW');for(let i=0;i<90;i++){fp.update(1/60,s);fp.resolvePresence(s);}fp.keys.clear();return h.camera.position.z;});
 expect(blocked).toBeGreaterThanOrEqual(1.5);
 await page.locator('#exit-first-person').click();await expect(page.locator('.interaction-section #world-hotbar')).toBeAttached();
 if(!mobile){
  await page.locator('#fullscreen-btn').click();await page.locator('#inventory-catalog').click();
  await expect(page.locator('#viewport #object-catalog-dialog')).toBeVisible();
  await page.locator('[data-category="Care"]').click();await page.locator('.hotbar-slot[data-stimulus="water"]').click();await page.locator('#catalog-done').click();
  await page.locator('#place-center').click();expect(await page.evaluate(()=>window.giftWorld.objects.some(o=>o.kind==='water'&&o.room==='playground'))).toBe(true);
  await page.locator('#fullscreen-btn').click();
 }
 expect(errors).toEqual([]);
});
