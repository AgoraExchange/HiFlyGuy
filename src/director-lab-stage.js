import * as T from 'three';
import { createFly, animateFly } from './scene.js';
import { sampleLabTake } from './director-lab-timeline.js';

export class LabStage {
  constructor(host) {
    this.host=host; host.classList.remove('wallet-insert');
    this.scene=new T.Scene(); this.scene.background=new T.Color('#03090b'); this.scene.fog=new T.Fog('#03090b',16,35);
    this.camera=new T.PerspectiveCamera(44,1,.1,80);
    this.renderer=new T.WebGLRenderer({antialias:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.toneMapping=T.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.3;
    this.renderer.domElement.className='director-canvas';
    this.renderer.domElement.setAttribute('aria-label','Fly Guy losing trade isolation lab cinematic');
    host.append(this.renderer.domElement);
    this.overlay=document.createElement('div'); this.overlay.className='lab-overlay';
    this.overlay.innerHTML='<div class="lab-slate">RISK MANAGEMENT DIVISION<span>SUBJECT / FLY GUY</span></div><div class="lab-loss"><small>REALIZED P&amp;L</small><strong>−$4,280<span>.00</span></strong><svg viewBox="0 0 300 110" aria-hidden="true"><path d="M0 12 L26 22 44 16 69 40 91 30 110 48 138 41 162 70 182 57 204 88 227 80 252 96 270 87 300 106"/></svg><b>POSITION LIQUIDATED</b></div><div class="lab-caption"><h2></h2><p></p></div><div class="lab-foot">CHAMBER 04<span>PROFIT IS MANDATORY</span></div>';
    host.append(this.overlay);
    this.title=this.overlay.querySelector('h2'); this.detail=this.overlay.querySelector('p');
    const metal=new T.MeshStandardMaterial({color:'#35494c',metalness:.8,roughness:.35});
    const dark=new T.MeshStandardMaterial({color:'#121e22',metalness:.4,roughness:.7});
    const glow=new T.MeshBasicMaterial({color:'#a9e4e2'});
    const box=(size,pos,mat=metal)=>{const mesh=new T.Mesh(new T.BoxGeometry(...size),mat);mesh.position.set(...pos);mesh.castShadow=mesh.receiveShadow=true;this.scene.add(mesh);return mesh;};
    box([22,.3,24],[0,-.2,0],dark); box([22,12,.3],[0,5.8,-7],dark);
    for(let x=-10;x<=10;x+=2)box([.025,.02,24],[x,-.035,0]);
    for(let z=-10;z<=10;z+=2)box([22,.02,.025],[0,-.035,z]);
    for(const x of [-7,7]) {box([.2,10,.3],[x,4.8,-6.7]);box([.055,6,.04],[x,4,-6.5],glow);}
    box([3.8,.35,4.5],[0,.7,0]);
    for(const x of [-1.6,1.6])for(const z of [-1.8,1.8])box([.16,.7,.16],[x,.25,z]);
    box([2.5,1.5,.22],[0,1.65,-1.7],dark);
    // Twin electrode towers flank the specimen platform.
    for(const side of [-1,1]) {
      box([.65,.25,.8],[side*2.65,.1,0]);box([.16,3.5,.16],[side*2.65,1.8,0]);
      for(let i=0;i<6;i++)box([.5,.09,.5],[side*2.65,1.6+i*.22,0],dark);
      const orb=new T.Mesh(new T.SphereGeometry(.24,20,12),metal);orb.position.set(side*2.65,3,0);this.scene.add(orb);
    }
    box([2.3,.16,1.2],[0,7,0],dark);box([1.9,.03,.8],[0,6.9,0],glow);box([.08,4,.08],[0,9,0]);
    this.scene.add(new T.HemisphereLight('#7fa7b4','#05080b',.65));
    this.spot=new T.SpotLight('#c5eeeb',230,25,.48,.65,1.6);this.spot.position.set(0,6.8,1);this.spot.target.position.set(0,1,0);this.spot.castShadow=true;this.spot.shadow.mapSize.set(1024,1024);this.scene.add(this.spot,this.spot.target);
    const rim=new T.DirectionalLight('#6396ab',2);rim.position.set(0,4,-5);this.scene.add(rim);
    this.electric=new T.PointLight('#80dfff',0,10);this.electric.position.set(0,2.8,1);this.scene.add(this.electric);
    this.arcs=[-1,1].map(side=>{
      const points=Array.from({length:19},(_,i)=>new T.Vector3(side*(2.65-i/18*2.2),3-i/18*.9,0));
      const arc=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#b7f0ff',transparent:true}));
      arc.userData.side=side;this.scene.add(arc);return arc;
    });
    this.fly=createFly();this.scene.add(this.fly.group);
    this.actor={time:0,y:1.72,state:'Exploring',speed:0,life:{buzz:0,motivation:1},groundHeight:()=>.85};
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
  }
  resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);}
  render(time){
    const f=sampleLabTake(time);this.host.dataset.shot=f.shot;this.overlay.dataset.shot=f.shot;
    this.title.textContent=f.title;this.detail.textContent=f.detail;
    this.actor.time=f.time;this.actor.speed=f.pulse ? 1 : 0;this.actor.state=f.panic ? 'Grooming' : 'Exploring';
    animateFly(this.fly,this.actor);
    this.fly.group.position.set(Math.sin(f.time*52)*f.pulse*.09,1.72-f.slump*.32+f.pulse*.13,0);
    this.fly.group.rotation.set(f.slump*.28-f.pulse*.2,Math.sin(f.time*3)*f.panic*.28,f.slump*.28+Math.sin(f.time*45)*f.pulse*.08);
    this.fly.forelegs.forEach(leg=>{leg.root.rotation.z=leg.side*(f.panic*.3+f.pulse*.9);});
    this.fly.wings.forEach((wing,i)=>{wing.rotation.z=(i?1:-1)*(.04+f.pulse*.75+f.slump*.18);});
    this.spot.intensity=f.shot==='loss' ? 45 : 230;this.electric.intensity=f.pulse*45;
    for(const arc of this.arcs){
      arc.visible=f.pulse>0;arc.material.opacity=f.pulse;
      const p=arc.geometry.attributes.position;
      for(let i=0;i<p.count;i++){
        const u=i/(p.count-1),jitter=Math.sin(u*Math.PI)*.2;
        p.setXYZ(i,arc.userData.side*(2.65-u*2.2),3-u*.9+Math.sin(i*7+f.time*35)*jitter,Math.cos(i*4+f.time*28)*jitter);
      }
      p.needsUpdate=true;
    }
    this.camera.position.set(...f.camera);this.camera.lookAt(0,1.9,0);this.renderer.render(this.scene,this.camera);
  }
  dispose(){
    this.observer.disconnect();const materials=new Set(),geometries=new Set();
    this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
    for(const g of geometries)g.dispose();for(const m of materials){m.map?.dispose();m.dispose();}
    this.spot.shadow.map?.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.host.replaceChildren();
  }
}
