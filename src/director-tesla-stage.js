import * as T from 'three';
import {DirectorStage} from './director-stage.js';
import {createComebackDesk} from './director-comeback-desk.js';
import {animateFly} from './scene.js';
import {sampleTeslaTake,teslaTiming,ease} from './director-tesla-timeline.js';
import {createTeslaTerminal} from './director-tesla-terminal.js';
import {teslaBuilders,dressTeslaFly,createTeslaGirls,createTeslaScooter,poseTeslaHands} from './director-tesla-cast.js';

const mix=(a,b,u)=>a.map((v,i)=>v+(b[i]-v)*u);
export class TeslaStage extends DirectorStage{
  constructor(host){
    super(host);host.classList.remove('wallet-insert');this.settings=teslaTiming();
    this.css.domElement.hidden=true;this.iframe.src='about:blank';
    this.renderer.domElement.setAttribute('aria-label','Fly Guy Tesla cinematic: apartment arrival, scooter and night trading desk');
    dressTeslaFly(this.fly,this.materials);this.girls=createTeslaGirls(this.materials);
    const smokeCanvas=document.createElement('canvas');smokeCanvas.width=smokeCanvas.height=64;
    const smokeContext=smokeCanvas.getContext('2d'),gradient=smokeContext.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0,'rgba(220,231,240,1)');gradient.addColorStop(.45,'rgba(220,231,240,.4)');gradient.addColorStop(1,'rgba(220,231,240,0)');
    smokeContext.fillStyle=gradient;smokeContext.fillRect(0,0,64,64);
    const smokeMap=new T.CanvasTexture(smokeCanvas);
    for(const puff of [...this.fly.lifeProps.smoke.children]){puff.geometry.dispose();puff.material.dispose();this.fly.lifeProps.smoke.remove(puff);}
    for(let i=0;i<20;i++){const m=new T.SpriteMaterial({map:smokeMap,color:'#c7d5e2',transparent:true,opacity:.2,depthWrite:false});this.materials.add(m);this.fly.lifeProps.smoke.add(new T.Sprite(m));}
    this.scooter=createTeslaScooter(this.materials);this.scene.add(this.scooter.group);
    this.night=createComebackDesk(this.materials);this.night.monitor.visible=false;this.night.keyboard.visible=false;
    this.night.key.color.set('#b1d4ed');this.night.key.intensity=2.5;
    this.night.scene.fog.color.set('#080e1b');this.night.scene.background.set('#080e1b');
    const {mat,mesh,box}=teslaBuilders(this.materials),metal=mat('#273641',.7,.32),dark=mat('#0c1820',.3,.5);
    this.laptop=new T.Group();this.laptop.position.z=.55;this.laptop.scale.x=.9;this.night.scene.add(this.laptop);
    box([4.5,.13,2.0],[0,2.60,-2.05],metal,this.laptop,.07);
    box([4.28,.019,1.82],[0,2.676,-2.05],dark,this.laptop,.04);
    this.keys=[];
    for(let row=0;row<4;row++)for(let col=0;col<15;col++)this.keys.push(box([.23,.03,.17],[(col-7)*.266,2.704,-2.7+row*.225],metal,this.laptop,.025));
    box([1.25,.008,.35],[0,2.693,-1.3],metal,this.laptop,.04);
    box([4.5,2.86,.12],[0,4.12,-2.98],dark,this.laptop,.07);
    this.terminal=createTeslaTerminal(this.materials);
    this.screen=mesh(new T.PlaneGeometry(4.28,2.675),this.terminal.material,this.laptop,[0,4.12,-2.912]);
    const edge=new T.MeshBasicMaterial({color:'#67dcda'});this.materials.add(edge);
    box([4.2,.018,.02],[0,2.60,-1.047],edge,this.laptop,.004);
    this.blue=new T.PointLight('#68dae8',16,12,2);this.blue.position.set(0,4,-2);this.night.scene.add(this.blue);
    const purple=new T.PointLight('#9573d5',24,14,2);purple.position.set(-4,4,3);this.night.scene.add(purple);
    this.lighter=new T.Group();this.fly.group.add(this.lighter);
    box([.13,.23,.08],[0,0,0],mat('#b89652',.8,.3),this.lighter,.02);
    this.flame=mesh(new T.SphereGeometry(.055,12,8),new T.MeshBasicMaterial({color:'#ffd18c'}),this.lighter,[0,.18,0]);this.materials.add(this.flame.material);this.flame.scale.set(.6,1.5,.6);
    this.overlay=document.createElement('div');this.overlay.className='tesla-overlay';
    this.overlay.innerHTML='<div class="tesla-brand">FLY GUY<span>NIGHT SHIFT</span></div><div class="tesla-caption"></div>';
    this.caption=this.overlay.querySelector('.tesla-caption');host.append(this.terminal.insert,this.overlay);
  }
  configure(settings){this.settings=teslaTiming(settings);}
  get duration(){return this.settings.duration;}
  render(time){
    const f=sampleTeslaTake(time,this.settings);this.host.dataset.shot=f.shot;this.host.dataset.phase=f.drop?'montage':'story';
    this.host.dataset.girls=String(f.girls);this.host.dataset.smoking=String(f.smoke);this.caption.textContent=f.caption;
    this.overlay.dataset.phase=f.drop?'montage':'story';this.terminal.insert.hidden=!f.insert;
    this.fly.group.visible=f.flyVisible;
    this.terminal.update(f);this.scooter.group.visible=f.suite&&f.shot!=='elevator-crew'||['desk-arrival','crew-wide'].includes(f.shot);
    const scene=f.suite?this.scene:this.night.scene;if(this.fly.group.parent!==scene)scene.add(this.fly.group);
    if(this.scooter.group.parent!==scene)scene.add(this.scooter.group);
    if(!f.suite){this.scooter.group.position.set(-4.8,0,1.5);this.scooter.group.rotation.y=-.8;}
    this.girls.forEach(g=>{if(g.group.parent!==scene)scene.add(g.group);g.group.visible=f.girls;});
    Object.assign(this.actor,{time:f.time,speed:0,state:'Exploring',y:f.suite?.87:2.4});animateFly(this.fly,this.actor);
    this.fly.legs.forEach(leg=>leg.scale.set(1,1,1));this.fly.wings.forEach(w=>w.scale.setScalar(1));
    this.fly.group.rotation.set(0,0,0,'YXZ');this.lighter.visible=false;
    if(f.suite)this.renderArrival(f);else this.renderNight(f);
    this.camera.updateProjectionMatrix();this.renderer.render(scene,this.camera);
  }
  renderArrival(f){
    this.camera.fov=49;
    const elev=f.shot==='elevator-crew',mount=f.shot==='scooter-mount';
    const opening=elev?ease(f.u*2):1;
    this.doors.forEach((door,i)=>door.position.x=-9+(i?1:-1)*(1.55+opening*3.15));
    if(elev){
      const walk=ease((f.u-.2)/.8);this.fly.group.position.set(-9,.87,-11.3+walk*3.3);
      this.camera.position.set(-9,3.1,2.5-f.u);this.camera.lookAt(-9,1.8,-9.3+walk);this.camera.fov=53;
      this.fly.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(f.time*10+i)*.25*walk);
    }else{
      const p=mount?[-9,0,-6.8]:mix([-9,0,-6.8],[2.8,0,-3.5],f.u),heading=mount?0:Math.atan2(11.8,3.3);
      this.scooter.group.position.set(...p);this.scooter.group.rotation.y=heading;
      const offset=new T.Vector3(0,1.37,-.30).applyAxisAngle(new T.Vector3(0,1,0),heading);
      const target=new T.Vector3(...p).add(offset);
      if(mount){target.lerpVectors(new T.Vector3(-9,.87,-8.0),target,f.u);target.y+=Math.sin(f.u*Math.PI)*.35;}
      this.fly.group.position.copy(target);this.fly.group.rotation.y=heading;
      this.fly.legs.forEach((leg,i)=>{if(i%3!==0){leg.scale.x=.48;leg.rotation.x=0;}});
      poseTeslaHands(this.fly,side=>[side*.68,.68,1.42]);
      this.scooter.wheels.forEach(w=>w.rotation.x=mount?0:-f.u*40);
      this.camera.position.set(p[0]+5.1,3.1,p[2]+6.4);this.camera.lookAt(p[0],1.1,p[2]);this.camera.fov=51;
    }
    this.girls.forEach((girl,i)=>{
      const side=i?1:-1,z=elev?-11.5+ease((f.u-.3)/.7)*2.8:mount?-8.7:-8.7+f.u*2.0;
      const sim={time:f.time+i,y:.87,speed:1,state:'Exploring',life:{buzz:0,motivation:1},groundHeight:()=>0};animateFly(girl,sim);
      girl.group.position.set(-9+side*1.6,.77,z);girl.group.rotation.y=f.shot==='scooter-ride'?.7:0;
    });
  }
  renderNight(f){
    const lean=f.smoke?-.72:-.62,fly=this.fly;
    fly.group.position.set(0,2.35,.85);fly.group.rotation.set(lean,Math.PI,0,'YXZ');
    fly.wings.forEach((w,i)=>{w.rotation.y=(i?1:-1)*.52;w.rotation.z=(i?1:-1)*.04;w.scale.setScalar(.78);});
    fly.legs.forEach((leg,i)=>{if(i%3!==0){leg.rotation.x=-.7;leg.scale.x=.68;}});
    if(f.typing||f.wallet){
      // Rest the full fingertip above the keycap, with raised elbows and wrists
      // so the forearms stay clear of the laptop throughout each alternating tap.
      poseTeslaHands(fly,side=>[side*.4788,.396+Math.max(0,Math.sin(f.time*18+side*2))*.060,2.55],lean,{elbowHeight:.72,raisedWrist:true});
    }else{
      poseTeslaHands(fly,side=>side<0?[side*.4,.4,1.40]:[side*.7,-.3,.8],lean);
    }
    const {cigarette,smoke,ember}=fly.lifeProps;cigarette.visible=smoke.visible=f.smoke;
    cigarette.position.set(0,-.13,1.35);cigarette.rotation.set(0,-.1,0);
    ember.visible=f.lighting>.65;ember.scale.setScalar(.85+Math.sin(f.time*3)*.15);
    this.lighter.visible=f.shot==='light-up';this.lighter.position.set(.05,-.28,1.9);this.flame.visible=f.u>.15&&f.u<.8;
    if(this.lighter.visible)poseTeslaHands(fly,side=>side<0?[.05,-.3,1.8]:[side*.7,-.3,.8],0);
    const smokeOrigin=new T.Vector3(0,-.13,1.91).applyAxisAngle(new T.Vector3(1,0,0),lean);
    smoke.children.forEach((p,i)=>{
      const life=(f.time*.31+i/20)%1;const position=smokeOrigin.clone().add(new T.Vector3(Math.sin(i+life*5)*life*.25,.03+life*2.3,-life*.35));
      position.applyAxisAngle(new T.Vector3(1,0,0),-lean);p.position.copy(position);p.scale.setScalar(.07+life*.45);
      p.material.opacity=Math.sin(life*Math.PI)*.22*f.lighting;
    });
    this.girls.forEach((girl,i)=>{
      const side=i?1:-1,arrive=f.shot==='crew-smoke'?f.u:1;
      const sim={time:f.time+i,y:2,speed:1,state:'Exploring',life:{buzz:0,motivation:1},groundHeight:()=>0};animateFly(girl,sim);
      girl.group.position.set(side*(2.4-arrive*.8),2.4+arrive*.9+Math.sin(f.time*2+i)*.04,3.8-arrive*.7);
      girl.group.rotation.y=Math.PI+side*.22;girl.wings.forEach((w,j)=>w.rotation.z=(j?1:-1)*(.3+Math.sin(f.time*42)*.3));
    });
    const u=f.u;let camera=[10.8,6.5,3.0],target=[0,2.6,-.1],fov=51;
    if(f.shot==='nightdesk-open'){camera=[13,7,3.3];target=[0,2.6,-.3];fov=52;}
    if(f.shot==='desk-arrival'){camera=[12.8,7,3.3];target=[-.8,2.5,-.3];fov=55;}
    if(['light-up','profile-smoke'].includes(f.shot)){camera=[5.1-u*.3,3.8,-2.4];target=[0,2.9,.35];fov=45;}
    if(['crew-smoke','crew','crew-wide'].includes(f.shot)){camera=[8.3,6.6,-6.5];target=[0,3,1.4];fov=64;}
    if(f.shot==='solo-low'){camera=[4.8,2.9,-1.3];target=[0,2.65,.3];fov=48;}
    if(['hands','keys'].includes(f.shot)){camera=[2.8,4.5,-.9];target=[0,2.8,-1.1];fov=43;}
    if(f.shot==='solo-orbit'){camera=[6.7-u*1.1,4.9,2.6-u*2];target=[0,2.5,-.4];fov=49;}
    if(f.shot==='eyes'){camera=[2.8,3.35,-1.7];target=[0,2.85,.1];fov=36;}
    if(f.shot==='hero'){camera=[7.5-u*.4,4.7,-1.4];target=[0,2.65,.4];fov=49;}
    if(f.shot==='terminal'||f.shot.startsWith('screen-')||f.wallet){camera=[0,4.15,4.5];target=[0,4.12,-2.9];fov=43;}
    if(f.shot==='desk-arrival'){
      // One continuous dismount/hop from the parked scooter into the empty chair.
      const start=new T.Vector3(0,1.37,-.3).applyAxisAngle(new T.Vector3(0,1,0),-.8).add(this.scooter.group.position);
      fly.group.position.copy(start).lerp(new T.Vector3(0,2.35,.85),u);
      fly.group.position.y+=Math.sin(u*Math.PI)*1.1;
      fly.group.rotation.set(lean*u,-.8-(Math.PI-.8)*u,0,'YXZ');
      fly.legs.forEach((leg,i)=>{leg.scale.set(1,1,1);leg.rotation.x=-.7*u;});
      fly.wings.forEach((wing,i)=>{wing.rotation.y=(i?1:-1)*.52*u;wing.rotation.z=(i?1:-1)*(.04+Math.sin(u*Math.PI)*(.35+Math.sin(f.time*48)*.2));});
      poseTeslaHands(fly,side=>[side*(.9-.2*u),-.65+.35*u,1.0],lean*u);
    }
    this.camera.position.set(...camera);this.camera.lookAt(...target);this.camera.fov=fov;
    this.blue.intensity=f.drop?19:14;
  }
  dispose(){
    this.scene.add(this.fly.group);this.girls.forEach(g=>this.scene.add(g.group));
    // Include actor materials created by createFly, including translucent smoke.
    for(const scene of [this.scene,this.night.scene])scene.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])this.materials.add(m);});
    this.night.dispose();super.dispose();
  }
}
