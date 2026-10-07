export const RADIO_STATIONS = ['Late-night jazz', 'Space disco', 'Talk radio'];
export const NEW_ITEMS = {
  water: { name:'Water cap',category:'Care',scent:0,color:'#83cbd5',description:'A bottle-cap drink and a little face wash.',response:'Drinks & freshens up',state:'Drinking water',duration:12,icon:'water' },
  sugar: { name:'Sugar cube',category:'Care',scent:1.15,color:'#f0e6cc',description:'A sweet little mountain to climb and nibble.',response:'A special snack',icon:'sugar' },
  mirror: { name:'Tiny mirror',category:'Play',scent:0,color:'#accdd7',description:'One handsome fly. One deeply suspicious reflection.',response:'Inspects his reflection',state:'Admiring himself',duration:14,icon:'mirror',solid:[1.5,.35,2.2] },
  radio: { name:'Little radio',category:'Play',scent:0,color:'#c292bb',description:'Choose a station. He might dance, unwind, or complain.',response:'Music & a favorite station',state:'Listening to radio',duration:18,icon:'radio',solid:[1.6,.7,1] },
  box: { name:'Cardboard box',category:'Cozy',scent:0,color:'#c49e6a',description:'A hideout, a nap spot, a very exclusive laboratory.',response:'Claims a private hideout',state:'Hiding in his box',duration:18,icon:'box',solid:[3,3,2.2] },
  note: { name:'Little note',category:'Cozy',scent:0,color:'#edcf8d',description:'Leave him a few words. He may come back to read them.',response:'Remembers your message',state:'Reading your note',duration:14,icon:'note' },
  hoop: { name:'Mini hoop',category:'Play',scent:0,color:'#df956c',description:'Tiny shots, dramatic misses, and actual practice.',response:'Learns to shoot baskets',state:'Shooting hoops',duration:18,icon:'hoop',solid:[.35,.35,3.6] },
  lamp: { name:'Little lamp',category:'Cozy',scent:0,color:'#efc56f',description:'A warm pool of light to settle beside.',response:'A quiet place to unwind',state:'Warming by the lamp',duration:16,icon:'lamp',solid:[.65,.65,1.8] },
  airplane: { name:'Paper airplane',category:'Play',scent:0,color:'#b8cde1',description:'A looping paper flight for chasing and inspecting.',response:'Chases & lands on it',state:'Chasing a paper plane',duration:18,icon:'airplane' },
  couch: { name:'Tiny couch',category:'Cozy',scent:0,color:'#a6b58a',description:'Somewhere to lounge and recharge those little wings.',response:'Rests & recovers energy',state:'Lounging on the couch',duration:22,icon:'couch',solid:[3.6,2.4,1.5] },
};
export const ITEM_STATES = ['Investigating an object','Dancing','Inspecting a paper plane',...Object.values(NEW_ITEMS).map(i=>i.state).filter(Boolean)];
export const isFreeFruit = kind => kind==='banana'||kind==='tomato';
export const itemAction = kind => isFreeFruit(kind)?'food':'interact';
// Furniture faces the room's center, keeping its usable side away from the outer wall.
export const itemFacing=o=>['airplane','water','sugar'].includes(o.kind)||Math.hypot(o.x,o.z)<.01?0:Math.atan2(-o.x,-o.z);
export function itemCollider(o,ground){
  const size=NEW_ITEMS[o.kind]?.solid;if(!size)return null;
  const angle=itemFacing(o),c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle));
  const w=(size[0]*c+size[1]*s)/2,d=(size[0]*s+size[1]*c)/2;
  return {min:{x:o.x-w,y:ground,z:o.z-d},max:{x:o.x+w,y:ground+size[2],z:o.z+d}};
}
export function itemOptions(kind,options={}) {
  if(kind==='note')return {text:String(options.text??'Glad you are here, little guy.').trim().slice(0,120)||'Glad you are here, little guy.'};
  if(kind==='radio')return {station:RADIO_STATIONS.includes(options.station)?options.station:RADIO_STATIONS[0]};
  return {};
}
export function planePosition(object,time,landed=false){
  const radius=Math.max(0,Math.min(1.4,(object.room==='playground'?37:9.7)-Math.hypot(object.x,object.z)));
  return {x:object.x+(landed?0:Math.sin(time*1.3)*radius),z:object.z+(landed?0:Math.sin(time*.65)*radius),y:landed?.28:1.4+Math.sin(time*1.3)*.25};
}
export function newBelongings(){return {active:null,nextVisit:8,memories:[],basketSkill:0,stationPlays:[0,0,0]};}
export function rememberItem(sim,object,dt=0,newVisit=false){
  const b=sim.belongings;let m=b.memories.find(m=>m.id===object.id);
  if(!m){m={id:object.id,kind:object.kind,room:object.room,visits:0,seconds:0,lastVisit:sim.time,placedBy:'you'};b.memories.push(m);if(b.memories.length>64)b.memories.shift();}
  m.seconds+=dt;
  if(newVisit){m.visits++;m.lastVisit=sim.time;
    if(m.visits===1)sim.log(`Getting to know the ${NEW_ITEMS[object.kind]?.name.toLowerCase()??object.kind} you left for him.`,'memory');
    if(m.visits===3)sim.log(`That ${NEW_ITEMS[object.kind]?.name.toLowerCase()??object.kind} is becoming one of his familiar things.`,'memory');
  }
  return m;
}
export function objectMotion(sim,dt){
  const b=sim.belongings;
  let object=sim.objects.find(o=>o.id===b.active?.id&&o.room===sim.environment);
  if(b.active&&!object){b.active=null;b.nextVisit=sim.time+5;}
  if(!b.active){
    if(sim.time<b.nextVisit)return null;
    const candidates=sim.roomObjects().filter(o=>NEW_ITEMS[o.kind]?.state&&o.amount>.04);
    if(!candidates.length)return null;
    // New gifts catch his eye; familiar objects earn repeat visits without monopolizing him.
    object=candidates.map(o=>({o,score:sim.random()*2+(o.kind==='couch'?(1-sim.energy)*2:0)+1/(1+(b.memories.find(m=>m.id===o.id)?.visits??0))})).sort((a,c)=>c.score-a.score)[0].o;
    b.active={id:object.id,elapsed:0,phase:'approach',shots:0,made:false};
  }
  const a=b.active,def=NEW_ITEMS[object.kind],ground=sim.groundHeight(object.x,object.z,object.room);
  const angle=itemFacing(object),offset=object.kind==='hoop'?2.5:['mirror','radio','note'].includes(object.kind)?1.8:object.kind==='lamp'?1.25:0;
  let x=object.x+Math.sin(angle)*offset,z=object.z+Math.cos(angle)*offset,height=ground+.87;
  if(object.kind==='couch')height+=.76;
  if(object.kind==='airplane'){
    const p=planePosition(object,sim.time,a.elapsed>=def.duration-5);x=p.x;z=p.z;height=ground+p.y+.87;
  }
  const dx=x-sim.x,dz=z-sim.z,distance=Math.hypot(dx,dz);
  if(a.phase==='using'&&object.kind!=='airplane'&&distance>.8)a.phase='approach';
  if(a.phase==='approach'){
    if(distance>.45||Math.abs(sim.y-height)>.25)return {state:'Investigating an object',dx,dz,velocity:distance>.45?1.8:0,y:height};
    a.phase='using';if(a.elapsed===0){if(object.kind==='hoop')a.made=sim.random()<.15+b.basketSkill*.8;rememberItem(sim,object,0,true);}
  }
  a.elapsed+=dt;rememberItem(sim,object,dt);
  let state=def.state,velocity=0;
  const facing=angle+(['couch','box'].includes(object.kind)?0:Math.PI);
  sim.heading+=Math.atan2(Math.sin(facing-sim.heading),Math.cos(facing-sim.heading))*Math.min(1,dt*3);
  if(object.kind==='water'){object.amount=Math.max(.04,object.amount-dt*.012);sim.life.stress=Math.max(0,sim.life.stress-dt*.012);sim.energy=Math.min(1,sim.energy+dt*.006);}
  if(['box','couch','lamp'].includes(object.kind)){sim.energy=Math.min(1,sim.energy+dt*(object.kind==='couch'?.018:.007));sim.life.stress=Math.max(0,sim.life.stress-dt*.009);}
  if(object.kind==='note')sim.training.bond=Math.min(1,sim.training.bond+dt*.0005);
  if(object.kind==='radio'){
    const station=RADIO_STATIONS.indexOf(object.station);b.stationPlays[station]+=dt;
    if(station===1){state='Dancing';sim.life.mood=Math.min(1,sim.life.mood+dt*.007);}
    else if(station===0)sim.life.stress=Math.max(0,sim.life.stress-dt*.01);
    else sim.life.stress=Math.min(1,sim.life.stress+dt*.001);
  }
  if(object.kind==='hoop'&&Math.floor(a.elapsed/3)>a.shots){
    a.shots++;const made=a.made;a.made=sim.random()<.15+b.basketSkill*.8;b.basketSkill=Math.min(1,b.basketSkill+.025);
    sim.log(made?'A tiny basket! Practice is starting to show.':'Off the rim. He lines up another shot.');
  }
  if(object.kind==='airplane'){velocity=distance>.25?2.8:0;if(a.elapsed>=def.duration-5)state='Inspecting a paper plane';}
  if(a.elapsed>=def.duration){b.active=null;b.nextVisit=sim.time+12+sim.random()*12;}
  return {state,dx,dz,velocity,y:height};
}

export function decodeBelongings(value,objects,time){
  if(value===undefined)return newBelongings();
  const b=value,nonnegative=n=>Number.isFinite(n)&&n>=0&&n<=1e10;
  if(!b||!nonnegative(b.nextVisit)||!Number.isFinite(b.basketSkill)||b.basketSkill<0||b.basketSkill>1||!Array.isArray(b.stationPlays)||b.stationPlays.length!==3||!b.stationPlays.every(nonnegative))return null;
  if(!Array.isArray(b.memories)||b.memories.length>64||!b.memories.every(m=>Number.isSafeInteger(m.id)&&m.id>0&&NEW_ITEMS[m.kind]&&['habitat','fireescape','computer','bar','rooftop','store','playground'].includes(m.room)&&Number.isSafeInteger(m.visits)&&m.visits>=0&&nonnegative(m.seconds)&&nonnegative(m.lastVisit)&&m.lastVisit<=time&&m.placedBy==='you'))return null;
  if(new Set(b.memories.map(m=>m.id)).size!==b.memories.length)return null;
  if(b.active!==null){const a=b.active,o=objects.find(o=>o.id===a?.id);if(!o||!NEW_ITEMS[o.kind]?.state||!['approach','using'].includes(a.phase)||!nonnegative(a.elapsed)||a.elapsed>60||!Number.isSafeInteger(a.shots)||a.shots<0||a.shots>20||typeof a.made!=='boolean')return null;}
  return structuredClone(b);
}
