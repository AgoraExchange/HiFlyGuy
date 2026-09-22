import * as T from 'three';
import {TeslaStage} from './director-tesla-stage.js';
import {createFly,animateFly} from './scene.js';
import {dressTeslaFly,poseTeslaHands} from './director-tesla-cast.js';
import {OPPONENT_DURATION,sampleOpponentTake} from './director-opponent-timeline.js';

// Isolated cinematic scene: never changes the saved simulation or portfolio.
export class OpponentStage extends TeslaStage{
  constructor(host){
    super(host);
    this.double=this.fly;this.fly=createFly();this.night.scene.add(this.fly.group);
    const original=new Set(this.fly.group.children);dressTeslaFly(this.fly,this.materials);
    this.accessories=this.fly.group.children.filter(child=>!original.has(child));
    this.rival=new T.Group();this.rival.position.set(4.3,0,5.4);this.night.scene.add(this.rival);
    this.rivalChair=this.night.chair.clone(true);this.rivalChair.position.set(0,0,0);this.rival.add(this.rivalChair,this.double.group);
    this.reflectionFly=createFly();dressTeslaFly(this.reflectionFly,this.materials);
    this.mirrorScene=new T.Scene();this.mirrorScene.background=new T.Color('#020608');this.mirrorScene.add(this.reflectionFly.group);
    this.mirrorScene.add(new T.HemisphereLight('#a7c8c5','#111821',2));
    const mirrorLight=new T.DirectionalLight('#9ce8d0',4);mirrorLight.position.set(2,3,4);this.mirrorScene.add(mirrorLight);
    this.mirrorCamera=new T.PerspectiveCamera(35,4.28/2.675,.1,30);this.mirrorCamera.position.set(0,1,6);this.mirrorCamera.lookAt(0,.3,.4);
    this.mirrorTarget=new T.WebGLRenderTarget(856,535);
    this.mirrorMaterial=new T.MeshBasicMaterial({map:this.mirrorTarget.texture,color:'#8aa9a4',toneMapped:false});this.materials.add(this.mirrorMaterial);
    this.chartCanvas=document.createElement('canvas');this.chartCanvas.width=1280;this.chartCanvas.height=800;
    this.chartTexture=new T.CanvasTexture(this.chartCanvas);this.chartTexture.colorSpace=T.SRGBColorSpace;
    this.chartMaterial=new T.MeshBasicMaterial({map:this.chartTexture,toneMapped:false});this.materials.add(this.chartMaterial);
    this.overlay.classList.add('opponent-overlay');this.overlay.querySelector('.tesla-brand').innerHTML='FLY GUY<span>THE OPPONENT</span>';
    this.renderer.domElement.setAttribute('aria-label','The Opponent: Fly Guy faces his future self');
  }
  get duration(){return OPPONENT_DURATION;}
  drawChart(f){
    if(this.chartFuture===f.future)return;this.chartFuture=f.future;
    const c=this.chartCanvas.getContext('2d'),green=f.future,color=green?'#9be7c1':'#ee777f';
    c.fillStyle='#071014';c.fillRect(0,0,1280,800);
    c.fillStyle='#81949a';c.font='22px monospace';c.fillText('FLY GUY  /  NIGHT TERMINAL',55,60);
    c.fillStyle=color;c.font='bold 38px monospace';c.fillText(green?'CONTROL THE REACTION.':'SAME MARKET. DIFFERENT MIND.',55,134);
    c.fillStyle='#60747b';c.font='20px monospace';c.fillText('BTC / USD     15m     EMA 20 / 50',55,184);
    c.strokeStyle='#1b2b32';c.lineWidth=1;
    for(let y=250;y<700;y+=75){c.beginPath();c.moveTo(55,y);c.lineTo(1225,y);c.stroke();}
    const prices=Array.from({length:38},(_,i)=>370+(green?-1:1)*i*6+Math.sin(i*1.8)*32);
    prices.forEach((y,i)=>{const x=70+i*30,close=y+Math.sin(i*2.7+1)*34;
      c.strokeStyle=c.fillStyle=close<y?'#76c6aa':'#cf6773';c.lineWidth=2;c.beginPath();c.moveTo(x,Math.min(y,close)-17);c.lineTo(x,Math.max(y,close)+17);c.stroke();c.fillRect(x-8,Math.min(y,close),16,Math.max(3,Math.abs(close-y)));});
    c.strokeStyle=color;c.lineWidth=3;c.beginPath();prices.forEach((y,i)=>i?c.lineTo(70+i*30,y+13):c.moveTo(70,y+13));c.stroke();
    c.fillStyle=color;c.font='25px monospace';c.fillText(green?'PLAN > WAIT > EXECUTE':'CHASE > PANIC > REPEAT',55,725);
    c.fillStyle='#586c73';c.font='16px monospace';c.fillText('DIRECTOR SESSION / FICTIONAL CHART',55,770);this.chartTexture.needsUpdate=true;
  }
  render(time){
    const f=sampleOpponentTake(time),t=f.freeze?3:f.time;
    this.host.dataset.shot=f.shot;this.host.dataset.phase=f.time<7?'story':f.time<11?'montage':'reveal';
    this.host.dataset.opponent=String(f.opponent);this.host.dataset.transformed=String(f.transformed);
    this.caption.textContent=f.caption;this.terminal.insert.hidden=true;this.scooter.group.visible=false;
    this.girls.forEach(g=>g.group.visible=false);this.fly.group.visible=true;this.accessories.forEach(o=>o.visible=f.future);
    Object.assign(this.actor,{time:t,speed:0,state:'Exploring',y:2.35});animateFly(this.fly,this.actor);
    this.renderNight({time:t,shot:'opponent',u:f.u,typing:true,wallet:false,smoke:false,lighting:0,drop:false});
    this.fly.lifeProps.cigarette.visible=this.fly.lifeProps.smoke.visible=false;this.lighter.visible=false;
    const tapTime=f.future?t*.65:t*1.7;
    poseTeslaHands(this.fly,side=>[side*.4788,.396+Math.max(0,Math.sin(tapTime*18+side*2))*(f.future?.045:.075),2.55],-.62,{elbowHeight:.72,raisedWrist:true});
    this.double.group.visible=f.opponent;this.rival.rotation.y=f.opponent?Math.PI*(1-f.u):0;
    this.double.group.position.set(0,2.35,-.8);this.double.group.rotation.set(-.45,Math.PI,0,'YXZ');
    this.double.lifeProps.cigarette.visible=this.double.lifeProps.smoke.visible=false;
    this.double.wings.forEach((w,i)=>{w.rotation.set(0,(i?1:-1)*.52,(i?1:-1)*.04);w.scale.setScalar(.78);});
    this.double.legs.forEach((leg,i)=>{if(i%3!==0){leg.rotation.x=-.7;leg.scale.x=.68;}});
    poseTeslaHands(this.double,side=>[side*.85,-.35,.7],-.45);
    this.blue.color.set(f.future?'#72dab1':'#ef405e');this.blue.intensity=f.future?20:26;
    this.night.key.color.set(f.future?'#c5e3db':'#929fb6');this.night.key.intensity=f.opponent?1.6:1.05;
    this.drawChart(f);this.screen.material=f.reflection?this.mirrorMaterial:this.chartMaterial;
    if(f.reflection){
      const reflection=this.reflectionFly;
      reflection.wings.forEach((w,i)=>{w.rotation.set(0,(i?1:-1)*.6,(i?1:-1)*.04);w.scale.setScalar(.7);});
      reflection.group.position.set(0,0,0);reflection.group.rotation.set(-.12,Math.sin(f.u*Math.PI)*.3,0);
      reflection.lifeProps.cigarette.visible=reflection.lifeProps.smoke.visible=false;
      poseTeslaHands(reflection,side=>side<0?[-.5,.1+f.u*.65,1.2]:[.55,-.4,1],-.12);
      this.renderer.setRenderTarget(this.mirrorTarget);this.renderer.render(this.mirrorScene,this.mirrorCamera);this.renderer.setRenderTarget(null);
    }
    let camera=[5.8-f.u*.8,5.5,6.5-f.u],target=[0,3,-1],fov=48;
    if(f.reflection){camera=[1.1-f.u*.65,4.15,2.0-f.u*.35];target=[0,4.12,-2.36];fov=43;}
    if(f.opponent){camera=[7.8-f.u*.4,4.6,-1.6];target=[4.3,2.5,4.7];fov=51;this.fly.group.rotation.y=Math.PI-f.u*1.8;}
    if(f.shot.endsWith('eyes')){camera=[2.2,3.7,-1.4];target=[0,3,.2];fov=35;}
    if(f.shot.endsWith('hands')){camera=[3.3,4.9,-.7];target=[0,2.8,-1.65];fov=48;}
    if(f.shot.endsWith('chart')){camera=[.15,4.14,2.0];target=[0,4.12,-2.36];fov=43;}
    if(f.shot==='empty-chair'){camera=[15,10,0];target=[2.4,2.2,3.0];fov=68;}
    if(f.shot==='become'){
      camera=[4.9-f.u*.7,4.2,-1.6];target=[0,2.9,.25];fov=45;
      this.fly.group.rotation.y=Math.PI-.7*(1-f.u);
    }
    this.camera.position.set(...camera);this.camera.lookAt(...target);this.camera.fov=fov;this.camera.updateProjectionMatrix();
    this.renderer.render(this.night.scene,this.camera);
  }
  dispose(){
    this.mirrorTarget.dispose();this.chartTexture.dispose();
    this.mirrorScene.traverse(o=>{o.geometry?.dispose();if(o.material)this.materials.add(o.material);});
    super.dispose();
  }
}
