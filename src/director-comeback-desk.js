import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const DESK_TOP=2.513;
export const DESK_BOUNDS={minX:-3.1,maxX:3.1,minZ:-3.7,maxZ:0};
export const MONITOR_POSITION=[0,3.9,-3.15];
export const CHAIR_POSITION=[0,0,1.65];

// A separate, correctly spaced set: chair -> clear desk edge -> keyboard -> monitor.
export function createComebackDesk(materials){
  const scene=new T.Scene();scene.background=new T.Color('#091017');scene.fog=new T.Fog('#091017',22,65);
  const mat=(color,metalness=0,roughness=.6)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});materials.add(m);return m;};
  const walnut=mat('#35251b',.08,.48),leather=mat('#181d20',.08,.74),cushion=mat('#252a2c',.04,.88);
  const bronze=mat('#a7844d',.72,.32),black=mat('#080e13',.25,.42),floor=mat('#192026',.15,.48);
  const glow=color=>{const m=new T.MeshBasicMaterial({color});materials.add(m);return m;};
  const mesh=(geo,material,pos,parent=scene)=>{const m=new T.Mesh(geo,material);m.position.set(...pos);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
  const box=(size,pos,material=walnut,parent=scene,radius=.04)=>mesh(new RoundedBoxGeometry(...size,3,radius),material,pos,parent);
  const tube=(points,radius,material=bronze,parent=scene)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,radius,8,false),material,[0,0,0],parent);
  box([30,.2,32],[0,-.15,-3],floor);
  for(let i=-12;i<=12;i+=2)box([.012,.008,30],[i,-.044,-3],black);
  box([9,.025,8],[0,-.024,.3],mat('#293336',.02,.98));
  // Walnut slab, thin brass reveal, legs kept clear of the chair.
  const desk=new T.Group();scene.add(desk);
  box([6.2,.20,3.7],[0,2.4,-1.85],walnut,desk,.075);
  box([6.02,.035,3.55],[0,2.278,-1.85],bronze,desk,.012);
  for(const x of [-2.65,2.65]){
    box([.15,2.25,3.0],[x,1.13,-1.85],black,desk);
    box([.05,2.15,.055],[x,1.13,-.39],bronze,desk,.012);
  }
  // The six shoes land on the near edge. The keyboard is farther back, to the side.
  box([5.5,.012,3.1],[0,2.507,-1.8],mat('#1f292a',.02,.92),desk,.06);
  const keyboard=new T.Group();keyboard.position.set(1.25,2.54,-2.15);desk.add(keyboard);
  box([2.1,.085,.7],[0,0,0],black,keyboard);
  for(let row=0;row<4;row++)for(let col=0;col<13;col++)box([.128,.025,.11],[-.91+col*.15,.055,-.245+row*.15],cushion,keyboard,.015);
  box([.65,.02,.08],[0,.062,.25],bronze,keyboard,.01);
  const mouse=mesh(new T.SphereGeometry(1,20,12),black,[2.58,2.6,-2.08]);mouse.scale.set(.16,.08,.23);

  // Monitor rests on its own stand at the FAR edge, facing the seated fly (+Z).
  const monitor=new T.Group();monitor.position.set(...MONITOR_POSITION);scene.add(monitor);
  box([4.8,2.4,.16],[0,0,0],black,monitor,.09);
  box([.13,.32,.13],[0,-1.26,-.04],bronze,monitor);
  box([1.15,.055,.65],[0,2.54,-3.15],black);
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=600;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#0b161b';ctx.fillRect(0,0,1200,600);
  ctx.fillStyle='#94a9ab';ctx.font='19px monospace';ctx.fillText('ASTER  /  PRIVATE TERMINAL',55,52);
  ctx.fillStyle='#25383d';ctx.fillRect(55,78,1090,2);
  ctx.fillStyle='#87a197';ctx.font='17px monospace';ctx.fillText('REALIZED PROFIT',55,135);
  ctx.fillStyle='#b2e2b1';ctx.font='68px monospace';ctx.fillText('+$4,800.00',55,220);
  ctx.fillStyle='#7fbda0';ctx.font='18px monospace';ctx.fillText('POSITION CLOSED    /    +12.00%',60,265);
  ctx.strokeStyle='#23373b';ctx.lineWidth=1;
  for(let y=325;y<540;y+=45){ctx.beginPath();ctx.moveTo(55,y);ctx.lineTo(1145,y);ctx.stroke();}
  ctx.beginPath();ctx.strokeStyle='#86cba9';ctx.lineWidth=3;
  [[55,520],[140,495],[220,505],[300,450],[385,465],[470,425],[560,440],[650,375],[745,390],[845,320],[945,340],[1050,280],[1145,292]].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  ctx.fillStyle='#6f858c';ctx.font='15px monospace';ctx.fillText('ACCOUNT 001',55,575);ctx.fillText('ALL SYSTEMS ONLINE',950,575);
  const screenMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),toneMapped:false});materials.add(screenMat);
  mesh(new T.PlaneGeometry(4.55,2.275),screenMat,[0,0,.087],monitor);
  const led=mesh(new T.SphereGeometry(.018,8,6),glow('#91d2ad'),[2.17,-1.1,.092],monitor);

  // Low seat supports the abdomen. The back is behind the wings, well away from the monitor.
  const chair=new T.Group();chair.position.set(...CHAIR_POSITION);scene.add(chair);
  mesh(new T.CylinderGeometry(.09,.12,1.0,20),bronze,[0,.65,0],chair);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    tube([[0,.22,0],[Math.sin(a)*.6,.18,Math.cos(a)*.6],[Math.sin(a)*1.1,.15,Math.cos(a)*1.1]],.06,black,chair);
    const wheel=mesh(new T.CylinderGeometry(.12,.12,.13,12),black,[Math.sin(a)*1.05,.12,Math.cos(a)*1.05],chair);wheel.rotation.z=Math.PI/2;
  }
  box([2.25,.27,2.50],[0,1.15,0],leather,chair,.13);
  box([2.10,.16,2.35],[0,1.285,-.02],cushion,chair,.075);
  const back=box([2.22,2.65,.24],[0,2.40,1.40],leather,chair,.12);back.rotation.x=.10;
  for(let i=0;i<5;i++)box([1.97,.40,.075],[0,1.42+i*.46,1.225+(i-2)*.045],cushion,chair,.035);
  box([1.45,.40,.31],[0,3.66,1.48],leather,chair,.14);
  for(const side of [-1,1]){
    tube([[side*1.03,1.15,.7],[side*1.12,1.9,.65],[side*1.12,1.9,-.55]],.045,bronze,chair);
    box([.25,.14,1.45],[side*1.12,1.94,.05],leather,chair,.065);
  }
  // Desk lamp, a notebook, and a glass keep scale and desk depth legible.
  box([.48,.06,.48],[-2.55,2.56,-2.9],bronze);
  tube([[-2.55,2.59,-2.9],[-2.55,3.9,-2.9],[-2.05,4.25,-2.9]],.032,bronze);
  box([.65,.08,.3],[-2.02,4.23,-2.9],black);
  box([.55,.015,.23],[-2.02,4.18,-2.9],glow('#ffe4b0'));
  box([.68,.075,.88],[-2.35,2.57,-1.9],leather);
  box([.58,.01,.79],[-2.35,2.615,-1.9],mat('#a2916c'));
  tube([[-2.1,2.64,-2.15],[-2.1,2.64,-1.65]],.018,bronze);
  // Window grid and subdued night skyline.
  for(const x of [-9,-6,-3,0,3,6,9])box([.09,10,.1],[x,4.9,-7],black);
  for(const y of [0,4.5,9])box([20,.08,.10],[0,y,-7],bronze);
  for(let i=0;i<18;i++){
    const x=(i-8.5)*1.6,h=3+(i*7%8),z=-10-(i%3)*2;
    box([1.3,h,1.5],[x,h/2-1,z],mat(i%2?'#162632':'#1c2c35',.2));
    for(let y=0;y<h-1;y+=.65)for(const dx of [-.34,.34])if((i+Math.round(y*10))%3)box([.12,.22,.015],[x+dx,y,z+.76],glow(i%3?'#648086':'#b89a62'));
  }
  // Corner glazing keeps the city visible behind the side-on chair/desk composition.
  for(const z of [-7,-4,-1,2,5,8])box([.1,9,.09],[-7,4.5,z],black);
  for(const y of [0,4.5,9])box([.1,.07,18],[-7,y,.5],bronze);
  for(let i=0;i<14;i++){
    const z=(i-6.5)*1.65,h=4+(i*5%7),x=-11-(i%3)*2;
    box([1.5,h,1.3],[x,h/2-1,z],mat(i%2?'#172a34':'#21313a',.2));
    for(let y=.4;y<h-1;y+=.7)for(const dz of [-.35,.35])if((i+Math.round(y*10))%3)box([.015,.22,.12],[x+.76,y,z+dz],glow(i%3?'#698489':'#a88e63'));
  }
  scene.add(new T.HemisphereLight('#a0b5c6','#17191a',1.35));
  const key=new T.DirectionalLight('#ffe1b4',3.4);key.position.set(3,8,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-9,right:9,top:9,bottom:-9});key.shadow.bias=-.0005;scene.add(key);
  const rim=new T.DirectionalLight('#7499b8',2);rim.position.set(-5,5,-5);scene.add(rim);
  const monitorGlow=new T.PointLight('#9cd8b7',7,8,2);monitorGlow.position.set(0,3.5,-2.2);scene.add(monitorGlow);
  const warm=new T.PointLight('#ffe0a0',8,6,2);warm.position.set(-2.1,4.05,-2.8);scene.add(warm);
  return {scene,chair,monitor,keyboard,desk,key,dispose(){scene.traverse(o=>o.geometry?.dispose());key.shadow.map?.dispose();}};
}
