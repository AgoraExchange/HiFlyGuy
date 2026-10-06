import { test, expect } from './member-fixture.js';

async function enter(page) {
  await page.goto('/'); await page.locator('#pause-btn').click();
  await page.locator('[data-environment="playground"]').click();
  await page.evaluate(async()=>{const {FirstPerson}=await import('/src/first-person.js');const original=FirstPerson.prototype.enter;FirstPerson.prototype.enter=function(){original.call(this);window.parkView=this;};});
  await page.locator('#first-person-btn').click();
}
const position=page=>page.evaluate(()=>window.parkView.habitat.camera.position.toArray());
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));

test('desktop park supports simultaneous WASD and arrow looking; Space runs without pausing',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
  const start=await position(page);
  await page.keyboard.down('KeyW');await page.keyboard.down('ArrowRight');await page.keyboard.down('ArrowUp');await page.waitForTimeout(500);
  await page.keyboard.up('KeyW');await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowUp');
  const look=await page.evaluate(()=>({yaw:window.parkView.yaw,pitch:window.parkView.pitch}));expect(look.yaw).toBeLessThan(-.2);expect(look.pitch).toBeGreaterThan(.1);expect(distance(start,await position(page))).toBeGreaterThan(1);
  await page.locator('#first-person-home').click();const walkStart=await position(page);
  await page.keyboard.down('KeyD');await page.waitForTimeout(500);await page.keyboard.up('KeyD');const walked=distance(walkStart,await position(page));
  await page.locator('#first-person-home').click();const runStart=await position(page);
  await page.keyboard.down('Space');await page.keyboard.down('KeyD');await page.waitForTimeout(500);await page.keyboard.up('KeyD');await page.keyboard.up('Space');
  expect(distance(runStart,await position(page))).toBeGreaterThan(walked*1.5);await expect(page.locator('#run-label')).toHaveText('PAUSED');
  await page.locator('#first-person-train').click();await expect(page.locator('#training-dock')).toBeVisible();await expect(page.locator('#perch-select option')).toHaveCount(9);
  await page.locator('#perch-select').selectOption('3'); await expect(page.locator('#perch-select')).toHaveValue('3');
  await page.locator('#first-person-train').click();await page.screenshot({path:'test-results/park-first-person.png'});
  await page.locator('#exit-first-person').click();await page.locator('#training-toggle').click();
  await page.locator('#viewport').screenshot({path:'test-results/park-overview.png'});expect(errors).toEqual([]);
});

test.describe('two-thumb exploration',()=>{
  test.use({viewport:{width:390,height:844},hasTouch:true});
  test('left joystick keeps moving while the right finger looks; releasing cancels movement',async({page})=>{
    await enter(page);const joystick=page.locator('#movement-joystick');await expect(joystick).toBeVisible();
    const left=await joystick.boundingBox(),view=await page.locator('#viewport').boundingBox();
    const a={id:1,x:left.x+left.width/2,y:left.y+left.height/2},b={id:2,x:view.x+view.width*.72,y:view.y+view.height*.45};
    const session=await page.context().newCDPSession(page);
    const touch=(type,points)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:points});
    const start=await position(page),scroll=await page.evaluate(()=>scrollY);
    await touch('touchStart',[a]);a.y-=35;await touch('touchMove',[a]);await touch('touchStart',[a,b]);
    for(let i=0;i<6;i++){b.x+=7;b.y-=3;await touch('touchMove',[a,b]);await page.waitForTimeout(70);}
    const state=await page.evaluate(()=>({yaw:window.parkView.yaw,stick:window.parkView.stick.y}));
    expect(state.yaw).toBeLessThan(-.1);expect(state.stick).toBeLessThan(-.5);expect(distance(start,await position(page))).toBeGreaterThan(.7);
    await touch('touchEnd',[a]);expect(await page.evaluate(()=>window.parkView.stick.y)).toBe(0);
    await touch('touchEnd',[]);const stop=await position(page);await page.waitForTimeout(200);expect(distance(stop,await position(page))).toBeLessThan(.01);
    expect(await page.evaluate(()=>scrollY)).toBe(scroll);
    await page.locator('#touch-run').click();await expect(page.locator('#touch-run')).toHaveAttribute('aria-pressed','true');
    await page.locator('#viewport').screenshot({path:'test-results/park-mobile-joystick.png'});
  });
});

test('bar and store doors have flush panels and continuous jambs',async({page})=>{
  await enter(page);await page.locator('#exit-first-person').click();
  for(const room of ['bar','store']){
    await page.locator(`[data-environment="${room}"]`).click();
    const geometry=await page.evaluate(room=>{const h=window.parkView.habitat,g=h.lifeScenes.rooms.get(room),panel=g.getObjectByName('door-panel');const jambs=[];g.traverse(o=>{if(o.name==='door-jamb')jambs.push(o);});return {panelZ:panel.position.z,back:panel.position.z-.09,jambs:jambs.map(j=>({back:j.position.z-j.geometry.parameters.depth/2,front:j.position.z+j.geometry.parameters.depth/2,x:j.position.x}))};},room);
    expect(geometry.jambs).toHaveLength(2);for(const j of geometry.jambs){expect(j.front).toBeGreaterThan(geometry.panelZ);expect(j.back).toBeLessThan(geometry.panelZ);}
    await page.locator('#viewport').screenshot({path:`test-results/${room}-door-fixed.png`});
  }
});
