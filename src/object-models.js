import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { planePosition, itemFacing } from './world-items.js';

export function createWorldItem(kind) {
  const g=new T.Group();
  const mesh=(geometry,color,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.7}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
  const box=(w,h,d,color,x,y,z)=>mesh(new T.BoxGeometry(w,h,d),color,x,y,z);
  const cylinder=(r,h,color,x,y,z)=>mesh(new T.CylinderGeometry(r,r,h,32),color,x,y,z);
  const ring=(r,t,color,x,y,z)=>{const m=mesh(new T.TorusGeometry(r,t,8,40),color,x,y,z);m.rotation.x=Math.PI/2;return m;};
  if(kind==='water'){
    cylinder(.85,.12,'#66899f',0,.08,0);ring(.8,.08,'#93b4c5',0,.2,0);
    const water=cylinder(.73,.025,'#75cdd8',0,.17,0);water.material.metalness=.4;water.material.roughness=.15;
    g.userData.ripple=ring(.4,.012,'#d7f6ed',0,.19,0);
    for(let i=0;i<20;i++){const a=i*Math.PI/10;box(.045,.17,.07,'#adc1c5',Math.cos(a)*.82,.13,Math.sin(a)*.82).rotation.y=-a;}
  } else if(kind==='sugar'){
    box(.9,.7,.9,'#f4ead4',0,.35,0);
    for(let i=0;i<24;i++)box(.045,.025,.045,i%2?'#fff9ed':'#d6cdbb',Math.sin(i*8.3)*.4,.707,Math.cos(i*4.1)*.4);
  } else if(kind==='mirror'){
    box(1.5,2,.18,'#9b7855',0,1.2,0);box(1.6,.15,.8,'#624e3b',0,.08,0);
    const mirror=new Reflector(new T.PlaneGeometry(1.25,1.73),{color:0xc6dae0,textureWidth:256,textureHeight:256,clipBias:.003});mirror.position.set(0,1.2,.101);g.add(mirror);g.userData.reflector=mirror;
    // Multiple gifts must not recursively render one another's reflections.
    const reflect=mirror.onBeforeRender;
    mirror.onBeforeRender=function(renderer,scene,...args){const others=[];scene.traverseVisible(o=>{if(o.isReflector&&o!==mirror){others.push(o);o.visible=false;}});try{return reflect.call(this,renderer,scene,...args);}finally{others.forEach(o=>o.visible=true);}};
  } else if(kind==='radio'){
    box(1.6,.9,.65,'#ae775b',0,.52,0);box(.78,.55,.04,'#383b38',-.3,.54,.35);
    for(let i=0;i<6;i++)box(.7,.018,.05,'#9a9c86',-.3,.32+i*.08,.38);
    g.userData.dial=box(.32,.15,.04,'#b1d5a4',.48,.7,.36);
    const knob=cylinder(.12,.09,'#dbc598',.48,.38,.4);knob.rotation.x=Math.PI/2;
    box(.035,.8,.035,'#a6b5b8',.58,1.35,0).rotation.z=-.2;
    box(.7,.08,.1,'#4a473c',0,1.14,0);box(.08,.2,.1,'#4a473c',-.35,1.06,0);box(.08,.2,.1,'#4a473c',.35,1.06,0);
  } else if(kind==='box'){
    box(3,.1,3,'#987548',0,.05,0);box(3,2.2,.1,'#bc965f',0,1.1,-1.45);
    for(const x of [-1.45,1.45]){box(.1,2.2,3,'#c7a16d',x,1.1,0);box(.8,.06,3,'#d0ad7b',x*1.2,2.18,0).rotation.z=x*.15;}
    box(3,.5,.1,'#b68e57',0,.25,1.45);box(.32,.02,3,'#d7c197',0,.12,0);
  } else if(kind==='note'){
    const paper=box(1.5,1,.05,'#f3d895',0,.57,0);paper.rotation.x=-.25;
    g.userData.paper=paper;
    cylinder(.35,.05,'#8e826d',0,.035,0);
  } else if(kind==='hoop'){
    cylinder(.55,.1,'#374742',0,.05,0);box(.12,3.4,.12,'#526861',0,1.7,0);
    box(1.65,1.05,.12,'#e7dcc2',0,3.1,.02);box(.65,.45,.02,'#b76b4b',0,2.98,.09);box(.55,.35,.03,'#e7dcc2',0,2.98,.11);
    ring(.46,.04,'#d7794b',0,2.8,.62);
    for(let i=0;i<10;i++){const a=i*Math.PI/5;box(.02,.5,.02,'#e3ddc7',Math.cos(a)*.34,2.53,.62+Math.sin(a)*.34);}
    ring(.32,.015,'#e3ddc7',0,2.29,.62);
    const ball=mesh(new T.SphereGeometry(.24,16,12),'#d28548',.6,.24,1);g.userData.ball=ball;
    for(let i=0;i<2;i++){const stripe=new T.Mesh(new T.TorusGeometry(.241,.009,4,24),new T.MeshStandardMaterial({color:'#493f2f'}));stripe.rotation.y=i*Math.PI/2;ball.add(stripe);}
  } else if(kind==='lamp'){
    cylinder(.4,.12,'#7b7955',0,.06,0);cylinder(.065,1.3,'#9f9570',0,.75,0);
    const shade=mesh(new T.ConeGeometry(.62,.65,32,1,true),'#e7c87f',0,1.63,0);shade.material.side=T.DoubleSide;
    const bulb=mesh(new T.SphereGeometry(.16,12,8),'#ffe4a2',0,1.4,0);bulb.material.emissive.set('#ffd18a');bulb.material.emissiveIntensity=1.5;
    const light=new T.PointLight('#ffd599',2.2,5,2);light.position.y=1.3;g.add(light);
    const glow=mesh(new T.CircleGeometry(1.5,40),'#f8d68d',0,.025,0);glow.rotation.x=-Math.PI/2;glow.material=new T.MeshBasicMaterial({color:'#f8d68d',transparent:true,opacity:.13,depthWrite:false});
  } else if(kind==='airplane'){
    const plane=new T.Group();g.add(plane);g.userData.plane=plane;
    const vertices=[0,0,1.1,-.9,0,-.65,0,.18,-.35,0,0,1.1,0,.18,-.35,.9,0,-.65,0,0,1.1,0,-.25,-.6,0,.18,-.35];
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    plane.add(new T.Mesh(geometry,new T.MeshStandardMaterial({color:'#e4e7db',side:T.DoubleSide,roughness:.85})));
  } else if(kind==='couch'){
    box(3.6,.45,2.4,'#657d68',0,.4,0);box(3.6,1.2,.35,'#78927a',0,.95,-1);
    for(const x of [-1.65,1.65])box(.3,.8,2.4,'#839b7d',x,.85,0);
    for(const x of [-.78,.78])box(1.5,.2,1.8,'#a0ae8c',x,.66,.12);
    for(const x of [-1.4,1.4])for(const z of [-.8,.8])box(.16,.25,.16,'#6f533c',x,.125,z);
  }
  return g;
}

export function animateWorldItem(g,o,sim){
  g.rotation.y=itemFacing(o);
  const u=g.userData,a=sim.belongings.active,using=a?.id===o.id&&a.phase==='using',t=sim.time;
  if(u.paper&&u.note!==o.text&&typeof document!=='undefined'){
    u.note=o.text;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=340;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#f3d895';ctx.fillRect(0,0,512,340);ctx.fillStyle='#63523b';ctx.font='24px Georgia';
    let row='',y=70;for(const word of String(o.text??'For FlyGuy').split(/\s+/)){if(ctx.measureText(row+' '+word).width>420&&row){ctx.fillText(row,40,y,430);y+=38;row='';}row+=(row?' ':'')+word;}ctx.fillText(row,40,y,430);
    ctx.font='italic 18px Georgia';ctx.fillText('a little note, just for you',40,306);
    u.paper.material.map?.dispose();const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;u.paper.material.color.set('#ffffff');u.paper.material.map=texture;u.paper.material.needsUpdate=true;
  }
  if(u.ripple){u.ripple.scale.setScalar(.7+(t%2)*.35);u.ripple.visible=using;}
  if(u.dial){u.dial.material.emissive.set(using?'#779b66':'#000000');u.dial.scale.y=using?1+Math.sin(t*8)*.15:1;}
  if(u.plane){const p=planePosition(o,t,using&&a.elapsed>=13);u.plane.position.set(p.x-o.x,p.y,p.z-o.z);u.plane.rotation.set(0,using&&a.elapsed>=13?0:Math.atan2(Math.cos(t*1.3),Math.cos(t*.65)*.5),using&&a.elapsed>=13?0:Math.sin(t)*.14);}
  if(u.ball){
    if(using){const p=(a.elapsed%3)/3;if(p<.65){const q=p/.65;u.ball.position.set(0,1.2+1.6*q+Math.sin(q*Math.PI)*1.1,1.5-.88*q);}else{const q=(p-.65)/.35;u.ball.position.set(a.made?0:q*.9,2.8*(1-q)+.24*q,.62+(a.made?0:q*.8));}u.ball.rotation.x=t*3;}
    else u.ball.position.set(.6,.24,1);
  }
}
