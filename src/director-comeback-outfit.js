import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const up=new T.Vector3(0,1,0),pitchAxis=new T.Vector3(1,0,0);
// The ankle is behind the strap; the tarsus runs underneath it to the open toe.
export const SANDAL_ANKLE=[0,.20,-.20];
export const SANDAL_BOTTOM=0;

export function createComebackOutfit(fly,materials){
  const mat=(color,metalness=0,roughness=.45)=>{const m=new T.MeshStandardMaterial({color,metalness,roughness});materials.add(m);return m;};
  const gold=mat('#d5a64d',.72,.28),leather=mat('#211914',.08,.64),rubber=mat('#111416',.02,.8);
  const welt=mat('#8d6d42',.15,.6),footbed=mat('#483329',.05,.86),limb=mat('#998259',.25,.5),dark=mat('#323126');
  const lens=new T.MeshPhysicalMaterial({color:'#0b1418',metalness:.32,roughness:.18,clearcoat:1,clearcoatRoughness:.12});materials.add(lens);
  const mesh=(geometry,material,parent,pos=[0,0,0])=>{const m=new T.Mesh(geometry,material);m.position.set(...pos);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
  const box=(size,material,parent,pos,radius=.015)=>mesh(new RoundedBoxGeometry(...size,3,radius),material,parent,pos);
  const tube=(points,radius,material,parent)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,radius,6,false),material,parent);
  const accessories=new T.Group();fly.group.add(accessories);
  for(const side of [-1,1]){
    const frame=new T.Group();frame.position.set(side*.28,.18,1.29);frame.rotation.y=side*.16;accessories.add(frame);
    box([.53,.44,.075],gold,frame,[0,0,0],.065);
    box([.475,.382,.081],lens,frame,[0,0,.025],.052);
    tube([[side*.22,.12,0],[side*.27,.1,-.12],[side*.24,.06,-.45]],.021,gold,frame);
    box([.075,.019,.009],gold,frame,[side*.15,.10,.071],.004);
  }
  tube([[-.08,.22,1.34],[0,.245,1.36],[.08,.22,1.34]],.024,gold,accessories);
  for(let i=0;i<23;i++){
    const a=i/22*Math.PI;
    const link=mesh(new T.TorusGeometry(.051,.014,7,12),gold,accessories,[Math.cos(a)*.48,.13-Math.sin(a)*.54,.75+Math.sin(a)*.15]);
    link.scale.y=1.3;link.rotation.y=i%2?.9:-.1;link.rotation.z=Math.cos(a)*.35;
  }
  const pendant=box([.15,.20,.035],gold,accessories,[0,-.49,.94],.025);
  box([.021,.11,.014],dark,pendant,[-.025,0,.022],.003);
  box([.065,.019,.014],dark,pendant,[0,.047,.022],.003);
  box([.05,.019,.014],dark,pendant,[-.007,.006,.022],.003);

  function soleShape(side){
    const s=new T.Shape();s.moveTo(-.12,-.34);s.bezierCurveTo(-.21,-.32,-.19,-.12,-.205,.08);
    s.bezierCurveTo(-.225,.30,-.17,.38,0,.39);s.bezierCurveTo(.17,.38,.22,.30,.205,.08);
    s.bezierCurveTo(.18,-.08,.16+side*.01,-.30,.12,-.34);s.quadraticCurveTo(0,-.39,-.12,-.34);return s;
  }
  function soleLayer(shape,height,depth,scale,material,parent){
    const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.012,bevelThickness:.008,curveSegments:16});
    g.rotateX(Math.PI/2);g.scale(scale,1,scale);return mesh(g,material,parent,[0,height,0]);
  }
  function makeSandal(side){
    const shoe=new T.Group(),shape=soleShape(side);
    soleLayer(shape,.043,.035,1,rubber,shoe);
    soleLayer(shape,.062,.012,.985,welt,shoe);
    soleLayer(shape,.088,.018,.94,footbed,shoe);
    const outline=shape.getSpacedPoints(80);
    const seam=new T.BufferGeometry().setFromPoints(outline.map(p=>new T.Vector3(p.x*.865,.097,p.y*.865)));
    const thread=new T.LineDashedMaterial({color:'#a78c68',dashSize:.018,gapSize:.019});materials.add(thread);
    const stitches=new T.Line(seam,thread);stitches.computeLineDistances();shoe.add(stitches);
    // Hollow curved leather strap, with a visible foot underneath.
    const vertices=[],indices=[],steps=24;
    for(let i=0;i<=steps;i++){
      const a=i/steps*Math.PI,x=Math.cos(a)*.20,y=.10+Math.sin(a)*.16;vertices.push(x,y,-.105,x,y,.10);
      if(i<steps){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
    }
    const strapGeo=new T.BufferGeometry();strapGeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));strapGeo.setIndex(indices);strapGeo.computeVertexNormals();
    const strapMat=leather.clone();strapMat.side=T.DoubleSide;materials.add(strapMat);mesh(strapGeo,strapMat,shoe);
    for(const z of [-.105,.10]){
      const edge=Array.from({length:25},(_,i)=>{const a=i/24*Math.PI;return [Math.cos(a)*.20,.101+Math.sin(a)*.16,z];});
      tube(edge,.008,leather,shoe);tube(edge.map(([x,y,z])=>[x*.96,y+.005,z+(z>0?-.016:.016)]),.0025,welt,shoe);
    }
    // Raised, interlocking serif hardware: the V physically crosses above the L.
    const monogram=new T.Group();monogram.name='interlocking-lv';monogram.position.set(0,.263,0);shoe.add(monogram);
    const letter=(name,points,height)=>{
      const outline=new T.Shape();points.forEach(([x,y],i)=>i?outline.lineTo(x,y):outline.moveTo(x,y));outline.closePath();
      const geometry=new T.ExtrudeGeometry(outline,{depth:.006,bevelEnabled:true,bevelSize:.0012,bevelThickness:.0012,bevelSegments:2,steps:1});
      geometry.rotateX(-Math.PI/2);
      const glyph=mesh(geometry,gold,monogram,[0,height,0]);glyph.name=name;
    };
    letter('L',[
      [-.071,.049],[-.021,.049],[-.023,.040],[-.036,.040],[-.057,-.060],
      [.021,-.060],[.042,-.038],[.035,-.073],[-.092,-.073],[-.090,-.064],
      [-.074,-.064],[-.052,.040],[-.073,.040],
    ],0);
    letter('V',[
      [-.068,.084],[-.011,.084],[-.013,.075],[-.025,.075],[.010,-.009],
      [.062,.075],[.047,.075],[.049,.084],[.094,.084],[.092,.075],[.080,.075],
      [.008,-.040],[-.002,-.040],[-.049,.075],[-.070,.075],
    ],.0085);
    tube([[-.15,.13,-.22],[-.135,.21,-.29],[0,.24,-.325],[.135,.21,-.29],[.15,.13,-.22]],.025,leather,shoe);
    for(const x of [-.151,.151])mesh(new T.SphereGeometry(.016,10,8),gold,shoe,[x,.16,-.24]);
    tube([SANDAL_ANKLE,[0,.15,-.13],[0,.137,.02],[0,.137,.17],[0,.125,.23]],.037,limb,shoe);
    for(const z of [-.1,.015,.14]){const joint=mesh(new T.SphereGeometry(.038,12,8),dark,shoe,[0,.139,z]);joint.scale.set(1,.65,.6);}
    for(const sign of [-1,1])tube([[0,.127,.20],[sign*.038,.126,.255],[sign*.042,.107,.285]],.013,dark,shoe);
    return shoe;
  }
  fly.legs.forEach(leg=>leg.visible=false);
  const feet=[];
  for(const side of [-1,1])for(let row=0;row<3;row++){
    const shoe=makeSandal(side);shoe.name=`sandal-${side}-${row}`;fly.group.add(shoe);
    const segments=Array.from({length:2},()=>mesh(new T.CylinderGeometry(.029,.023,1,10),limb,fly.group));
    const kneeJoint=mesh(new T.SphereGeometry(.042,12,8),dark,fly.group);feet.push({side,row,shoe,segments,kneeJoint});
  }
  return {feet,update(f){
    const unpitch=new T.Quaternion().setFromAxisAngle(pitchAxis,-(f.lean??0));
    const seated=f.shot==='feet-on-desk';
    for(const {side,row,shoe,segments,kneeJoint} of feet){
      const phase=f.time*7+row*Math.PI*.72+(side>0?Math.PI:0),lift=Math.max(0,Math.sin(phase))*.13*f.walk;
      const end=new T.Vector3(side*(1.00+row*.035),-.97+lift,1.08-row*.88);end.z+=Math.cos(phase)*.13*f.walk;
      if(seated){
        const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
        const lift=ease(f.desk/.4),reach=ease((f.desk-.4)/.6);
        const raised=new T.Vector3(side*(.46+row*.47),2.513-f.position[1],2.30-row*.23);
        const tucked=new T.Vector3(side*(.62+row*.25),-.65,.5-row*.12);
        end.copy(tucked).lerp(raised,reach);
        // Clear the desk edge BEFORE extending forward, then settle onto the pad.
        end.y=-.65+lift*(raised.y+.82)-reach*.17;
      }
      const yaw=side*(seated?.10+row*.07:.08);
      shoe.position.copy(end).applyQuaternion(unpitch);shoe.quaternion.copy(unpitch).multiply(new T.Quaternion().setFromAxisAngle(up,yaw));
      const start=new T.Vector3(side*.30,-.12,.53-row*.47);
      const knee=new T.Vector3(side*(seated?.77+row*.25:.66),seated?.32:-.32,.68-row*.42+(seated?f.desk*.45:0)).applyQuaternion(unpitch);
      const ankle=new T.Vector3(...SANDAL_ANKLE).applyQuaternion(shoe.quaternion).add(shoe.position);
      const points=[start,knee,ankle];kneeJoint.position.copy(knee);
      segments.forEach((segment,i)=>{const d=points[i+1].clone().sub(points[i]);segment.position.copy(points[i]).add(points[i+1]).multiplyScalar(.5);segment.scale.y=d.length();segment.quaternion.setFromUnitVectors(up,d.normalize());});
    }
    accessories.rotation.z=Math.sin(f.time*3)*.012*f.walk;
  }};
}
