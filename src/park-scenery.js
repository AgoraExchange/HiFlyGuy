import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PARK_PERCHES, PARK_TREES, PARK_SLIDES } from './park-layout.js';

const v = (x, y, z) => new T.Vector3(x, y, z);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function groundTexture(paving) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const ctx = c.getContext('2d');
  ctx.fillStyle = paving ? '#57564f' : '#c2ae86'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 13000; i++) { const n = hash(i); ctx.fillStyle = `rgba(${n > .5 ? '245,230,194' : '36,31,25'},${paving ? .07 : .12})`; ctx.fillRect(hash(i + 1) * 512, hash(i + 2) * 512, 1 + n * 2, 1 + n * 2); }
  if (paving) for (let row = 0; row < 20; row++) for (let col = -1; col < 12; col++) {
    const x = col * 48 + row % 2 * 24, y = row * 27;
    ctx.strokeStyle = '#353834'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 46, 25);
    ctx.fillStyle = `rgba(230,219,190,${hash(row * 51 + col) * .12})`; ctx.fillRect(x + 2, y + 2, 42, 21);
  }
  const texture = new T.CanvasTexture(c); texture.colorSpace = T.SRGBColorSpace; texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.repeat.set(paving ? 11 : 7, paving ? 10 : 7); texture.anisotropy = 4; return texture;
}

export function buildPark(root, surfaces, halos) {
  const g = new T.Group(); root.add(g); const colliders = [], swings = [];
  const mat = (color, metalness = 0, roughness = .85) => new T.MeshStandardMaterial({ color, metalness, roughness });
  const timber = mat('#a98555'), endgrain = mat('#c9aa75'), darkwood = mat('#766044'), iron = mat('#514d40', .45), rope = mat('#b4a17a'), stone = mat('#777b74'), sand = mat('#e5d3ab'), paving = mat('#b0aea2');
  paving.map = groundTexture(true); sand.map = groundTexture(false);
  const foliage = mat('#73806a'), blossom = mat('#ddd5b8'), soil = mat('#514738'), grass = mat('#a18f62'), slideMetal = mat('#afb7b1', .72, .27);
  const slides = [], stairs = [];
  const glow = new T.MeshBasicMaterial({ color: '#ffe2a6' });
  function mesh(geometry, material, pos, parent = g) { const m = new T.Mesh(geometry, material); m.position.set(...pos); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
  const box = (size, pos, material = timber, parent) => mesh(new T.BoxGeometry(...size), material, pos, parent);
  const cylinder = (radius, height, pos, material = timber, count = 16, parent) => mesh(new T.CylinderGeometry(radius, radius, height, count), material, pos, parent);
  function rod(a, b, radius = .08, material = timber, parent = g, tip = radius) {
    const start = v(...a), end = v(...b), d = end.clone().sub(start);
    const m = mesh(new T.CylinderGeometry(tip, radius, d.length(), 7), material, start.add(end).multiplyScalar(.5).toArray(), parent);
    m.quaternion.setFromUnitVectors(v(0, 1, 0), d.normalize()); return m;
  }
  function obstruction(x, z, radius, height, base = 0) { colliders.push({ x, z, radius, height, base }); }
  function curveTube(points, radius, material, parent = g) { return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => v(...p))), 64, radius, 7, false), material, [0, 0, 0], parent); }
  function disk(x, z, radius, height, material) { return cylinder(radius, height, [x, height / 2, z], material, 40); }
  box([82, .8, 74], [0, -.5, 0], stone);
  box([80, .12, 72], [0, -.05, 0], paving);
  // Three soft-edged sand gardens surrounded by a continuous paved promenade.
  const gardens = [
    [[-31,-9],[-29,-25],[-16,-30],[5,-29],[24,-23],[30,-10],[24,-2],[10,-2],[-6,-7],[-20,-3]],
    [[-8,9],[0,4],[13,0],[28,4],[30,17],[20,29],[3,31],[-8,23]],
    [[-31,11],[-26,7],[-17,10],[-12,20],[-18,29],[-31,26],[-35,18]],
  ];
  for (const [index, polygon] of gardens.entries()) {
    const curve = new T.CatmullRomCurve3(polygon.map(([x,z]) => v(x, .02, z)), true, 'catmullrom', .3);
    const points = curve.getPoints(180), shape = new T.Shape(points.map(p => new T.Vector2(p.x, -p.z)));
    const surface = mesh(new T.ShapeGeometry(shape), sand, [0,.035,0]); surface.rotation.x = -Math.PI/2; surface.castShadow = false;
    // UVs use world coordinates for continuous fine sand grain.
    const uv = surface.geometry.attributes.uv; for (let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)/30, uv.getY(i)/30);
    curveTube(points.map(p => [p.x,.09,p.z]), .10, endgrain);
    for (let i = 0; i < points.length - 1; i += 5) {
      const p = points[i], next = points[Math.min(i+5,points.length-1)];
      // Several generous gates make the courts walkable from the central paths.
      if (Math.hypot(p.x,p.z) < 14 || i % 45 < 10 || index === 2) continue;
      rod([p.x,.05,p.z],[p.x,1.25,p.z],.055,iron); rod([p.x,1.15,p.z],[next.x,1.15,next.z],.045,iron);
      obstruction(p.x,p.z,.12,1.3);
      for (let j=1;j<=3;j++) obstruction(T.MathUtils.lerp(p.x,next.x,j/4),T.MathUtils.lerp(p.z,next.z,j/4),.3,1.2);
    }
  }
  // Warm timber benches and lamps wrap the perimeter, as in the model reference.
  function bench(x,z,rotation) {
    const b = new T.Group(); b.position.set(x,0,z); b.rotation.y=rotation;g.add(b);
    for(let i=0;i<4;i++) box([3.8,.14,.22],[0,.93,-.35+i*.25],timber,b);
    for(let i=0;i<3;i++) box([3.8,.23,.13],[0,1.35+i*.28,-.53],timber,b);
    for(const side of [-1,1]) { box([.12,1.15,1.05],[side*1.4,.56,0],iron,b); rod([side*1.4,.9,-.53],[side*1.4,2.05,-.53],.06,iron,b); }
    obstruction(x,z,1.85,2.1);
  }
  function lamp(x,z) {
    cylinder(.3,.18,[x,.09,z],stone);rod([x,0,z],[x,5.1,z],.075,iron);rod([x,5.1,z],[x+.6,5.3,z],.055,iron);
    box([.9,.1,.48],[x+.6,5.28,z],iron);box([.73,.055,.35],[x+.6,5.20,z],glow);
    obstruction(x,z,.17,5.2);
    const pool = mesh(new T.CircleGeometry(3.5,32),new T.MeshBasicMaterial({color:'#edbd73',transparent:true,opacity:.08,depthWrite:false}),[x,.07,z]);pool.rotation.x=-Math.PI/2;pool.castShadow=false;
  }
  for (const x of [-32,-20,-8,4,16,28]) { bench(x,-33,0); lamp(x+4,-32); bench(x,33,Math.PI);lamp(x-4,32); }
  for (const z of [-22,-7,8,23]) {bench(-37,z,Math.PI/2);bench(37,z,-Math.PI/2);lamp(-36,z+5);lamp(36,z-5);}
  for (const [x,z] of [[-32,29],[-32,-30],[32,28],[32,-28]]) { cylinder(.48,1.1,[x,.55,z],iron);cylinder(.54,.12,[x,1.14,z],darkwood); }
  // The old training pads become real timber stepping stumps; other targets are built-in objects.
  for (const [index,p] of PARK_PERCHES.entries()) {
    if (p.kind === 'stump') {
      disk(p.x,p.z,p.radius,p.height,darkwood); cylinder(p.radius,.07,[p.x,p.height-.035,p.z],endgrain,40);
      for (let i=0;i<4;i++) {const ring=mesh(new T.TorusGeometry(.25+i*.3,.012,4,40),darkwood,[p.x,p.height+.008,p.z]);ring.rotation.x=Math.PI/2;}
    } else if (p.kind === 'tower' || p.kind === 'slideTower') {
      disk(p.x,p.z,p.radius,p.height,darkwood);
      cylinder(p.radius,.12,[p.x,p.height-.06,p.z],endgrain,40);
      for(let i=0;i<18;i++) {const a=i/18*Math.PI*2,x=p.x+Math.cos(a)*p.radius,z=p.z+Math.sin(a)*p.radius;
        if(i>3&&i<8)continue;rod([x,0,z],[x,p.height+1.5,z],.08,timber);
        const b=(i+1)/18*Math.PI*2;rod([x,p.height+1.3,z],[p.x+Math.cos(b)*p.radius,p.height+1.3,p.z+Math.sin(b)*p.radius],.055,rope);
      }
      // A curved open stainless slide, with two rounded edge rails.
      const slideDef = PARK_SLIDES.find(s => s.top.x === p.x && s.top.z === p.z + p.radius);
      const path = new T.CatmullRomCurve3(slideDef ? [v(slideDef.top.x,slideDef.top.y,slideDef.top.z),v(-17.4,2.6,-10.1),v(-15.2,1.4,-8.6),v(slideDef.bottom.x,slideDef.bottom.y,slideDef.bottom.z)] : [v(p.x,p.height+.08,p.z+p.radius),v(p.x+.6,p.height-.5,p.z+4),v(p.x+3,.3,p.z+6),v(p.x+5,.22,p.z+6)]);
      if (slideDef) slides.push({ ...slideDef, path });
      const positions=[],normals=[],uvs=[],indices=[];
      for(let j=0;j<=48;j++) {const center=path.getPoint(j/48), tangent=path.getTangent(j/48), side=v(-tangent.z,0,tangent.x).normalize();
        for(let k=0;k<=12;k++) {const a=-Math.PI/2+k/12*Math.PI,point=center.clone().addScaledVector(side,Math.sin(a)*.85);point.y+=.75*(1-Math.cos(a));positions.push(...point.toArray());normals.push(0,1,0);uvs.push(k/12,j/48);if(j<48&&k<12){const n=j*13+k;indices.push(n,n+13,n+1,n+1,n+13,n+14);}}
      }
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
      const slide=mesh(geometry,slideMetal,[0,0,0]);slide.material.side=T.DoubleSide;
      for(const sign of [-1,1]) {const points=[];for(let j=0;j<=24;j++){const c=path.getPoint(j/24),t=path.getTangent(j/24);c.addScaledVector(v(-t.z,0,t.x).normalize(),sign*.85);c.y+=.75;points.push(c.toArray());}curveTube(points,.055,slideMetal);}
      for(let i=0;i<8;i++){const z=p.z-p.radius-2.4+i*.3,y=i*p.height/8;box([1.7,.16,.34],[p.x,y+.08,z],timber);}
      if (slideDef) {
        const st = slideDef.stairs; stairs.push(st);
        for (let i=0;i<10;i++) { const y=st.topY*i/10, z=st.z + i*.32; box([2.2,.16,.48],[st.x,y+.08,z],endgrain); }
        for (const side of [-1,1]) { rod([st.x+side*1.02,0,st.z-.25],[st.x+side*1.02,st.topY,st.z+2.8],.06,iron); }
      }
    } else if (p.kind === 'table') {
      box([4,.2,2.5],[p.x,p.height-.1,p.z],timber);
      for(const side of [-1,1]) {box([4.4,.16,.6],[p.x,.72,p.z+side*1.7],endgrain);rod([p.x-1.4,0,p.z+side*1.5],[p.x-1.4,p.height,p.z],.12,darkwood);rod([p.x+1.4,0,p.z+side*1.5],[p.x+1.4,p.height,p.z],.12,darkwood);}
    } else if (p.kind === 'rock') {const b=mesh(new T.DodecahedronGeometry(1,1),stone,[p.x,p.height/2,p.z]);b.scale.set(p.radius,p.height/2,p.radius);cylinder(p.radius*.8,.12,[p.x,p.height-.06,p.z],stone,12);}
    if(p.kind!=='deck')obstruction(p.x,p.z,p.radius,p.height);
    const surface=mesh(new T.CircleGeometry(p.radius,40),new T.MeshStandardMaterial({color:p.color,transparent:true,opacity:.14,depthWrite:false,roughness:.9}),[p.x,p.height+.014,p.z],root);surface.rotation.x=-Math.PI/2;surface.userData.perch=index;surface.castShadow=false;surfaces.push(surface);
    const halo=mesh(new T.RingGeometry(p.radius+.08,p.radius+.11,48),new T.MeshBasicMaterial({color:p.color,transparent:true,opacity:.15,side:T.DoubleSide,depthWrite:false}),[p.x,p.height+.022,p.z],root);halo.rotation.x=-Math.PI/2;halos.push(halo);
  }
  // Slatted round planters, twisting trees, and a gently curved timber bridge.
  for (const [index,p] of PARK_TREES.entries()) {
    disk(p.x,p.z,p.radius,p.height,timber);cylinder(p.radius-.2,.08,[p.x,p.height+.01,p.z],soil,40);
    for(let i=0;i<42;i++){const a=i/42*Math.PI*2;rod([p.x+Math.cos(a)*p.radius,.08,p.z+Math.sin(a)*p.radius],[p.x+Math.cos(a)*p.radius,p.height+.2,p.z+Math.sin(a)*p.radius],.07,darkwood);}
    obstruction(p.x,p.z,p.radius,p.height); obstruction(p.x,p.z,.5,11);
    const trunk=[[p.x,p.height,p.z],[p.x-.4,p.height+2,p.z+.25],[p.x+.3,p.height+4.5,p.z],[p.x-.1,p.height+7.7,p.z-.3]];
    for(let j=0;j<3;j++)rod(trunk[j],trunk[j+1],.36-j*.085,darkwood,g,.27-j*.08);
    for(let j=0;j<16;j++) {
      const a=j*2.4+index, level=p.height+3+j%4, length=1.7+hash(j+index*100)*2.8;
      const start=[p.x,level,p.z],mid=[p.x+Math.cos(a)*length*.6,level+1,p.z+Math.sin(a)*length*.6],end=[p.x+Math.cos(a)*length,level+2.1,p.z+Math.sin(a)*length];
      rod(start,mid,.1,darkwood,g,.055);rod(mid,end,.05,darkwood,g,.018);
      for(let k=0;k<3;k++){const twig=[end[0]+Math.cos(a+k)*.65,end[1]+.4+k*.2,end[2]+Math.sin(a+k)*.65];rod(mid,twig,.025,darkwood);if((j+k)%3===0){const bloom=mesh(new T.IcosahedronGeometry(.22,0),blossom,twig);bloom.scale.set(1.5,.7,1);}}
    }
  }
  const bridge=new T.CatmullRomCurve3([v(8,1.5,-19),v(13,2,-18),v(18,2.1,-14),v(19,2.1,-11.5)]);
  for(let i=0;i<35;i++){const t=i/34,p=bridge.getPoint(t),d=bridge.getTangent(t);const plank=box([2.1,.12,.38],p.toArray(),endgrain);plank.rotation.y=Math.atan2(d.x,d.z);}
  for(const sign of [-1,1]) {const points=[];for(let i=0;i<=12;i++){const p=bridge.getPoint(i/12),d=bridge.getTangent(i/12),side=v(-d.z,0,d.x).multiplyScalar(sign*1.1);p.add(side);rod(p.toArray(),[p.x,p.y+1.15,p.z],.055,iron);points.push([p.x,p.y+1.15,p.z]);}curveTube(points,.055,rope);}
  // A-frame swings, a rope climbing pyramid, balance logs and natural play pieces.
  for(const x of [1,22]) {
    const z=x===1?-16:7;
    for(const side of [-1,1]) {rod([x+side*3.4,0,z-1.8],[x+side*3.4,4.6,z],.15,timber);rod([x+side*3.4,0,z+1.8],[x+side*3.4,4.6,z],.15,timber);obstruction(x+side*3.4,z,1.4,4.6);}
    rod([x-3.6,4.6,z],[x+3.6,4.6,z],.17,timber);
    for(const side of [-1,1]) {const swing=new T.Group();swing.position.set(x+side*1.4,4.4,z);root.add(swing);rod([-.5,0,0],[-.5,-3.5,0],.025,rope,swing);rod([.5,0,0],[.5,-3.5,0],.025,rope,swing);box([1.4,.12,.65],[0,-3.5,0],darkwood,swing);swings.push(swing);}
  }
  const peak=[-1,6.2,19];for(let side=0;side<3;side++) {
    const a=side/3*Math.PI*2,b=(side+1)/3*Math.PI*2,foot=[-1+Math.cos(a)*4.5,0,19+Math.sin(a)*4.5],other=[-1+Math.cos(b)*4.5,0,19+Math.sin(b)*4.5];rod(foot,peak,.15,timber);obstruction(foot[0],foot[2],.25,6);
    for(let j=1;j<8;j++){const t=j/8,start=foot.map((n,i)=>n+(peak[i]-n)*t),end=other.map((n,i)=>n+(peak[i]-n)*t);rod(start,end,.026,rope);rod(foot.map((n,i)=>n+(other[i]-n)*t),peak,.024,rope);}
  }
  for(const [cx,cz] of [[-24,18],[10,23],[-25,-10]])for(let i=0;i<7;i++) {
    const a=hash(i+cx)*6.28,x=cx+(hash(i+cz)-.5)*7,z=cz+(hash(i+90)-.5)*6,length=2+hash(i+5)*3;
    rod([x,.35,z],[x+Math.cos(a)*length,.6,z+Math.sin(a)*length],.22,timber);obstruction(x,z,.5,.7);
    cylinder(.25,.13,[x,.65,z],endgrain,10);
  }
  // Reeds and small stones add scale without hundreds of draw calls after batching.
  for(let i=0;i<420;i++) {
    const x=-31+hash(i+400)*17,z=10+hash(i+900)*17;
    if(Math.hypot(x+23,z-18)<4)continue;
    const height=.3+hash(i)*.85;rod([x,.08,z],[x+.15,height,z],.018,grass);if(i%3===0)rod([x+.15,height*.65,z],[x+.22,height+.18,z],.045,grass);
  }
  for(let i=0;i<90;i++){const x=(hash(i+7)-.5)*64,z=(hash(i+87)-.5)*60;if(Math.hypot(x,z)<8)continue;const rock=mesh(new T.IcosahedronGeometry(.15+hash(i)*.28,0),i%3===0?foliage:stone,[x,.1,z]);rock.scale.y=.45;}
  // Material batching keeps the detailed diorama economical on phone GPUs.
  g.updateMatrixWorld(true); const batches=new Map();
  g.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,geometries:[]});batches.get(key).geometries.push(geometry.toNonIndexed ? (geometry.index?geometry.toNonIndexed():geometry) : geometry);o.geometry.dispose();});
  g.clear();
  for(const {material,geometries} of batches.values()){const merged=mergeGeometries(geometries);if(!merged)continue;const m=new T.Mesh(merged,material);m.castShadow=m.receiveShadow=true;g.add(m);geometries.forEach(geo=>geo.dispose());}
  for (const s of slides) {
    // The slide surface and its supports are solid to a walking human.
    for (let i=1;i<10;i++) { const p=s.path.getPoint(i/10); colliders.push({ x:p.x, z:p.z, radius:.72, height:Math.max(.8,p.y+1), base:0, kind:'slide' }); }
  }
  return { colliders, swings, slides, stairs };
}
