// Lightweight authored agents for the background cast. Never mutate FlyGuy's world.
export const CROWD_SPACING = 2.25;
const STEP = 1 / 30;
const seats = [[-6,1],[-1,1],[4,1],[-6,5],[-1,5],[4,5]];
const shelves = [[-5,-.8],[2,-.8],[-5,4],[3,6]];
const line = [[-2,-1.8],[-2,.8],[-2,3.4],[.7,3.4],[3.4,3.4],[3.4,.8]];
const door = [7,4];
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);

export class AmbientLife {
  constructor(room) { this.room=room; this.reset(0); }
  reset(time) {
    this.time=time;this.seed=(this.room==='bar'?7823:1927)+Math.floor(time);
    this.queue=[];this.open=false;
    this.agents=Array.from({length:6},(_,id)=>({
      id,x:door[0],z:door[1],y:3.2,heading:Math.PI,speed:0,vx:0,vz:0,
      visible:false,goal:'Outside',state:'Exploring',target:[...door],until:time+id*5,
      pace:1.05+id*.075,seat:id,visits:0,yielding:false,
    }));
  }
  random() { this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296; }
  setGoal(a,goal,target,seconds=0) {
    a.goal=goal;a.target=[...target];a.until=this.time+seconds;
  }
  initialize(obstacles) {
    // A few residents are already living here when the observation camera opens.
    this.agents.forEach((a,i)=>{
      if(this.room!=='bar'||i>=5)return;
      const point=this.room==='bar'?seats[i]:shelves[i];
      if(obstacles.some(b=>Math.hypot(point[0]-b.x,point[1]-b.z)<(b.radius??1.5)+1.15))return;
      a.visible=true;[a.x,a.z]=point;a.visits++;
      a.y=this.room==='bar'?1.322:3.2;
      this.setGoal(a,this.room==='bar'?'Drinking':'Browsing',point,12+i*7);
    });
  }
  update(time,{open=true,obstacles=[]}={}) {
    if(time<this.time-STEP || time-this.time>120)this.reset(Math.floor(time/120)*120);
    if(!open) {
      this.agents.forEach(a=>{a.visible=false;a.goal='Outside';a.speed=0;a.vx=a.vz=0;a.until=time+a.id*5;});
      this.queue=[];this.open=false;this.time=time;return this.agents;
    }
    if(!this.open){this.open=true;this.initialize(obstacles);}
    // Fixed steps keep steering stable at different render rates and frozen on pause.
    while(this.time+STEP<=time+1e-8){this.time+=STEP;this.step(STEP,obstacles);}
    return this.agents;
  }
  step(dt,obstacles) {
    const active=this.agents.filter(a=>a.visible);
    for(const a of this.agents) {
      a.yielding=false;
      if(!a.visible) {
        if(this.time<a.until)continue;
        const entry={x:door[0],z:door[1]};
        // One fly through the doorway at a time; departures have priority.
        if(active.some(b=>distance(entry,b)<CROWD_SPACING+1)||obstacles.some(b=>distance(entry,b)<(b.radius??1.5)+1.3))continue;
        a.visible=true;a.x=door[0];a.z=door[1];a.y=3.2;a.visits++;active.push(a);
        this.setGoal(a,this.room==='bar'?'Finding a seat':'Shopping',this.room==='bar'?seats[a.seat]:shelves[(a.id+a.visits)%shelves.length]);
      }
      const near=Math.hypot(a.x-a.target[0],a.z-a.target[1])<.22;
      if(a.goal==='Shopping'&&near)this.setGoal(a,'Browsing',a.target,5+this.random()*9);
      else if(a.goal==='Browsing'&&this.time>=a.until){this.queue.push(a.id);this.setGoal(a,'Queuing',line[Math.min(5,this.queue.length-1)]);}
      else if(a.goal==='Queuing') {
        const index=this.queue.indexOf(a.id);a.target=[...line[Math.max(0,index)]];
        if(index===0&&Math.hypot(a.x-a.target[0],a.z-a.target[1])<.22)this.setGoal(a,'Paying',line[0],4+this.random()*4);
      } else if(a.goal==='Paying'&&this.time>=a.until){this.queue=this.queue.filter(id=>id!==a.id);this.setGoal(a,'Leaving',door);}
      else if(a.goal==='Finding a seat'&&near)this.setGoal(a,'Drinking',seats[a.seat],18+this.random()*24);
      else if(a.goal==='Drinking'&&this.time>=a.until)this.setGoal(a,'Grooming',a.target,3+this.random()*4);
      else if(a.goal==='Grooming'&&this.time>=a.until)this.setGoal(a,'Leaving',door);
      else if(a.goal==='Leaving'&&near){a.visible=false;a.speed=0;a.vx=a.vz=0;this.setGoal(a,'Outside',door,10+this.random()*24);continue;}
    }
    const visible=this.agents.filter(a=>a.visible);
    for(const a of visible) {
      const dx=a.target[0]-a.x,dz=a.target[1]-a.z,d=Math.hypot(dx,dz);
      const resting=['Drinking','Grooming','Browsing','Paying'].includes(a.goal)&&d<.22;
      let vx=d>.08?dx/d*Math.min(a.pace,d*2):0,vz=d>.08?dz/d*Math.min(a.pace,d*2):0;
      if(resting)vx=vz=0;
      for(const b of [...visible.filter(b=>b!==a),...obstacles]) {
        const bx=b.x-a.x,bz=b.z-a.z,dist=Math.hypot(bx,bz)||.001;
        const minimum=b.id===undefined?(b.radius??1.5)+1.15:CROWD_SPACING;
        if(dist>minimum+1.6)continue;
        const toward=(vx*bx+vz*bz)/dist;
        const ahead=d>.001?(dx*bx+dz*bz)/d:0;
        const side=d>.001?Math.abs(dx*bz-dz*bx)/d:Infinity;
        if(!resting&&toward>0&&ahead>0&&ahead<Math.min(d,3.8)&&side<minimum+.3) {
          const pressure=clamp((minimum+1.6-dist)/1.6,0,1);
          // Consistent right-hand passing prevents head-on reciprocal oscillation.
          vx+=bz/dist*pressure*a.pace;vz-=bx/dist*pressure*a.pace;
          vx-=bx/dist*toward*pressure*.85;vz-=bz/dist*toward*pressure*.85;
          a.yielding=true;
        }
        if(dist<minimum+.3&&!resting){const push=(minimum+.3-dist)*2;vx-=bx/dist*push;vz-=bz/dist*push;}
      }
      const speed=Math.hypot(vx,vz),cap=a.pace;
      if(speed>cap){vx*=cap/speed;vz*=cap/speed;}
      a.vx+=(vx-a.vx)*Math.min(1,dt*7);a.vz+=(vz-a.vz)*Math.min(1,dt*7);
    }
    const before=visible.map(a=>[a.x,a.z]);
    for(const a of visible){a.x+=a.vx*dt;a.z+=a.vz*dt;}
    // Small constraint corrections are the final guard against overlapping bodies.
    for(let pass=0;pass<12;pass++) {
      for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++) {
        const a=visible[i],b=visible[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
        if(d>=CROWD_SPACING)continue;
        const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0,push=CROWD_SPACING-d+.001;
        const anchored=p=>['Drinking','Grooming','Paying'].includes(p.goal);
        const share=anchored(a)&&!anchored(b)?0:anchored(b)&&!anchored(a)?1:.5;
        a.x-=nx*push*share;a.z-=nz*push*share;b.x+=nx*push*(1-share);b.z+=nz*push*(1-share);
      }
      for(const a of visible) {
        for(const b of obstacles){const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz),r=(b.radius??1.5)+1.15;if(d<r){a.x+=(d>.001?dx/d:1)*(r-d+.001);a.z+=(d>.001?dz/d:0)*(r-d+.001);}}
        a.x=clamp(a.x,-8.7,8.7);a.z=clamp(a.z,this.room==='store'?-2.5:-1.6,8);
      }
    }
    visible.forEach((a,i)=>{
      const dx=a.x-before[i][0],dz=a.z-before[i][1],speed=Math.hypot(dx,dz)/dt;
      a.speed=speed>.04?speed:0;
      if(a.speed){const heading=Math.atan2(dx,dz);a.heading+=Math.atan2(Math.sin(heading-a.heading),Math.cos(heading-a.heading))*Math.min(1,dt*8);}
      else a.heading+=Math.atan2(Math.sin(Math.PI-a.heading),Math.cos(Math.PI-a.heading))*Math.min(1,dt*2);
      const seated=this.room==='bar'&&['Drinking','Grooming'].includes(a.goal)&&Math.hypot(a.x-a.target[0],a.z-a.target[1])<.3;
      a.y+=( (seated?1.322:a.goal==='Paying'?.522:3.2+.1*Math.sin(this.time*1.7+a.id))-a.y)*Math.min(1,dt*4);
      a.state=seated?(a.goal==='Grooming'?'Grooming':'Having a drink'):a.goal==='Paying'?'Grooming':a.speed?'Exploring':'Grooming';
    });
  }
}
