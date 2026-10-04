import test from 'node:test';
import assert from 'node:assert/strict';
import {AmbientLife,CROWD_SPACING} from '../src/ambient-life.js';

for(const room of ['store','bar'])test(`${room}: individual visits finish, agents steer and remain separated`,()=>{
 const crowd=new AmbientLife(room),goals=new Set();let yielded=false;
 const obstacles=room==='store'?[{x:-2,z:-7.2,radius:1.65}]:[{x:0,z:-3.4,radius:1.65}];
 for(let t=0;t<600;t+=1/30){
  const agents=crowd.update(t,{obstacles}).filter(a=>a.visible);
  for(const a of agents){
   goals.add(a.goal);yielded ||= a.yielding;
   assert.ok(Number.isFinite(a.x+a.y+a.z+a.heading));assert.ok(Math.abs(a.x)<=8.71&&a.z<=8.01);
   assert.ok(a.speed<2,'No corrective teleport or endless high-speed drift');
   for(const b of obstacles)assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=b.radius+1.14);
  }
  for(let i=0;i<agents.length;i++)for(let j=i+1;j<agents.length;j++)assert.ok(Math.hypot(agents[i].x-agents[j].x,agents[i].z-agents[j].z)>=CROWD_SPACING-.015);
 }
 assert.ok(yielded);assert.ok(crowd.agents.every(a=>a.visits>=3),'Every agent completes repeat visits, without queue deadlock');
 for(const goal of room==='store'?['Shopping','Browsing','Queuing','Paying','Leaving']:['Finding a seat','Drinking','Grooming','Leaving'])assert.ok(goals.has(goal),goal);
});
test('Crowds freeze with simulation time, replay on seeking, and tolerate long saved-world times',()=>{
 const a=new AmbientLife('bar'),b=new AmbientLife('bar');
 for(let t=0;t<=30;t+=.25)a.update(t);
 b.update(30);assert.deepEqual(a.agents,b.agents);
 const snapshot=structuredClone(a.agents);a.update(30);assert.deepEqual(a.agents,snapshot);
 a.update(5);const c=new AmbientLife('bar');c.update(5);assert.deepEqual(a.agents,c.agents);
 a.update(100000);assert.ok(a.agents.every(a=>Number.isFinite(a.x+a.y+a.z)));
});
test('Closing the store clears its queue; reopening admits flies at the door without overlap',()=>{
 const crowd=new AmbientLife('store');crowd.update(30);assert.ok(crowd.agents.some(a=>a.visible));
 crowd.update(31,{open:false});assert.ok(crowd.agents.every(a=>!a.visible));assert.deepEqual(crowd.queue,[]);
 crowd.update(40,{open:false});crowd.update(40.1);
 const visible=crowd.agents.filter(a=>a.visible);assert.equal(visible.length,1);
 assert.ok(Math.hypot(visible[0].x-7,visible[0].z-4)<.2);
});

test('Patrons give the moving star room, including when the camera first opens',()=>{
 for(const room of ['bar','store']){
  const crowd=new AmbientLife(room);
  for(let t=0;t<120;t+=1/30){
   const star={x:Math.sin(t*.12)*5,z:3+Math.sin(t*.09)*2,radius:1.65};
   const agents=crowd.update(t,{obstacles:[star]}).filter(a=>a.visible);
   for(const a of agents)assert.ok(Math.hypot(a.x-star.x,a.z-star.z)>=2.79);
   for(let i=0;i<agents.length;i++)for(let j=i+1;j<agents.length;j++)assert.ok(Math.hypot(agents[i].x-agents[j].x,agents[i].z-agents[j].z)>=CROWD_SPACING-.015);
  }
 }
});
