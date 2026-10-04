import { invite, lifeMotion, ROOMS } from '../src/life.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';
import { callBuzz, workPerk, updateSocial, shiftClock } from '../src/social-life.js';
import { encodeSession, decodeSession } from '../src/session.js';
import { sampleWorkday, WORKDAY_SHOTS } from '../src/director-workday-timeline.js';
const advance=(sim,n)=>{for(let i=0;i<n*30;i++)sim.tick(1/30);};
test('Buzz visits last 5-17 minutes, start with one friend and survive reload',()=>{
 const sim=new Simulation();sim.life.autonomous=false;
 assert.equal(callBuzz(sim),true);assert.equal(sim.life.social.visitors,1);
 assert.ok(sim.life.social.leaveAt>=300&&sim.life.social.leaveAt<=1020);
 assert.equal(callBuzz(sim),false);advance(sim,30);
 const restored=decodeSession(encodeSession(sim));assert.ok(restored);
 advance(sim,10);advance(restored.sim,10);assert.deepEqual(restored.sim.life,sim.life);
 sim.time=sim.life.social.leaveAt;updateSocial(sim,0);assert.equal(sim.life.social.visitors,0);
 assert.equal(callBuzz(sim),false);sim.time+=180;sim.life.social.together=10000;
 assert.equal(callBuzz(sim),true);assert.ok(sim.life.social.visitors>=1&&sim.life.social.visitors<=sim.life.social.circleSize);
});
test('A full shift accrues wages once, pays bills, buys food and clocks out',()=>{
 const sim=new Simulation();sim.environment='store';sim.x=-2;sim.z=-7.2;sim.life.social.nextShift=0;
 advance(sim,1);assert.equal(sim.life.social.onClock,true);assert.equal(sim.state,'Working');
 const saved=decodeSession(encodeSession(sim));assert.ok(saved);
 advance(sim,125);advance(saved.sim,125);
 assert.equal(sim.life.social.shifts,1);assert.equal(sim.life.social.onClock,false);
 assert.ok(Math.abs(sim.life.social.cash-32)<.001);assert.equal(sim.life.social.groceries,6);
 assert.deepEqual(saved.sim.life,sim.life);
});
test('Work perks are contextual, smoke pauses earning, early leave pays remainder exactly once',()=>{
 const sim=new Simulation();assert.equal(workPerk(sim,'early'),false);
 sim.environment='store';sim.x=-2;sim.z=-7.2;sim.life.social.nextShift=0;advance(sim,5);
 assert.equal(workPerk(sim,'smoke'),true);const earned=sim.life.social.earned;advance(sim,8);assert.equal(sim.life.social.earned,earned);
 assert.equal(workPerk(sim,'early'),true);assert.ok(Math.abs(sim.life.social.cash-32)<.001);
 assert.equal(workPerk(sim,'early'),false);
});
test('Overtime caps at two extra hours and saves migrate or reject malformed social state',()=>{
 const sim=new Simulation();sim.environment='store';sim.life.social.onClock=true;
 assert.equal(workPerk(sim,'overtime'),true);assert.equal(workPerk(sim,'overtime'),false);
 sim.life.social.worked=150;assert.equal(shiftClock(sim.life.social),'7:00 PM');
 const raw=JSON.parse(encodeSession(sim));delete raw.world.life.social;assert.ok(decodeSession(JSON.stringify(raw)));
 raw.world.life.social={visitors:6};assert.equal(decodeSession(JSON.stringify(raw)),null);
});
test('Director workday is deterministic and contains every narrative beat',()=>{
 for(const shot of WORKDAY_SHOTS){const t=(shot.start+shot.end)/2;assert.equal(sampleWorkday(t).id,shot.id);assert.deepEqual(sampleWorkday(t),sampleWorkday(t));}
 assert.equal(sampleWorkday(Infinity).id,'wake');assert.equal(sampleWorkday(500).id,'sleep');
});


test('Shift clock uses AM/PM including noon and overtime',()=>{
 const s={worked:0,overtime:false};assert.equal(shiftClock(s),'9:00 AM');
 s.worked=45;assert.equal(shiftClock(s),'12:00 PM');
 s.worked=120;assert.equal(shiftClock(s),'5:00 PM');
 s.overtime=true;s.worked=150;assert.equal(shiftClock(s),'7:00 PM');
});

test('The Buzz says goodbye at the first work-bound doorway and stays gone until recalled',()=>{
 const sim=new Simulation();assert.equal(callBuzz(sim),true);
 sim.life.social.together=600;invite(sim,'store');
 assert.equal(sim.life.social.visitors,1);assert.equal(callBuzz(sim),false);
 [sim.x,sim.z]=ROOMS.habitat.exit;sim.life.doorway='leave';lifeMotion(sim,0);
 assert.equal(sim.life.social.visitors,1);
 sim.time=sim.life.crossingUntil;lifeMotion(sim,0);
 assert.equal(sim.environment,'store');assert.equal(sim.life.social.visitors,0);
 assert.equal(sim.life.social.together,600);assert.equal(callBuzz(sim),false);
 const restored=decodeSession(encodeSession(sim)).sim;
 advance(restored,500);assert.equal(restored.life.social.visitors,0);assert.equal(restored.life.social.visits,1);
 restored.environment='habitat';restored.life.route=[];restored.life.destination=null;restored.life.social.onClock=false;
 assert.equal(callBuzz(restored),true);assert.ok(restored.life.social.visitors>=1&&restored.life.social.visitors<=2);
});
test('Expired visits do not return by themselves and old work saves lose their visitors',()=>{
 const sim=new Simulation();callBuzz(sim);sim.life.social.shifts=1;
 sim.time=sim.life.social.leaveAt;updateSocial(sim,0);sim.time+=1000;
 const savedRandom=sim.random;sim.random=()=>0;updateSocial(sim,1);sim.random=savedRandom;
 assert.equal(sim.life.social.visitors,0);
 const old=new Simulation();callBuzz(old);old.environment='store';old.life.social.onClock=true;
 const restored=decodeSession(encodeSession(old)).sim;updateSocial(restored,0);
 assert.equal(restored.life.social.visitors,0);assert.equal(callBuzz(restored),false);
});
test('The Buzz can still accompany a social outing to the bar',()=>{
 const sim=new Simulation();callBuzz(sim);invite(sim,'bar');
 [sim.x,sim.z]=ROOMS.habitat.exit;sim.life.doorway='leave';lifeMotion(sim,0);sim.time=sim.life.crossingUntil;lifeMotion(sim,0);
 assert.equal(sim.environment,'computer');assert.equal(sim.life.social.visitors,1);
});

test('Workday entrance faces its travel and bar companions land on adjacent stools before sleeping at home',()=>{
 for(let t=4.1;t<7.3;t+=.1){
  const a=sampleWorkday(t).actor,b=sampleWorkday(t+.01).actor;
  const dx=b.position[0]-a.position[0],dz=b.position[2]-a.position[2];
  assert.ok(dx*Math.sin(a.heading)+dz*Math.cos(a.heading)>0);
 }
 const bar=sampleWorkday(30);
 assert.deepEqual(bar.companions.map(p=>p.position[0]),[-4,4]);
 assert.ok(bar.companions.every(p=>p.state==='Having a drink'&&p.speed===0&&p.position[1]>1.9));
 const home=sampleWorkday(36);assert.equal(home.room,'habitat');assert.equal(home.companions.length,2);
 const end=sampleWorkday(48);assert.equal(end.actor.state,'Sleeping');assert.ok(end.companions.every(p=>p.state==='Sleeping'));
 assert.deepEqual([end.actor,...end.companions].map(p=>p.position),[sampleWorkday(42).actor,...sampleWorkday(42).companions].map(p=>p.position));
});

test('Buzz circle grows after 1-3 successful calls, never from repeated blocked calls, and caps at five',()=>{
 const sim=new Simulation();sim.random=()=>0;
 for(let circle=1;circle<=5;circle++){
  assert.equal(callBuzz(sim),true);assert.equal(sim.life.social.circleSize,circle);assert.equal(sim.life.social.visitors,circle);
  const before=structuredClone(sim.life.social);assert.equal(callBuzz(sim),false);assert.deepEqual(sim.life.social,before);
  sim.time=sim.life.social.leaveAt;updateSocial(sim,0);sim.time=sim.life.social.nextVisit;
 }
 assert.equal(callBuzz(sim),true);assert.equal(sim.life.social.circleSize,5);assert.equal(sim.life.social.visitors,5);
 sim.time=sim.life.social.leaveAt;updateSocial(sim,0);sim.time=sim.life.social.nextVisit;sim.random=()=>.999;
 assert.equal(callBuzz(sim),true);assert.equal(sim.life.social.circleSize,5);assert.equal(sim.life.social.visitors,1);
});
test('Three-call milestones and variable attendance survive reload without losing an existing circle',()=>{
 const sim=new Simulation();sim.random=()=>.999;
 for(let call=1;call<=4;call++){
  assert.equal(callBuzz(sim),true);assert.equal(sim.life.social.circleSize,call<4?1:2);assert.equal(sim.life.social.visitors,1);
  sim.time=sim.life.social.leaveAt;updateSocial(sim,0);sim.time=sim.life.social.nextVisit;
 }
 const saved=decodeSession(encodeSession(new Simulation()));assert.equal(saved.sim.life.social.circleSize,1);
 const original=new Simulation();callBuzz(original);
 const restored=decodeSession(encodeSession(original));assert.deepEqual(restored.sim.life.social,original.life.social);
 const legacy=JSON.parse(encodeSession(original));delete legacy.world.life.social.circleSize;delete legacy.world.life.social.nextFriendCall;
 legacy.world.life.social.visitors=4;legacy.world.life.social.visits=3;
 const migrated=decodeSession(JSON.stringify(legacy));assert.equal(migrated.sim.life.social.circleSize,4);assert.equal(migrated.sim.life.social.visitors,4);
 for(const field of ['circleSize','nextFriendCall']){const bad=JSON.parse(encodeSession(original));bad.world.life.social[field]=1.5;assert.equal(decodeSession(JSON.stringify(bad)),null);}
});

test('Buzz arrival and bedroom paths keep bodies separated throughout the edit',()=>{
 for(const [start,end,clearance] of [[20,25,2.5],[32,42,1.65]]){
  for(let t=start;t<end;t+=1/60){
   const f=sampleWorkday(t),cast=[f.actor,...f.companions].filter(p=>p.visible!==false);
   for(let i=0;i<cast.length;i++)for(let j=i+1;j<cast.length;j++){
    assert.ok(Math.hypot(...cast[i].position.map((v,k)=>v-cast[j].position[k]))>clearance,'Cast intersects at '+t);
   }
  }
 }
});
