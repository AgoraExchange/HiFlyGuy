import * as T from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { createFly, animateFly } from './scene.js';
import { sampleTake } from './director-timeline.js';

export class DirectorStage {
  constructor(host) {
    this.host=host; this.scene=new T.Scene(); this.scene.fog=new T.Fog('#0a111c',45,110);
    this.camera=new T.PerspectiveCamera(48,1,.1,180);
    this.renderer=new T.WebGLRenderer({alpha:true,antialias:true}); this.renderer.setClearColor('#0a111c',1);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;
    this.renderer.domElement.className='director-canvas';this.renderer.domElement.setAttribute('aria-label','Directed FlyGuy cinematic');host.append(this.renderer.domElement);
    this.materials=new Set();
    const mat=(color,metalness=.1,roughness=.65)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});this.materials.add(m);return m;};
    const glow=color=>{const m=new T.MeshBasicMaterial({color});this.materials.add(m);return m;};
    const stone=mat('#182026',.3,.38), bronze=mat('#b39665',.8,.3), black=mat('#10191d',.25), cream=mat('#8b8980',.05), wood=mat('#3c2f28',.25), green=mat('#293e33');
    const box=(size,pos,material=stone,parent=this.scene)=>{const m=new T.Mesh(new T.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
    const cylinder=(radius,height,pos,material=bronze,parent=this.scene)=>{const m=new T.Mesh(new T.CylinderGeometry(radius,radius,height,24),material);m.position.set(...pos);m.castShadow=true;parent.add(m);return m;};
    const light=(color,power,pos,distance=35)=>{const l=new T.PointLight(color,power,distance,2);l.position.set(...pos);this.scene.add(l);};
    this.scene.add(new T.HemisphereLight('#bfcede','#192126',1.6));
    const key=new T.DirectionalLight('#f2d4a8',3.3);key.position.set(4,15,10);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-19,right:19,top:17,bottom:-17});key.shadow.bias=-.001;this.scene.add(key);
    const rim=new T.DirectionalLight('#84b9ef',2);rim.position.set(-8,8,-12);this.scene.add(rim);
    box([35,.3,31],[0,-.2,-2],stone);
    for(let x=-16;x<=16;x+=4) box([.022,.01,30],[x,-.04,-2],bronze);
    for(let z=-16;z<=12;z+=4) box([34,.01,.022],[0,-.04,z],bronze);
    box([.4,12,31],[-17,5.8,-2],black);box([.4,12,31],[17,5.8,-2],black);
    box([34,.16,.12],[0,.1,-16.4],glow('#d2b481'));box([34,.16,.12],[0,11.8,-16.4],bronze);
    // Floor-to-ceiling windows and a deterministic skyline.
    for(let x=-16;x<=16;x+=4) box([.11,12,.15],[x,5.8,-16.3],bronze);
    for(const y of [4,8]) box([34,.07,.12],[0,y,-16.3],bronze);
    const cityMats=['#101e31','#17253a','#132535'].map(c=>mat(c,.3));
    for(let i=0;i<28;i++) {
      const x=(i%14-6.5)*4.6,z=-25-Math.floor(i/14)*11,height=7+(i*7%13);
      box([3.2,height,3],[x,height/2-3,z],cityMats[i%3]);
      for(let j=0;j<8;j++) for(let k=0;k<2;k++) if((i+j+k)%3) box([.22,.42,.04],[x-.7+k*1.4,j*1.3-1.5,z+1.52],glow((i+j)%4?'#658698':'#bd9d6a'));
    }
    // Elevator cabin, split doors, brass frame, and illuminated floor indicator.
    box([7.3,8,3],[-9,3.8,-13.2],black);box([6.7,.08,3],[-9,.01,-11.4],bronze);
    box([6.7,7,.12],[-9,3.5,-14.5],wood);
    for(const side of [-1,1]) {box([.26,7.4,.4],[-9+side*3.4,3.7,-9.8],bronze);box([.08,6.7,.1],[-9+side*3.1,3.5,-9.55],glow('#ffdc9c'));}
    box([7.05,.3,.4],[-9,7.4,-9.8],bronze);
    this.doors=[-1,1].map(side=>box([3.1,7.05,.15],[-9+side*1.55,3.55,-9.9],mat('#616361',.85,.28)));
    this.label('PH  /  28',[-9,8,-9.5],3.2,'#efd9a1');light('#ffcf88',75,[-9,6,-10.5],14);
    // Lounge, marble table, abstract art, and a warm reading lamp.
    const couch=new T.Group();couch.position.set(-8,0,5);this.scene.add(couch);
    box([8,1.2,3],[0,.7,0],cream,couch);box([8,2.1,.6],[0,1.9,1.3],cream,couch);
    for(const side of [-1,1])box([.6,1.8,3],[side*3.8,1.5,0],cream,couch);
    for(const x of [-2.5,0,2.5])box([2.35,.35,2.4],[x,1.43,-.1],mat('#a19b8c'),couch);
    box([9,.035,8],[-8,.02,3.6],mat('#26363a'));
    const coffeeTable=new T.Group();coffeeTable.position.set(-8,0,1.2);this.scene.add(coffeeTable);
    box([4.5,.2,2.4],[0,1.1,0],mat('#84898c',.35,.3),coffeeTable);
    for(const x of [-1.8,1.8])box([.13,1,1.8],[x,.5,0],bronze,coffeeTable);
    cylinder(.7,.08,[-13,.05,3],black);cylinder(.055,6,[-13,3,3],bronze);cylinder(.9,.7,[-13,6,3],cream);light('#ffd493',40,[-13,5.5,3],18);
    const art=box([.15,5,5],[-16.7,5,1],bronze);box([.16,4.7,4.7],[-16.58,5,1],mat('#1b2737'));
    for(let i=0;i<5;i++)box([.18,.12,3.2],[-16.45,3.7+i*.6,1+Math.sin(i)*.5],i%2?bronze:cream);
    // Desk and a deliberately readable real DOM wallet screen.
    box([10,.28,4],[6,2.35,-7],wood);
    for(const x of [1.5,10.5])box([.3,2.25,3.3],[x,1.1,-7],bronze);
    box([6.6,.15,2.3],[6,2.57,-6.8],black);box([6.4,4,.2],[6,4.55,-7.65],black);
    for(let row=0;row<3;row++) for(let col=0;col<12;col++)box([.36,.035,.3],[3.45+col*.46,2.67,-6.8+row*.37],mat('#45514e'));
    cylinder(.38,.8,[10,2.9,-6.7],cream);light('#aadfac',18,[6,5.6,-6],10);
    const screenMaterial=new T.MeshBasicMaterial({color:0,opacity:0,blending:T.NoBlending,side:T.FrontSide});this.materials.add(screenMaterial);
    const screen=new T.Mesh(new T.PlaneGeometry(6,3.6),screenMaterial);screen.position.set(6,4.55,-7.53);this.scene.add(screen);
    this.cssScene=new T.Scene();this.css=new CSS3DRenderer();this.css.domElement.className='director-wallet-layer';host.prepend(this.css.domElement);
    const display=document.createElement('div');display.className='director-wallet-screen';
    this.iframe=document.createElement('iframe');this.iframe.title='Aster Wallet cinematic display';this.iframe.tabIndex=-1;this.iframe.src=`${import.meta.env.BASE_URL}market.html?director=1`;display.append(this.iframe);
    const surface=new CSS3DObject(display);surface.position.copy(screen.position);surface.scale.setScalar(.0075);this.cssScene.add(surface);
    // Swivelling leather chair and five-star base.
    this.chair=new T.Group();this.chair.position.set(6,0,-3.8);this.scene.add(this.chair);
    cylinder(.13,1,[0,.55,0],bronze,this.chair);
    for(let i=0;i<5;i++){const spoke=box([.12,.12,2.5],[0,.15,0],bronze,this.chair);spoke.rotation.y=i*Math.PI/5;}
    this.seat=new T.Group();this.seat.position.y=1.2;this.chair.add(this.seat);
    box([2.5,.4,2.6],[0,0,0],black,this.seat);box([2.5,2.8,.4],[0,1.2,-1.2],black,this.seat);
    for(const side of [-1,1]){box([.15,1,.15],[side*1.4,.4,0],bronze,this.seat);box([.28,.2,2],[side*1.4,1,0],black,this.seat);}
    // A little greenery gives the wide reveal depth.
    for(const x of [14,-14]){cylinder(.75,1.4,[x,.7,-12],wood);for(let i=0;i<6;i++){const leaf=new T.Mesh(new T.SphereGeometry(1,12,8),green);leaf.position.set(x+Math.sin(i*2)*.5,1.8+i*.3,-12+Math.cos(i*2)*.5);leaf.scale.set(.25,1.4,.45);leaf.rotation.z=Math.sin(i)*.5;this.scene.add(leaf);}}
    this.fly=createFly();this.scene.add(this.fly.group);
    this.actor={time:0,y:.87,state:'Exploring',speed:0,life:{buzz:0,motivation:1},groundHeight:()=>this.actor.y-.87};
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
  }
  label(text,position,width,color) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.font='32px monospace';ctx.textAlign='center';ctx.fillText(text,256,60);
    const texture=new T.CanvasTexture(canvas),material=new T.MeshBasicMaterial({map:texture,transparent:true});this.materials.add(material);
    const mesh=new T.Mesh(new T.PlaneGeometry(width,width*96/512),material);mesh.position.set(...position);this.scene.add(mesh);
  }
  resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);this.css.setSize(w,h);}
  render(time){
    const f=sampleTake(time);this.host.dataset.shot=f.shot;
    this.host.classList.toggle('wallet-insert',f.wallet);
    this.doors.forEach((door,i)=>door.position.x=-9+(i?1:-1)*(1.55+f.door*3.15));
    this.fly.group.position.set(...f.position);this.fly.group.rotation.y=f.heading;
    Object.assign(this.actor,{time:f.time,y:f.position[1],speed:f.speed,state:f.typing?'Locked in':'Exploring'});animateFly(this.fly,this.actor);
    this.fly.group.rotation.x=-f.lean*.52;
    this.fly.forelegs.forEach(leg=>{leg.root.rotation.x-=f.lean*.7;leg.root.rotation.z=leg.side*f.lean*.35;});
    this.chair.rotation.y=f.chairYaw;this.seat.rotation.x=-f.lean*.14;
    this.camera.position.set(...f.camera);this.camera.fov=f.fov;this.camera.lookAt(...f.target);this.camera.updateProjectionMatrix();
    this.css.render(this.cssScene,this.camera);this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.observer.disconnect();this.iframe.src='about:blank';this.scene.traverse(o=>o.geometry?.dispose());for(const m of this.materials){m.map?.dispose();m.dispose();}this.renderer.dispose();this.renderer.forceContextLoss();this.host.replaceChildren();}
}
