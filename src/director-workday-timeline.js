import { ROOMS } from './life.js';
export const WORKDAY_DURATION = 48;
export const WORKDAY_SHOTS = [
  { id:'wake', start:0,end:4,room:'habitat',caption:'YOU SAID GIVE HIM A 9-5.' },
  { id:'clock-in',start:4,end:8,room:'store',caption:'SO HE GOT A JOB.' },
  { id:'shift',start:8,end:16,room:'store',caption:'8 HOURS. BILLS. GROCERIES. REPEAT.' },
  { id:'call',start:16,end:20,room:'habitat',caption:'CLOCKED OUT. CALLED THE BUZZ.' },
  { id:'company',start:20,end:25,room:'habitat',caption:'THE CRIB IS NOT SO QUIET ANYMORE.' },
  { id:'bar',start:25,end:32,room:'bar',caption:'HE WORKS TO LIVE.' },
  { id:'home',start:32,end:42,room:'habitat',caption:'LAST ROUND. SAME WAY HOME.' },
  { id:'sleep',start:42,end:48,room:'habitat',caption:'HOME. TOGETHER. GOODNIGHT.' },
];
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const mix=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u);
const pose=(position,heading=0,state='Exploring',speed=0)=>({position,heading,state,speed});
function flyTo(from,to,u,arc=0){
 const position=mix(from,to,ease(u));position[1]+=Math.sin(Math.PI*clamp(u))*arc;
 return pose(position,Math.atan2(to[0]-from[0],to[2]-from[2]),'Exploring',u<1?1:0);
}
function homeward(seconds,x,y,delay=0){
 const elapsed=seconds-delay;
 let result;
 if(elapsed<1.5)result=flyTo([7,.87,-4],[2.5,.87,3.4],clamp(elapsed/1.5));
 else if(elapsed<2.8)result=flyTo([2.5,.87,3.4],[x,.87,3.4],(elapsed-1.5)/1.3);
 else result=flyTo([x,.87,3.4],[x,y,-3],clamp((elapsed-2.8)/1.2),2.2);
 if(elapsed>=4){result.heading=Math.PI;result.state='Sleeping';}
 result.visible=elapsed>=0;
 return result;
}
export function sampleWorkday(time) {
 const t=Math.max(0,Math.min(WORKDAY_DURATION,Number.isFinite(time)?time:0));
 const shot=WORKDAY_SHOTS.find(s=>t<s.end)??WORKDAY_SHOTS.at(-1);
 const u=clamp((t-shot.start)/(shot.end-shot.start));
 const frame={...shot,time:t,u,actor:pose([2.2,.87,1.8]),companions:[]};
 if(shot.id==='wake')frame.actor=pose([-3.5,1.72,-3],0,u<.65?'Sleeping':'Grooming');
 if(shot.id==='clock-in'){
   const target=[ROOMS.store.station[0],1.72,ROOMS.store.station[1]];
   frame.actor=flyTo([7,1.72,4],target,u/.85,3);
   if(u>=.85)frame.actor.heading*=1-ease((u-.85)/.15);
 }
 if(shot.id==='shift')frame.actor=pose([ROOMS.store.station[0],1.72,ROOMS.store.station[1]],0,'Working');
 if(shot.id==='company'){
   const first=flyTo([7,.87*.66,-4],[4.5,.87*.66,.2],clamp(u/.7));
   const v=clamp((u-.38)/.62);
   const second=v<.6?flyTo([7,.87*.66,-4],[8.4,.87*.66,3.8],v/.6):flyTo([8.4,.87*.66,3.8],[4.5,.87*.66,3.8],(v-.6)/.4);
   second.visible=u>=.38;
   if(!first.speed)first.heading=-Math.PI/2;if(!second.speed)second.heading=-Math.PI/2;
   frame.companions=[first,second];
 }
 if(shot.id==='bar'){
   const seat=(x,scale,delay)=>{
     const progress=clamp((t-25-delay)/1.7),a=flyTo([x,3,.7],[x,1.9+.87*scale,-3.4],progress,.5);
     a.heading=Math.PI;if(progress===1)a.state='Having a drink';return a;
   };
   frame.actor=seat(0,1,0);frame.companions=[seat(-4,.66,.25),seat(4,.66,.5)];
 }
 if(shot.id==='home'){
   frame.actor=homeward(t-32,-3.5,1.55);
   frame.companions=[homeward(t-32,-5.2,1.32,2),homeward(t-32,-1.8,1.32,4)];
 }
 if(shot.id==='sleep'){
   frame.actor=pose([-3.5,1.55,-3],Math.PI,'Sleeping');
   frame.companions=[-5.2,-1.8].map(x=>pose([x,1.32,-3],Math.PI,'Sleeping'));
 }
 return frame;
}
