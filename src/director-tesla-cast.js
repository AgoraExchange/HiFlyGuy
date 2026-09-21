import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createFly} from './scene.js';

export function teslaBuilders(materials){
  const mat=(color,metalness=0,roughness=.5)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});materials.add(m);return m;};
  const mesh=(geo,material,parent,at=[0,0,0])=>{const m=new T.Mesh(geo,material);m.position.set(...at);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
  const box=(size,at,material,parent,r=.03)=>mesh(new RoundedBoxGeometry(...size,3,r),material,parent,at);
  const rod=(a,b,r,material,parent)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start);const m=mesh(new T.CylinderGeometry(r,r,d.length(),12),material,parent,start.add(end).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;};
  return {mat,mesh,box,rod};
}
export function dressTeslaFly(fly,materials,girl=false,index=0){
  const {mat,mesh,box,rod}=teslaBuilders(materials),gold=mat('#c9a65c',.7,.3),black=mat('#0c141a',.4,.24);
  if(girl){
    const accent=mat(index?'#7fc9c5':'#b791d4',.4,.36);
    for(const side of [-1,1]){
      const hoop=mesh(new T.TorusGeometry(.10,.018,8,20),gold,fly.group,[side*.50,-.08,.96]);hoop.rotation.y=side*.3;
      for(let i=0;i<3;i++)rod([side*(.24+i*.085),.38,1.12],[side*(.26+i*.115),.51+i*.02,1.18],.013,black,fly.group);
      const gem=mesh(new T.OctahedronGeometry(.065),accent,fly.group,[side*.5,-.21,.96]);gem.rotation.z=.3;
    }
    fly.wings.forEach(wing=>wing.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.set(index?'#a3e4de':'#d4b7ee');o.material.opacity=.43;materials.add(o.material);}}));
    const necklace=mesh(new T.TorusGeometry(.38,.018,8,36),gold,fly.group,[0,-.06,.74]);necklace.scale.y=.65;
  }else{
    for(const side of [-1,1]){box([.50,.34,.07],[side*.27,.20,1.31],gold,fly.group,.04);box([.445,.29,.078],[side*.27,.20,1.34],black,fly.group,.035);rod([side*.49,.29,1.28],[side*.47,.26,.86],.02,gold,fly.group);}
    rod([-.08,.23,1.35],[.08,.23,1.35],.02,gold,fly.group);
    for(let i=0;i<20;i++){const a=i/19*Math.PI;const link=mesh(new T.TorusGeometry(.048,.014,6,12),gold,fly.group,[Math.cos(a)*.46,.08-Math.sin(a)*.48,.79+Math.sin(a)*.1]);link.rotation.y=i%2?.8:0;}
  }
}
export function createTeslaGirls(materials){
  return [0,1].map(i=>{const fly=createFly();dressTeslaFly(fly,materials,true,i);fly.group.scale.setScalar(.86);return fly;});
}
export function createTeslaScooter(materials){
  const {mat,mesh,box,rod}=teslaBuilders(materials),group=new T.Group();
  const dark=mat('#101b24',.65,.3),rubber=mat('#0b0e11',0,.92),metal=mat('#91a0ac',.8,.25);
  const cyan=new T.MeshBasicMaterial({color:'#66e4dd'});materials.add(cyan);
  box([1.55,.12,2.65],[0,.43,-.1],dark,group,.06);
  box([1.34,.017,2.3],[0,.502,-.16],rubber,group,.05);
  for(const side of [-1,1])box([.028,.025,2.4],[side*.74,.43,-.1],cyan,group,.01);
  const wheels=[];
  for(const z of [-1.28,1.27]){
    const wheel=new T.Group();wheel.position.set(0,.30,z);group.add(wheel);wheels.push(wheel);
    const tire=mesh(new T.CylinderGeometry(.30,.30,.19,32),rubber,wheel);tire.rotation.z=Math.PI/2;
    for(const side of [-1,1]){const hub=mesh(new T.TorusGeometry(.17,.025,8,24),metal,wheel,[side*.103,0,0]);hub.rotation.y=Math.PI/2;}
  }
  rod([0,.35,1.27],[0,2.05,1.12],.075,dark,group);rod([-.72,2.05,1.12],[.72,2.05,1.12],.055,metal,group);
  for(const side of [-1,1])rod([side*.47,2.05,1.12],[side*.78,2.05,1.12],.079,rubber,group);
  box([.25,.14,.06],[0,2.09,1.10],dark,group,.03);box([.19,.08,.015],[0,2.1,1.065],cyan,group,.012);
  mesh(new T.SphereGeometry(.06,12,8),cyan,group,[0,1.3,1.24]);
  return {group,wheels};
}

// Target positions use the fly's heading-space coordinates; compensate body lean.
export function poseTeslaHands(fly,targets,lean=0,{elbowHeight=.15,raisedWrist=false}={}){
  const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-lean),axis=new T.Vector3(0,1,0);
  fly.forelegs.forEach(leg=>{
    const desired=targets(leg.side),end=new T.Vector3(...desired).applyQuaternion(q).sub(leg.root.position);
    const knee=new T.Vector3(leg.side*.58,elbowHeight,Math.max(.75,desired[2]*.55)).applyQuaternion(q).sub(leg.root.position);
    const wristOffset=new T.Vector3(0,raisedWrist?.14:.09,raisedWrist?-.18:-.13);
    if(raisedWrist)wristOffset.applyQuaternion(q);
    const wrist=end.clone().add(wristOffset);const points=[new T.Vector3(),knee,wrist,end];
    leg.root.rotation.set(0,0,0);leg.joint.position.copy(knee);
    leg.segments.forEach((segment,i)=>{const d=points[i+1].clone().sub(points[i]);segment.position.copy(points[i]).add(points[i+1]).multiplyScalar(.5);segment.scale.y=d.length();segment.quaternion.setFromUnitVectors(axis,d.normalize());});
  });
}
