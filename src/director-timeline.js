export const LEAD_IN = 2;
export const TAKE_DURATION = 22;
export const SHOTS = [
  { id: 'elevator', start: 0, end: 5 },
  { id: 'turn', start: 5, end: 7 },
  { id: 'apartment', start: 7, end: 11 },
  { id: 'desk', start: 11, end: 13 },
  { id: 'wallet', start: 13, end: 17 },
  { id: 'chair', start: 17, end: 22 },
];
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { x = clamp(x); return x*x*(3-2*x); };
const mix = (a,b,t) => a.map((v,i)=>v+(b[i]-v)*t);
// Pure, absolute-time choreography: no random movement, accumulated drift, or world mutations.
export function sampleTake(time) {
  const t = Math.max(0,Math.min(TAKE_DURATION,Number.isFinite(time) ? time : 0));
  const shot = SHOTS.find(s=>t<s.end) ?? SHOTS.at(-1), u = ease((t-shot.start)/(shot.end-shot.start));
  const frame = { shot:shot.id, time:t, position:[-9,.87,-11.3], heading:0, camera:[-9,2.8,1], target:[-9,2,-10], fov:48, speed:0, door:ease((t-.6)/1.8), lean:0, chairYaw:Math.PI, wallet:false, typing:false };
  if (shot.id==='elevator') {
    const walk=ease((t-1.8)/3.2); frame.position=mix([-9,.87,-11.3],[-9,.87,-4.5],walk);
    frame.camera=mix([-9,3.8,7],[-8.3,2.5,3.2],u); frame.target=mix([-9,3.3,-10.4],[-9,1.3,-4.5],u); frame.fov=55-7*u; frame.speed=t>1.8?1:0;
  } else if (shot.id==='turn') {
    frame.position=[-9,.87,-4.5]; frame.heading=.75*ease((t-5)/1.1);
    frame.camera=mix([-4.7,2.1,.3],[-5.6,1.7,-.6],u);frame.target=[-9,1.05,-4.5];frame.fov=39;
  } else if (shot.id==='apartment') {
    frame.position=mix([-9,.87,-4.5],[4.5,.87,-3.8],u);frame.heading=1.52;frame.speed=1;
    frame.camera=mix([25,20,33],[21,17,28],u);frame.target=[0,3,-4];frame.fov=59;
  } else if (shot.id==='desk') {
    frame.position=mix([4.5,.87,-3.8],[6,2.15,-3.8],u);frame.position[1]+=Math.sin(u*Math.PI)*.6;
    frame.heading=1.52+(Math.PI-1.52)*u;frame.speed=u<.9?1:0;
    frame.camera=mix([11,5.7,4],[9,5,2],u);frame.target=[6,3,-5];frame.fov=48;
  } else if (shot.id==='wallet') {
    frame.position=[6,2.15,-3.8];frame.heading=Math.PI;frame.typing=true;frame.wallet=true;
    frame.camera=[6,4.4,6];frame.target=[6,4.4,-6.4];frame.fov=48;
  } else {
    frame.position=[6,2.15,-3.8]; frame.chairYaw=Math.PI+(0.48-Math.PI)*ease((t-17)/1.8);frame.heading=frame.chairYaw;
    frame.lean=ease((t-18.2)/1.8);frame.position[1]+=.1*frame.lean;
    frame.camera=mix([11,4.5,4.5],[9.5,3.5,2.7],u);frame.target=[6,2,-3.8];frame.fov=43;
  }
  return frame;
}
