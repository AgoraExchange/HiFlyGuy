export const COMEBACK_DURATION = 18;
export const COMEBACK_SHOTS = [
  { id:'comeback-lab', start:0, end:2 },
  { id:'profit', start:2, end:3.5 },
  { id:'comeback-elevator', start:3.5, end:6 },
  { id:'pair-one', start:6, end:7.4 },
  { id:'pair-two', start:7.4, end:8.8 },
  { id:'three-pairs', start:8.8, end:11 },
  { id:'comeback-strut', start:11, end:14 },
  { id:'feet-on-desk', start:14, end:18 },
];
export const smooth = x => { x=Math.max(0,Math.min(1,x));return x*x*(3-2*x); };
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);

// All poses depend on absolute take time, so replay and seeking are identical.
export function sampleComebackTake(time) {
  const t=Math.max(0,Math.min(COMEBACK_DURATION,Number.isFinite(time)?time:0));
  const shot=COMEBACK_SHOTS.find(s=>t<s.end)??COMEBACK_SHOTS.at(-1);
  const u=smooth((t-shot.start)/(shot.end-shot.start));
  const f={time:t,shot:shot.id,lab:t<3.5,profit:t>=2&&t<3.5,position:[-9,.97,-7.5],heading:0,
    camera:[-9,2.5,-1],target:[-9,.8,-7.5],fov:48,door:1,walk:0,desk:0,lean:0,
    caption:'',detail:''};
  if(f.lab){
    f.caption=f.profit?'TRADING PRIVILEGES RESTORED.':'THE LAST TIME WE SAW HIM...';
    f.detail=f.profit?'ONE GREEN TRADE LATER.':'SUBJECT 001 / PERFORMANCE REVIEW';
  }else if(shot.id==='comeback-elevator'){
    f.door=smooth((t-3.5)/1.1);f.walk=t>4.5?1:0;
    f.position=mix([-9,.97,-11.3],[-9,.97,-7.5],smooth((t-4.5)/1.5));
    f.camera=[-9,1.6,-2];f.target=[-9,1,-10+u*2.5];f.fov=48;
    f.caption='THE TREATMENT WORKED.';
  }else if(shot.id==='pair-one'){
    f.camera=mix([-6.9,.85,-4.55],[-7.2,.73,-4.85],u);f.target=[-8,.16,-6.42];f.fov=34;
    f.caption='ONE PAIR.';f.detail='A PERFECTLY REASONABLE PURCHASE.';
  }else if(shot.id==='pair-two'){
    f.camera=mix([-11.65,1.25,-5.45],[-11.4,1.1,-5.7],u);f.target=[-10,.17,-7.15];f.fov=37;
    f.caption='TWO PAIRS.';f.detail='HE HAS MORE FEET.';
  }else if(shot.id==='three-pairs'){
    f.camera=mix([-8.3,4.5,-3.0],[-8.8,5.7,-3.0],u);f.target=[-9,.35,-7.3];f.fov=46;
    f.caption='SIX FEET. THREE PAIRS.';f.detail='BEING A FLY IS EXPENSIVE.';
  }else if(shot.id==='comeback-strut'){
    f.position=[-9+u*5,.97,-5];f.heading=.7;f.walk=1;
    f.camera=[f.position[0]+3,1.6,1.5];f.target=[f.position[0],1,-5];f.fov=51;
    f.caption='ONE WIN. NEW PERSONALITY.';
  }else{
    f.position=[0,2.4,1.1];f.heading=Math.PI;f.desk=smooth((t-14)/1.5);f.lean=-.8;
    f.camera=mix([13.9,7.8,4.4],[13.0,7.1,3.5],u);f.target=[0,2.30,-.25];f.fov=53;
    if(t>=16.5){
      const close=smooth((t-16.5)/1.5);
      f.camera=mix([7.8,5.3,-1.8],[7.4,5.0,-1.5],close);f.target=[0,2.6,.2];f.fov=50;
    }
    f.caption='PROFIT WENT TO HIS FEET.';f.detail='SIX FEET. THREE PAIRS. ZERO HUMILITY.';
  }
  return f;
}
