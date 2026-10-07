import {test,expect} from '@playwright/test';
import {mockMembership} from './member-mock.js';
const rooms=['habitat','fireescape','computer','bar','rooftop','store','playground'];
const member={user:{uid:'test-member'},profile:{username:'test_member'},creator:false,verified:true,entitlement:{tier:'flyest',expiresAt:Date.now()+3600000}};
async function enter(page,state=member){
 await mockMembership(page,state);await page.goto('/');await expect(page.locator('#world-splash')).toBeHidden({timeout:15000});
 if(!state.user)await page.locator('#guest-enter').click();
 await page.evaluate(async()=>{const {FirstPerson}=await import('/src/first-person.js'),original=FirstPerson.prototype.enter;FirstPerson.prototype.enter=function(){original.call(this);window.joinView=this;};});
}
for(const mobile of [false,true])test(`members can explore every room and restore the camera on ${mobile?'mobile':'desktop'}`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);await page.locator('#pause-btn').click();
 for(const room of rooms){
  await page.locator(`button[data-environment="${room}"]`).click();await page.locator('#first-person-btn').click();
  await expect(page.locator('#viewport')).toHaveAttribute('data-first-person','true');
  if(mobile)await expect(page.locator('#movement-joystick')).toBeVisible();
  const start=await page.evaluate(()=>window.joinView.habitat.camera.position.toArray());
  await page.keyboard.down('KeyD');await page.waitForTimeout(200);await page.keyboard.up('KeyD');
  const end=await page.evaluate(()=>window.joinView.habitat.camera.position.toArray());
  expect(Math.hypot(end[0]-start[0],end[2]-start[2])).toBeGreaterThan(.2);
  await page.locator('#viewport').screenshot({path:`test-results/join-${room}-${mobile?'mobile':'desktop'}.png`});
  await page.locator('#exit-first-person').click();await expect(page.locator('#viewport')).toHaveAttribute('data-first-person','false');
 }
 expect(errors).toEqual([]);
});
for(const guest of [true,false])test(`${guest?'visitors':'free accounts'} see locked rooms and membership plans, while playground entry stays free`,async({page})=>{
 await enter(page,guest?{user:null,profile:null,creator:false,entitlement:null}:{...member,entitlement:null});
 for(const room of rooms.filter(r=>r!=='playground')){
  await page.locator(`button[data-environment="${room}"]`).click();await expect(page.locator('#first-person-btn')).toHaveClass(/access-locked/);
  await page.locator('#first-person-btn').click();await expect(page.locator('#upgrade-dialog')).toBeVisible();
  await expect(page.locator('#viewport')).not.toHaveAttribute('data-first-person','true');
  await page.locator('#upgrade-dialog [data-member-close]').click();
 }
 await page.locator('[data-environment="playground"]').click();await page.locator('#first-person-btn').click();
 await expect(page.locator('#viewport')).toHaveAttribute('data-first-person','true');
});
test('membership expiry exits paid rooms; room geometry blocks counters and beds',async({page})=>{
 await enter(page);await page.locator('#pause-btn').click();
 for(const [room,x,z,minZ] of [['habitat',-3.5,2,.5],['bar',0,-3,-4.6],['store',0,-2,-3],['computer',0,-8,-10.1],['fireescape',0,-6,-7.31],['rooftop',-6,5.5,2.8]]){
  await page.locator(`button[data-environment="${room}"]`).click();await page.locator('#first-person-btn').click();
  const end=await page.evaluate(({x,z})=>{
   const fp=window.joinView,h=fp.habitat;h.camera.position.set(x,2.05,z);fp.previousEye=h.camera.position.clone();fp.yaw=0;fp.walking=true;fp.keys.add('KeyW');
   for(let i=0;i<120;i++){fp.update(1/60,fp.sim);fp.previousEye=h.camera.position.clone();}fp.keys.clear();return h.camera.position.z;
  },{x,z});expect(end).toBeGreaterThan(minZ);
  await page.locator('#exit-first-person').click();
 }
 await page.locator('#first-person-btn').click();await page.evaluate(()=>window.testMembership.set({entitlement:{tier:'flyest',expiresAt:Date.now()-1}}));
 await expect(page.locator('#viewport')).toHaveAttribute('data-first-person','false');await expect(page.locator('#first-person-btn')).toHaveClass(/access-locked/);
});

test('FlyGuy says opens a mobile transcript modal and closes without leaving first person',async({page})=>{
 await page.setViewportSize({width:390,height:844});await enter(page);
 await page.locator('#first-person-btn').click();
 await page.locator('#transcript-tab').click();await expect(page.locator('#dialogue-dialog')).toBeVisible();
 await expect(page.locator('.playback + .dialogue-panel')).toHaveCount(0);
 expect(await page.locator('#dialogue-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:'test-results/transcript-mobile.png'});
 await page.keyboard.press('Escape');await expect(page.locator('#dialogue-dialog')).toBeHidden();
 await expect(page.locator('#viewport')).toHaveAttribute('data-first-person','true');
 await page.locator('#transcript-tab').click();await page.locator('#close-transcript').click();await expect(page.locator('#transcript-tab')).toBeFocused();
});
