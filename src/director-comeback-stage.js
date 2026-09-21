import * as T from 'three';
import { DirectorStage } from './director-stage.js';
import { LabStage } from './director-lab-stage.js';
import { animateFly } from './scene.js';
import { sampleComebackTake, smooth } from './director-comeback-timeline.js';
import { createComebackDesk } from './director-comeback-desk.js';
import { createComebackOutfit } from './director-comeback-outfit.js';

export class ComebackStage {
  constructor(host){
    this.host=host;host.classList.remove('wallet-insert');
    this.labHost=document.createElement('div');this.suiteHost=document.createElement('div');
    for(const el of [this.labHost,this.suiteHost]){el.className='comeback-stage';host.append(el);}
    // Keep both sets ready so the transformation is an immediate camera cut.
    this.lab=new LabStage(this.labHost);this.suite=new DirectorStage(this.suiteHost);
    this.lab.overlay.hidden=true;
    this.outfit=createComebackOutfit(this.suite.fly,this.suite.materials);
    this.suite.renderer.domElement.setAttribute('aria-label','Fly Guy comeback: sunglasses, gold chain and six sandals');
    this.deskSet=createComebackDesk(this.suite.materials);
    this.suite.css.domElement.hidden=true;this.suite.iframe.src='about:blank';
    this.overlay=document.createElement('div');this.overlay.className='comeback-overlay';
    this.overlay.innerHTML='<div class="comeback-header">FLY GUY<span>THE COMEBACK</span></div><div class="comeback-profit"><small>TRADE CLOSED</small><strong>+$4,800.00</strong><span>PROFIT TARGET HIT / ACCESS RESTORED</span></div><div class="comeback-caption"><h2></h2><p></p></div>';
    host.append(this.overlay);this.title=this.overlay.querySelector('h2');this.detail=this.overlay.querySelector('p');
    this.resize();
  }
  resize(){this.lab.resize();this.suite.resize();}
  render(time){
    const f=sampleComebackTake(time);this.host.dataset.shot=f.shot;this.overlay.dataset.shot=f.shot;
    this.title.textContent=f.caption;this.detail.textContent=f.detail;
    const changed=this.labHost.hidden!==!f.lab;
    this.labHost.hidden=!f.lab;this.suiteHost.hidden=f.lab;if(changed)this.resize();
    if(f.lab){
      this.lab.render(24);this.lab.fly.group.rotation.set(.28*(1-(f.profit?smooth((f.time-2)/1.2):0)),0,.28*(f.profit?1-smooth((f.time-2)/1.2):1));
      this.lab.camera.position.set(1.8,3.4,8-f.time*.25);this.lab.camera.lookAt(0,1.8,0);
      this.lab.electric.color.set('#82ff9a');this.lab.electric.intensity=f.profit?28:0;
      this.lab.renderer.render(this.lab.scene,this.lab.camera);
    }else{
      const s=this.suite;
      s.doors.forEach((door,i)=>door.position.x=-9+(i?1:-1)*(1.55+f.door*3.15));
      Object.assign(s.actor,{time:f.time,y:f.position[1],speed:0,state:'Exploring'});animateFly(s.fly,s.actor);
      const seated=f.shot==='feet-on-desk',scene=seated?this.deskSet.scene:s.scene;
      if(s.fly.group.parent!==scene)scene.add(s.fly.group);
      s.fly.group.position.set(...f.position);s.fly.group.rotation.set(f.lean,f.heading,0,'YXZ');
      s.fly.wings.forEach((wing,i)=>{
        wing.rotation.z=(i?1:-1)*(.055+Math.sin(f.time*5)*.025*f.walk);
        wing.rotation.y=seated?(i?1:-1)*.55:0;wing.scale.setScalar(seated?.82:1);
      });
      this.outfit.update(f);
      s.camera.position.set(...f.camera);s.camera.fov=f.fov;s.camera.lookAt(...f.target);s.camera.updateProjectionMatrix();
      s.renderer.render(scene,s.camera);
    }
  }
  dispose(){
    this.suite.scene.add(this.suite.fly.group);this.deskSet.dispose();
    this.lab.dispose();this.suite.dispose();this.host.replaceChildren();
  }
}
