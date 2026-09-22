import * as T from 'three';
import {TeslaStage} from './director-tesla-stage.js';
import {animateFly} from './scene.js';
import {poseTeslaHands} from './director-tesla-cast.js';
import {destroyTiming,sampleDestroyTake,DESTROY_DURATION} from './director-destroy-timeline.js';

// A deterministic filming set. It does not place orders or alter the live habitat.
export class DestroyStage extends TeslaStage{
  constructor(host){
    super(host);this.settings=destroyTiming();this.night.scene.add(this.fly.group);
    this.overlay.classList.add('destroy-overlay');
    this.overlay.querySelector('.tesla-brand').innerHTML='FLY GUY<span>THE NIGHT SHIFT / 03</span>';
    this.renderer.domElement.setAttribute('aria-label','FlyGuy check-in: walk to the Night Desk and paper-trading montage');
    const entryLight=new T.PointLight('#b3dcd0',35,13,2);entryLight.position.set(-3,4,5);this.night.scene.add(entryLight);
  }
  configure(settings){this.settings=destroyTiming(settings);}
  get duration(){return DESTROY_DURATION;}
  render(time){
    const f=sampleDestroyTake(time,this.settings);
    this.host.dataset.shot=f.shot;this.host.dataset.phase=f.drop?'montage':'story';
    this.host.dataset.closedTrades=String(f.closedTrades);
    this.caption.textContent=f.caption;this.terminal.insert.hidden=!f.insert;
    this.terminal.update(f);this.fly.group.visible=true;this.scooter.group.visible=false;
    Object.assign(this.actor,{time:f.time,speed:f.shot==='walk-in'?1.4:0,state:'Exploring',y:.85});
    animateFly(this.fly,this.actor);this.fly.legs.forEach(l=>l.scale.set(1,1,1));
    this.fly.wings.forEach(w=>w.scale.setScalar(1));
    this.renderNight(f);this.girls.forEach(g=>g.group.visible=false);
    this.lighter.visible=false;this.fly.lifeProps.cigarette.visible=this.fly.lifeProps.smoke.visible=false;
    const u=f.u;let camera=[4.8-u*.4,3.8,-1.5],target=[0,2.9,.2],fov=46;
    if(!f.drop){
      const walking=f.shot==='walk-in',sitting=f.shot==='sit-down';
      const x=sitting?-2+2*u:walking?-3+u:-3;
      const z=sitting?1.6-.75*u:walking?5.5-3.9*u:5.5;
      this.fly.group.position.set(x,sitting?.85+1.5*u+Math.sin(u*Math.PI)*1.0:.85,z);
      const lean=sitting?-.62*u:0;
      this.fly.group.rotation.set(lean,sitting?Math.PI:walking?Math.atan2(1,-3.9):.25+u*2.64,0,'YXZ');
      this.fly.legs.forEach((leg,i)=>{leg.scale.set(1,1,1);leg.rotation.x=sitting?-.7*u:Math.sin(f.time*11+i*Math.PI/3)*.32*(walking?1:.15);});
      this.fly.wings.forEach((w,i)=>{w.scale.setScalar(sitting?1-.22*u:1);w.rotation.set(0,(i?1:-1)*.52,(i?1:-1)*(.08+(sitting?Math.sin(u*Math.PI)*.5:0)));});
      if(sitting)poseTeslaHands(this.fly,side=>[side*(.9-.4212*u),-.65+1.046*u,1+1.55*u],lean,{elbowHeight:.72,raisedWrist:true});
      else poseTeslaHands(this.fly,side=>[side*.75,-.60,1.05],0);
      camera=f.shot==='check-in'?[.3-u*.3,3.2,9.5-u*.5]:[6,5.2,6.6];
      target=f.shot==='check-in'?[-3,1.15,5.5]:[-.5,2.1,.9];fov=f.shot==='check-in'?43:52;
    }else{
      if(f.shot==='hands'){camera=[2.8-u*.2,4.5,-.9];target=[0,2.8,-1.1];fov=43;}
      if(f.shot==='side'){camera=[6.4-u*.5,4.9,1.6];target=[0,2.7,-.6];fov=48;}
      if(f.shot==='eyes'){camera=[2.8,3.35,-1.7];target=[0,2.85,.1];fov=36;}
      if(f.shot==='over-shoulder'){camera=[3.8-u*.4,5.7,5.8];target=[0,3.6,-1.8];fov=47;}
      if(f.shot==='hero'){camera=[6.8-u*.7,4.4,-1.6];target=[0,2.8,.3];fov=48;}
      this.blue.intensity=18+Math.exp(-u*14)*5;
    }
    this.camera.position.set(...camera);this.camera.lookAt(...target);this.camera.fov=fov;
    this.camera.updateProjectionMatrix();this.renderer.render(this.night.scene,this.camera);
  }
}
