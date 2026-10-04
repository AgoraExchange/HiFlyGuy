import { poseTeslaHands } from './director-tesla-cast.js';
import * as T from 'three';
import { LifeScenes } from './life-scenes.js';
import { createFly, animateFly } from './scene.js';
import { Simulation } from './simulation.js';
import { WORKDAY_DURATION, sampleWorkday } from './director-workday-timeline.js';

export class WorkdayStage {
  constructor(host) {
    this.host=host;this.scene=new T.Scene();this.scene.background=new T.Color('#0c1523');
    this.camera=new T.PerspectiveCamera(48,1,.1,150);
    this.renderer=new T.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.setClearColor('#0c1523');this.renderer.domElement.setAttribute('aria-label','FlyGuy: nine to five, then The Buzz');
    host.append(this.renderer.domElement);
    this.scene.add(new T.HemisphereLight('#d2e6ef','#343325',2));
    const key=new T.DirectionalLight('#ffedcc',3);key.position.set(5,10,6);this.scene.add(key);
    const floor=new T.Mesh(new T.PlaneGeometry(24,24),new T.MeshStandardMaterial({color:'#19252a'}));floor.rotation.x=-Math.PI/2;this.scene.add(floor);
    this.rooms=new LifeScenes(this.scene);this.fly=createFly();this.scene.add(this.fly.group);
    this.actor=new Simulation();this.actor.life.autonomous=false;
    this.overlay=document.createElement('div');this.overlay.className='workday-caption';this.overlay.innerHTML='<small>FLY GUY / AFTER HOURS</small><strong></strong><span></span>';host.append(this.overlay);
    this.caption=this.overlay.querySelector('strong');this.detail=this.overlay.querySelector('span');
    this.phone=new T.Mesh(new T.BoxGeometry(.34,.6,.08),new T.MeshStandardMaterial({color:'#17272c'}));this.fly.group.add(this.phone);this.phone.position.set(.92,.13,1.02);
    const phoneScreen=new T.Mesh(new T.PlaneGeometry(.27,.48),new T.MeshBasicMaterial({color:'#79bca9'}));phoneScreen.position.z=.045;this.phone.add(phoneScreen);
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
  }
  get duration(){return WORKDAY_DURATION;}
  resize(){const r=this.host.getBoundingClientRect();this.renderer.setSize(Math.max(1,r.width),Math.max(1,r.height));this.camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);this.camera.updateProjectionMatrix();}
  render(time){
    const f=sampleWorkday(time),a=this.actor,s=a.life.social;
    this.host.dataset.shot=f.id;this.caption.textContent=f.caption;
    this.rooms.setRoom(f.room);a.environment=f.room;a.time=f.time;
    [a.x,a.y,a.z]=f.actor.position;a.heading=f.actor.heading;a.state=f.actor.state;a.speed=f.actor.speed;
    s.visitors=f.companions.length;s.arrivedAt=17;s.leaveAt=100;
    s.onClock=f.id==='clock-in'||f.id==='shift';s.worked=f.id==='shift'?f.u*120:0;
    this.phone.visible=f.id==='call';
    if(f.id==='wake'){this.camera.position.set(5,8,9);this.camera.lookAt(-3.5,1,-3);}
    else if(f.id==='clock-in'){this.camera.position.set(11,8,15);this.camera.lookAt(0,2,-3);}
    else if(f.id==='shift'){this.camera.position.set(3-f.u*2,5.5,10-f.u*2);this.camera.lookAt(0,3,-6);}
    else if(f.id==='call'){this.camera.position.set(5.2,3,8.8);this.camera.lookAt(2.2,1,1.8);}
    else if(f.id==='company'){this.camera.position.set(10,7,12);this.camera.lookAt(3,1,0);}
    else if(f.id==='bar'){this.camera.position.set(1.8-f.u,7-f.u,17-f.u);this.camera.lookAt(0,2,-3.4);}
    else if(f.id==='home'){this.camera.position.set(10,10,15);this.camera.lookAt(-1,1,0);}
    else {this.camera.position.set(4-f.u,9,8);this.camera.lookAt(-3.5,1,-3);}
    this.camera.fov=this.camera.aspect<.8?64:48;this.camera.updateProjectionMatrix();
    a.life.action=a.state;this.fly.group.position.set(a.x,a.y,a.z);this.fly.group.rotation.set(0,a.heading,0,'YXZ');
    animateFly(this.fly,a);
    this.fly.wings.forEach(w=>w.scale.x=a.state==='Sleeping'?.3:1);
    if(f.id==='call')poseTeslaHands(this.fly,side=>side>0?[.91,-.06,1.02]:[-.55,-.65,.7],0,{elbowHeight:-.12});
    if(f.id==='sleep'){
      this.fly.group.rotation.set(0,Math.PI,Math.PI,'YXZ');
      poseTeslaHands(this.fly,side=>[side*1.55,-.04,1.03],0,{elbowHeight:-.2});
      this.fly.legs.forEach(leg=>{if(!this.fly.forelegs.some(front=>front.root===leg))leg.rotation.x=1.1;});
    }
    this.rooms.update(a);
    // Director poses are absolute-time choreography, independent of live companion following.
    f.companions.forEach((pose,i)=>{
      const fly=this.rooms.company[i],y=pose.position[1];
      fly.group.visible=pose.visible!==false;fly.group.position.set(...pose.position);fly.group.rotation.set(0,pose.heading,0,'YXZ');
      animateFly(fly,{time:f.time+i,y,speed:pose.speed,state:pose.state,life:a.life,groundHeight:()=>y-.87});
      fly.wings.forEach(w=>w.scale.x=pose.state==='Sleeping'?.35:1);
      if(f.id==='sleep')fly.group.rotation.z=i===0?-.16:.16;
    });
    if(f.id==='home')this.rooms.frontDoor.rotation.y=f.u<.4?-1.25:-1.25*Math.max(0,1-(f.u-.4)/.25);
    if(f.id==='sleep')this.rooms.frontDoor.rotation.y=0;
    this.detail.textContent=f.id==='shift'?'$'+(f.u*64).toFixed(2)+' / SHIFT EARNINGS':f.id==='call'?'THE BUZZ / CALLING...':f.id==='bar'?'OFF THE CLOCK. IN GOOD COMPANY.':f.id==='sleep'?'NOWHERE ELSE TO BE.':'';
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){
    this.observer.disconnect();const geometries=new Set(),materials=new Set(),textures=new Set();
    this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
    this.renderer.dispose();this.renderer.domElement.remove();this.overlay.remove();
  }
}

