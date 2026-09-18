import { LifeScenes, addLifeProps, animateLifeProps } from './life-scenes.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { seededRandom, WORLD } from './simulation.js';
import { ComputerRoom } from './computer-room.js';
import { Playground } from './playground.js';

const vec = (x, y, z) => new THREE.Vector3(x, y, z);
const material = (color, roughness = 0.65, metalness = 0.15) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
function ellipsoid(parent, mat, position, scale, detail = 32) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, detail, 20), mat);
  m.position.set(...position); m.scale.set(...scale); m.castShadow = true; parent.add(m); return m;
}
function tube(parent, points, radius, mat, segments = 16) {
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => vec(...p))), segments, radius, 5, false), mat); parent.add(m); return m;
}
function line(parent, points, color, opacity = 1) {
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p => vec(...p))), new THREE.LineBasicMaterial({ color, transparent: true, opacity })); parent.add(l); return l;
}
export function createFly() {
  const fly = new THREE.Group(), body = material('#494332', 0.46, 0.48), dark = material('#242c27', 0.6, 0.28), amber = material('#998259', 0.53, 0.28);
  const red = material('#a73825', 0.36, 0.3), legs = [], wings = [], forelegs = [];
  ellipsoid(fly, dark, [0, 0, -0.62], [0.43, 0.39, 0.84]);
  // Abdomen plates and grooves.
  for (let i = 0; i < 6; i++) {
    const z = -0.3 - i * 0.19, size = 0.43 * Math.sqrt(Math.max(0.1, 1 - ((z + 0.62) / 0.9) ** 2));
    ellipsoid(fly, i % 2 ? body : amber, [0, -0.012, z], [size, size * 0.85, 0.12]);
  }
  ellipsoid(fly, body, [0, 0.11, 0.28], [0.52, 0.49, 0.66]);
  ellipsoid(fly, amber, [0, 0.08, 0.96], [0.36, 0.34, 0.3]);
  const random = seededRandom(31);
  for (const side of [-1, 1]) {
    const eye = ellipsoid(fly, red, [side * 0.27, 0.15, 1.02], [0.25, 0.32, 0.27]);
    // Instanced facets describe the compound eyes without hundreds of draw calls.
    const facets = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.043, 0), material('#c05637', 0.44, 0.15), 185);
    const d = new THREE.Object3D();
    for (let i = 0; i < 185; i++) {
      const y = 1 - 2 * (i + 0.5) / 185, r = Math.sqrt(1 - y * y), a = i * 2.39996;
      d.position.set(Math.cos(a) * r, y, Math.sin(a) * r); d.lookAt(d.position.clone().multiplyScalar(2)); d.updateMatrix(); facets.setMatrixAt(i, d.matrix);
    }
    eye.add(facets);
    tube(fly, [[side * 0.1, 0.22, 1.21], [side * 0.15, 0.3, 1.47], [side * 0.25, 0.52, 1.52]], 0.018, dark);
    ellipsoid(fly, dark, [side * 0.16, 0.31, 1.43], [0.035, 0.065, 0.035], 12);
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Group(); leg.position.set(side * 0.3, -0.12, 0.53 - i * 0.47);
      const front = 0.55 - i * 0.48;
      if (i === 0) {
        const segments = Array.from({ length: 3 }, () => { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 1, 7), amber); mesh.castShadow = true; leg.add(mesh); return mesh; });
        const joint = ellipsoid(leg, dark, [0, 0, 0], [0.043, 0.043, 0.043], 12);
        forelegs.push({ side, root: leg, segments, joint });
      } else {
        tube(leg, [[0, 0, 0], [side * 0.42, -0.22, front * 0.45], [side * 0.56, -0.69, front], [side * 0.87, -0.73, front + 0.22]], 0.022, amber);
        ellipsoid(leg, dark, [side * 0.42, -0.22, front * 0.45], [0.043, 0.043, 0.043], 12);
      }
      fly.add(leg); legs.push(leg);
    }
    const wing = new THREE.Group(); wing.position.set(side * 0.25, 0.4, 0.3);
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.bezierCurveTo(0.2, 0.15, 0.92, 0.05, 1.15, -0.72); shape.bezierCurveTo(1.5, -1.72, 0.82, -2.16, 0.53, -1.8); shape.bezierCurveTo(0.16, -1.35, 0.05, -0.4, 0, 0);
    const geo = new THREE.ShapeGeometry(shape, 30); geo.rotateX(Math.PI / 2); geo.scale(side, 1, 1);
    const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#c1d7c8', transparent: true, opacity: 0.32, metalness: 0.15, roughness: 0.28, side: THREE.DoubleSide, depthWrite: false, iridescence: 0.8, iridescenceIOR: 1.3 })); wing.add(mesh);
    const outline = shape.getPoints(55).map(p => [p.x * side, 0.008, p.y]); line(wing, outline, '#bdc7af', 0.48);
    for (let j = 0; j < 5; j++) {
      const end = 0.55 + j * 0.15;
      line(wing, [[0, 0.01, 0], [side * (0.15 + j * 0.12), 0.02, -0.63], [side * end, 0.01, -1.4 - Math.sin(j) * 0.3]], '#93ac97', 0.55);
    }
    line(wing, [[side * 0.22, 0.025, -0.65], [side * 0.8, 0.025, -0.87], [side * 1.13, 0.02, -0.72]], '#aebfab', 0.45);
    fly.add(wing); wings.push(wing);
    ellipsoid(fly, amber, [side * 0.51, 0.02, -0.16], [0.09, 0.08, 0.09], 12);
  }
  const bristles = [];
  for (let i = 0; i < 100; i++) {
    const a = random() * Math.PI * 2, b = random() * Math.PI;
    const x = Math.sin(b) * Math.cos(a), y = Math.abs(Math.cos(b)), z = Math.sin(b) * Math.sin(a);
    bristles.push([x * 0.5, y * 0.49 + 0.11, z * 0.63 + 0.28], [x * 0.58, y * 0.63 + 0.11, z * 0.73 + 0.28]);
  }
  const hairGeo = new THREE.BufferGeometry().setFromPoints(bristles.map(p => vec(...p)));
  fly.add(new THREE.LineSegments(hairGeo, new THREE.LineBasicMaterial({ color: '#a79c76', transparent: true, opacity: 0.7 })));
  const mouth = new THREE.Group(); mouth.position.set(0, -0.08, 1.15); fly.add(mouth);
  tube(mouth, [[0, 0, 0], [0, -0.24, 0.15], [0, -0.38, 0.17]], 0.037, amber);
  ellipsoid(mouth, amber, [0, -0.38, 0.17], [0.065, 0.045, 0.04], 12);
  const result = { group: fly, wings, legs, forelegs, mouth }; addLifeProps(result); return result;
}

const legAxis = vec(0, 1, 0);
export function animateFly(fly, sim) {
  const grounded = Math.max(0, Math.min(1, (1.12 - (sim.y - (sim.groundHeight?.() ?? 0))) / 0.25));
  const typing = sim.state === 'Locked in';
  const feeding = sim.state === 'Feeding', grooming = ['Grooming', 'Making the bed'].includes(sim.state), holding = ['Smoking', 'Having a drink'].includes(sim.state);
  const active = grounded * (feeding || grooming || holding || typing ? 1 : 0), t = sim.time;
  fly.group.rotation.z = sim.speed ? Math.sin(t * 1.5) * .025 : 0;
  fly.group.rotation.x = feeding ? grounded * (0.035 + Math.sin(t * 5) * 0.012) : 0;
  if (['Practicing flip', 'Backflipping'].includes(sim.state) && sim.training?.active?.phaseAt != null) {
    const progress = Math.max(0, Math.min(1, (t - sim.training.active.phaseAt) / 1.8));
    fly.group.rotation.x = sim.state === 'Backflipping' ? -Math.PI * 2 * (progress * progress * (3 - 2 * progress)) : -Math.sin(progress * Math.PI) * (1.1 + sim.training.flip * 2);
  }
  if (sim.state === 'Sleeping') { fly.group.rotation.x = -.13; fly.group.rotation.z = .32; }
  else if (sim.life) { fly.group.rotation.z += sim.life.buzz * Math.sin(t * 1.7) * .18; if (!sim.speed) fly.group.rotation.x += (1 - sim.life.motivation) * .12; }
  if (fly.lifeProps) animateLifeProps(fly, sim);
  fly.wings.forEach((w, i) => { w.rotation.y = sim.state === 'Sleeping' ? (i ? 1 : -1) * .25 : 0; w.rotation.z = (i ? 1 : -1) * (sim.speed ? 0.12 + Math.sin(t * 63) * 0.35 : 0.04); });
  fly.legs.forEach((leg, i) => { leg.rotation.x = sim.state === 'Sleeping' ? -.6 : sim.speed ? 0.3 + Math.sin(t * 7 + i) * 0.15 : 0; });
  for (const leg of fly.forelegs) {
    const side = leg.side, rub = Math.sin(t * (feeding ? 11 : 8) + (side > 0 ? Math.PI : 0));
    // Grooming alternates rubbing the forelegs and sweeping past the face.
    const faceSweep = grooming ? Math.max(0, Math.sin(t * 1.5)) * 0.24 : 0;
    const resting = [[0, 0, 0], [side * 0.42, -0.22, 0.25], [side * 0.56, -0.69, 0.55], [side * 0.87, -0.73, 0.77]];
    const rubbing = [[0, 0, 0], [side * 0.24, -0.05 + faceSweep, 0.36], [-side * 0.21, -0.13 + faceSweep + rub * 0.035, 0.72], [-side * 0.28 + rub * 0.025, -0.2 + faceSweep + rub * 0.055, 0.95 + rub * 0.055]];
    if (typing) { rubbing[1] = [side * .28, -.1, .5]; rubbing[2] = [side * .4, -.4 + Math.sin(t * 15 + side * 2) * .09, 1]; rubbing[3] = [side * .45, -.65 + Math.sin(t * 15 + side * 2) * .12, 1.25]; }
    if (holding) { rubbing[2] = [side * .08, .05 + Math.sin(t * 1.1) * .14, .67]; rubbing[3] = [side * .05, .03 + Math.sin(t * 1.1) * .16, .87]; }
    const points = resting.map((p, i) => vec(...p).lerp(vec(...rubbing[i]), active));
    leg.root.rotation.x *= 1 - active;
    leg.joint.position.copy(points[1]);
    leg.segments.forEach((segment, i) => { const direction = points[i + 1].clone().sub(points[i]); segment.position.copy(points[i]).add(points[i + 1]).multiplyScalar(0.5); segment.scale.y = direction.length(); segment.quaternion.setFromUnitVectors(legAxis, direction.normalize()); });
  }
  fly.mouth.scale.y = feeding ? 1 + grounded * (0.15 + Math.sin(t * 7) * 0.12) : 0.8;
  fly.mouth.rotation.x = feeding ? Math.sin(t * 5) * 0.09 * grounded : 0;
}

export function createObject(kind) {
  const g = new THREE.Group();
  if (kind === 'banana') {
    const curve = [[-0.65, 0.13, 0], [-0.3, 0.18, 0], [0.12, 0.34, 0], [0.45, 0.7, 0]];
    tube(g, curve, 0.2, material('#e6c34c', 0.8), 24);
    tube(g, [[0.45, 0.7, 0], [0.48, 0.84, 0]], 0.075, material('#655437'));
    tube(g, [[-0.65, 0.13, 0], [-0.77, 0.14, 0]], 0.06, material('#584430'));
    line(g, [[-0.65, 0.25, 0.15], [-0.3, 0.32, 0.16], [0.12, 0.48, 0.16], [0.45, 0.77, 0.1]], '#987c30', 0.7);
  } else if (kind === 'tomato') {
    ellipsoid(g, material('#bc4935', 0.38), [0, 0.38, 0], [0.48, 0.38, 0.46]);
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; tube(g, [[0, 0.77, 0], [Math.cos(a) * 0.2, 0.73, Math.sin(a) * 0.2], [Math.cos(a) * 0.36, 0.65, Math.sin(a) * 0.36]], 0.035, material('#566444')); }
    tube(g, [[0, 0.73, 0], [0.05, 0.99, 0]], 0.038, material('#6c7645'));
  } else {
    const candy = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.2, 48), material('#e5e4d4', 0.4)); candy.position.y = 0.15; g.add(candy);
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Shape(), a = i * Math.PI / 4; s.moveTo(0, 0);
      for (let j = 0; j <= 12; j++) { const t = a + j / 12 * 0.35; s.lineTo(Math.cos(t) * 0.46, Math.sin(t) * 0.46); } s.lineTo(0, 0);
      const m = new THREE.Mesh(new THREE.ShapeGeometry(s), material('#cc6255')); m.rotation.x = -Math.PI / 2; m.position.y = 0.255; g.add(m);
    }
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.815, 64), new THREE.MeshBasicMaterial({ color: kind === 'peppermint' ? '#a6ccc0' : '#d8c889', transparent: true, opacity: 0.45, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; g.add(ring);
  return g;
}

export function createSwatter() {
  const g = new THREE.Group(), frame = material('#c68f65', 0.55, 0.35), mesh = material('#b4ae85', 0.5, 0.4);
  const shape = new THREE.Shape();
  shape.moveTo(-0.55, -0.88); shape.lineTo(0.55, -0.88); shape.lineTo(0.74, -0.68); shape.lineTo(0.74, 0.68); shape.lineTo(0.55, 0.88); shape.lineTo(-0.55, 0.88); shape.lineTo(-0.74, 0.68); shape.lineTo(-0.74, -0.68); shape.closePath();
  const hole = new THREE.Path(); hole.moveTo(-0.57, -0.7); hole.lineTo(-0.57, 0.7); hole.lineTo(0.57, 0.7); hole.lineTo(0.57, -0.7); hole.closePath(); shape.holes.push(hole);
  const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.055, bevelEnabled: false }), frame); rim.rotation.x = -Math.PI / 2; rim.castShadow = true; g.add(rim);
  for (let i = -3; i <= 3; i++) {
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.025, 0.019), mesh); horizontal.position.set(0, 0.035, i * 0.2); g.add(horizontal);
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.019, 0.025, 1.4), mesh); vertical.position.set(i * 0.17, 0.035, 0); g.add(vertical);
  }
  tube(g, [[0, 0, -0.85], [0, 0, -1.25], [0, -0.05, -2.85]], 0.048, frame);
  ellipsoid(g, material('#4a5040'), [0, -0.05, -2.75], [0.11, 0.085, 0.38]);
  return g;
}

export class Habitat {
  constructor(container, onPlace, onSelect = () => {}, onSwatterAim = () => {}, onPerch = () => {}) {
    this.container = container; this.onPlace = onPlace; this.follow = false; this.placing = false; this.objects = new Map(); this.showScent = false;
    this.onSelect = onSelect; this.selectedId = null; this.showMemory = true; this.memoryMarkers = new Map();
    this.swatterMode = false; this.swatterModel = createSwatter(); this.swatterModel.visible = false;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#131a17'); this.scene.fog = new THREE.Fog('#131a17', 20, 48);
    this.scene.add(this.swatterModel);
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 240); this.camera.position.set(8, 7, 11);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.5;
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D habitat. Drag to orbit, scroll to zoom.'); this.renderer.domElement.tabIndex = 0;
    container.prepend(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); this.controls.target.set(0, 0.7, 0); this.controls.enableDamping = true; this.controls.minDistance = 3; this.controls.maxDistance = 28; this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    this.homeFraming = true; this.controls.addEventListener('start', () => { this.homeFraming = false; });
    this.scene.add(new THREE.HemisphereLight('#d5e6c4', '#3f4233', 2));
    const sun = new THREE.DirectionalLight('#f2dfb2', 4.2); sun.position.set(3, 10, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -9; sun.shadow.camera.right = 9; sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9; sun.shadow.bias = -0.0005; this.scene.add(sun);
    const rim = new THREE.DirectionalLight('#9ecdbd', 2); rim.position.set(-6, 5, -4); this.scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), material('#1d2821', 0.97, 0.1)); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.035; floor.receiveShadow = true; this.scene.add(floor);
    const grid = new THREE.GridHelper(80, 80, '#68745a', '#475541'); grid.material.transparent = true; grid.material.opacity = 0.46; this.scene.add(grid);
    const boundary = new THREE.Mesh(new THREE.RingGeometry(WORLD.radius - 0.03, WORLD.radius, 128), new THREE.MeshBasicMaterial({ color: '#8e9971', transparent: true, opacity: 0.45, side: THREE.DoubleSide })); boundary.rotation.x = -Math.PI / 2; boundary.position.y = 0.004; this.scene.add(boundary);
    this.scenery = { floor, grid, boundary, sun, rim }; this.environment = 'habitat'; this.lifeScenes = new LifeScenes(this.scene);
    this.fly = createFly(); this.scene.add(this.fly.group);
    this.marker = new THREE.Mesh(new THREE.RingGeometry(0.84, 0.865, 64), new THREE.MeshBasicMaterial({ color: '#ddeb99', transparent: true, opacity: 0.7, side: THREE.DoubleSide })); this.marker.rotation.x = -Math.PI / 2; this.marker.position.y = 0.015; this.scene.add(this.marker);
    this.ghost = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.74, 64), new THREE.MeshBasicMaterial({ color: '#e4efac', side: THREE.DoubleSide })); this.ghost.rotation.x = -Math.PI / 2; this.ghost.visible = false; this.scene.add(this.ghost);
    this.selection = new THREE.Mesh(new THREE.RingGeometry(0.9, 0.97, 64), new THREE.MeshBasicMaterial({ color: '#edf5b6', side: THREE.DoubleSide, transparent: true, opacity: 0.9 })); this.selection.rotation.x = -Math.PI / 2; this.selection.visible = false; this.scene.add(this.selection);
    this.trailPoints = []; this.trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#d4dc8f', transparent: true, opacity: 0.23 })); this.scene.add(this.trail); this.lastTrail = 0;
    this.ray = new THREE.Raycaster(); const plane = new THREE.Plane(vec(0, 1, 0), 0);
    const hit = (e, height = 0) => { const r = this.renderer.domElement.getBoundingClientRect(); this.ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), this.camera); plane.constant = -height; if (!height) { const surface = this.ray.intersectObjects(this.environment === 'playground' ? this.playground.surfaces : this.lifeScenes.surfaces, false)[0]; if (surface) return surface.point; } return this.ray.ray.intersectPlane(plane, new THREE.Vector3()); };
    this.renderer.domElement.addEventListener('pointermove', e => {
      if (this.swatterMode) { const p = hit(e, 1.8); if (p) onSwatterAim(p.x, p.z); return; }
      if (this.down && Math.hypot(e.clientX - this.down[0], e.clientY - this.down[1]) > 6) this.dragged = true;
      if (this.placing) { const p = hit(e); this.ghost.visible = !!p && Math.hypot(p.x, p.z) <= WORLD.objectRadius; if (p) this.ghost.position.set(p.x, p.y + 0.03, p.z); }
      else if (this.computerRoom?.visible && !this.down) { hit(e); this.renderer.domElement.style.cursor = this.computerRoom.screenHit(this.ray, this.scene) ? 'pointer' : 'grab'; }
    });
    this.renderer.domElement.addEventListener('pointerdown', e => { if (this.swatterMode) { const p = hit(e, 1.8); if (p) onSwatterAim(p.x, p.z); this.renderer.domElement.setPointerCapture(e.pointerId); return; } if (this.down) this.dragged = true; else { this.down = [e.clientX, e.clientY]; this.dragged = false; } });
    this.renderer.domElement.addEventListener('pointercancel', () => { this.down = null; this.dragged = true; if (this.swatterMode) onSwatterAim(null); });
    this.renderer.domElement.addEventListener('pointerleave', () => { if (this.swatterMode) onSwatterAim(null); });
    this.renderer.domElement.addEventListener('pointerup', e => {
      if (this.swatterMode) { if (this.renderer.domElement.hasPointerCapture(e.pointerId)) this.renderer.domElement.releasePointerCapture(e.pointerId); if (e.pointerType === 'touch') onSwatterAim(null); return; }
      const click = this.down && !this.dragged && e.button === 0 && Math.hypot(e.clientX - this.down[0], e.clientY - this.down[1]) < 6; this.down = null;
      if (!click) return;
      const p = hit(e);
      if (this.placing) { if (p && Math.hypot(p.x, p.z) <= WORLD.objectRadius) onPlace(p.x, p.z); return; }
      const screenHit = this.computerRoom?.screenHit(this.ray, this.scene);
      if (screenHit) { this.computerRoom.clickScreen(screenHit); return; }
      const picks = [];
      for (const g of this.objects.values()) if (g.visible) g.traverse(c => { if (c.userData.objectId) picks.push(c); });
      const picked = this.ray.intersectObjects(picks, false)[0];
      if (!picked && this.environment === 'playground') { const pad = this.ray.intersectObjects(this.playground.surfaces, false)[0]; if (pad) { onPerch(pad.object.userData.perch); return; } }
      onSelect(picked?.object.userData.objectId ?? null);
    });
    new ResizeObserver(() => this.resize()).observe(container); this.resize();
  }
  resize() { const w = this.container.clientWidth, h = this.container.clientHeight; if (!w || !h) return; this.camera.aspect = w / h; this.camera.fov = w < h ? 55 : 38; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); this.computerRoom?.resize(w, h); if (this.homeFraming) this.frame(); }
  setEnvironment(environment) {
    this.environment = environment; this.resetTrail(); this.lifeScenes.setRoom(environment); const computer = environment === 'computer';
    if (computer && !this.computerRoom) this.computerRoom = new ComputerRoom(this.container, this.scene);
    this.computerRoom?.setVisible(computer);
    if (environment === 'playground' && !this.playground) { this.playground = new Playground(); this.scene.add(this.playground.group); }
    if (this.playground) this.playground.group.visible = environment === 'playground';
    this.scenery.floor.visible = !computer && !['fireescape', 'rooftop'].includes(environment); this.scenery.floor.material.color.set(environment === 'bar' ? '#211c1b' : '#141f2b');
    this.scenery.grid.visible = !['fireescape', 'rooftop'].includes(environment);
    this.scenery.boundary.visible = !['fireescape', 'rooftop'].includes(environment);
    this.scenery.grid.material.opacity = computer ? .14 : .46;
    this.scenery.boundary.material.opacity = computer ? .16 : .45;
    this.scenery.sun.intensity = environment === 'playground' ? 4.2 : environment === 'bar' ? .7 : 1.5;
    this.scenery.rim.color.set(computer ? '#65c9ee' : '#9ecdbd');
    this.scene.background.set(environment === 'bar' ? '#15131a' : '#0c1523');
    if (environment === 'playground') this.scene.background.set('#18252a');
    this.scene.fog.color.copy(this.scene.background); this.scene.fog.near = ['rooftop', 'fireescape'].includes(environment) ? 40 : 30; this.scene.fog.far = ['rooftop', 'fireescape'].includes(environment) ? 155 : 80;
    this.container.dataset.environment = environment;
    this.controls.maxDistance = 48;
    this.resize(); this.frame();
  }
  setPlacement(enabled) { this.placing = enabled; this.controls.enabled = !enabled && !this.swatterMode; this.ghost.visible = false; this.renderer.domElement.style.cursor = enabled || this.swatterMode ? 'crosshair' : 'grab'; }
  setSwatter(enabled) { this.swatterMode = enabled; this.down = null; this.dragged = false; this.setPlacement(false); if (!enabled) this.swatterModel.visible = false; }
  setSelected(id) { this.selectedId = id; this.selection.visible = false; }
  frame(close = false) { this.follow = close; this.homeFraming = !close; const p = this.fly.group.position; const computer = this.environment === 'computer', playground = this.environment === 'playground', portrait = this.camera.aspect < 1; this.controls.enableDamping = false; this.controls.update(); this.controls.target.copy(close ? p : computer ? vec(0, portrait ? 3 : 6.3, -7) : playground ? vec(portrait ? 0 : -1.5, .7, 0) : vec(0, this.environment === 'rooftop' ? 4 : 1.5, -2)); this.camera.position.copy(close ? p.clone().add(this.environment === 'fireescape' ? vec(3.8, 3.5, 1.2) : this.environment === 'bar' ? vec(4.5, 3, -1.2) : vec(3.8, 2.4, 4.4)) : computer ? (portrait ? vec(8, 14, 23) : vec(14, 12, 17)) : playground ? (portrait ? vec(5, 19, 30) : vec(10, 16, 22)) : (portrait ? vec(5, 16, 28) : this.environment === 'rooftop' ? vec(15, 11, 21) : vec(14, 12, 19))); this.controls.update(); this.controls.enableDamping = true; }
  resetTrail() { this.trailPoints = []; this.lastTrail = 0; this.trail.geometry.dispose(); this.trail.geometry = new THREE.BufferGeometry(); }
  update(sim, running) {
    const present = sim.environment === this.environment;
    if (this.lastResidence !== sim.environment) { this.resetTrail(); this.lastResidence = sim.environment; }
    this.fly.group.scale.setScalar(sim.life.crossingUntil ? Math.max(.06, (sim.life.crossingUntil - sim.time) / 1.4) : 1);
    this.fly.group.visible = this.marker.visible = this.trail.visible = present; this.container.dataset.flyPresent = String(present); this.container.dataset.flyRoom = sim.environment;
    this.lifeScenes.update(sim);
    const p = this.fly.group.position.clone(); this.fly.group.position.set(sim.x, sim.y, sim.z); this.fly.group.rotation.y = sim.heading;
    this.fly.group.rotation.z = sim.speed ? Math.sin(sim.time * 1.5) * 0.025 : 0;
    animateFly(this.fly, sim);
    this.swatterModel.visible = present && this.swatterMode && sim.swatter.active;
    this.container.dataset.swatterVisible = String(this.swatterModel.visible);
    if (this.swatterModel.visible) { this.swatterModel.position.set(sim.swatter.x, 1.8, sim.swatter.z); this.swatterModel.rotation.set(0.1, 0.25, Math.sin(sim.time * 3) * 0.025); }
    this.marker.material.color.set(sim.state === 'Panicking' ? '#e6a272' : '#ddeb99');
    this.marker.position.set(sim.x, sim.groundHeight() + 0.015, sim.z);
    if (this.environment === 'playground') { this.playground.update(sim); }
    if (this.follow && present) { const delta = this.fly.group.position.clone().sub(p); this.camera.position.add(delta); this.controls.target.copy(this.fly.group.position); }
    if (present && running && sim.time - this.lastTrail > 0.15) { this.lastTrail = sim.time; this.trailPoints.push(vec(sim.x, 0.025, sim.z)); if (this.trailPoints.length > 200) this.trailPoints.shift(); this.trail.geometry.dispose(); this.trail.geometry = new THREE.BufferGeometry().setFromPoints(this.trailPoints); }
    for (const [id, g] of this.objects) if (!sim.objects.some(o => o.id === id)) { this.scene.remove(g); g.traverse(c => { c.geometry?.dispose(); if (c.material) c.material.dispose(); }); this.objects.delete(id); }
    for (const o of sim.objects) {
      if (!this.objects.has(o.id)) {
        const g = createObject(o.kind); g.position.set(o.x, 0, o.z); g.traverse(c => { if (c.isMesh) c.userData.objectId = o.id; }); this.scene.add(g); this.objects.set(o.id, g);
        const scent = new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 12), new THREE.MeshBasicMaterial({ color: o.kind === 'peppermint' ? '#8fc8b7' : '#d7c96c', transparent: true, opacity: 0.045, depthWrite: false, wireframe: true })); scent.name = 'scent'; scent.scale.y = 0.28; g.add(scent);
      }
      const g = this.objects.get(o.id); g.visible = (o.room ?? sim.environment) === this.environment; g.position.y = sim.groundHeight(o.x, o.z, o.room ?? sim.environment); g.scale.setScalar(0.6 + o.amount * 0.4); g.getObjectByName('scent').visible = this.showScent;
    }
    const selected = sim.roomObjects(this.environment).find(o => o.id === this.selectedId);
    this.selection.visible = !!selected; if (selected) this.selection.position.set(selected.x, sim.groundHeight(selected.x, selected.z, this.environment) + 0.04, selected.z);
    for (const [id, marker] of this.memoryMarkers) if (!sim.memories.some(m => m.id === id)) {
      this.scene.remove(marker); marker.geometry.dispose(); marker.material.dispose(); this.memoryMarkers.delete(id);
    }
    for (const memory of sim.memories) {
      if (!this.memoryMarkers.has(memory.id)) {
        const points = Array.from({ length: 97 }, (_, i) => vec(Math.cos(i / 96 * Math.PI * 2) * 3.4, 0, Math.sin(i / 96 * Math.PI * 2) * 3.4));
        const marker = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineDashedMaterial({ color: '#baa4da', dashSize: 0.2, gapSize: 0.14, transparent: true })); marker.computeLineDistances(); this.scene.add(marker); this.memoryMarkers.set(memory.id, marker);
      }
      const marker = this.memoryMarkers.get(memory.id); marker.position.set(memory.x, 0.035, memory.z); marker.visible = this.showMemory && (memory.room ?? sim.environment) === this.environment; marker.material.opacity = 0.1 + memory.strength * 0.6;
    }
    this.controls.update(); this.computerRoom?.update(this.camera, sim); this.renderer.render(this.scene, this.camera);
  }
}

export class BrainView {
  constructor(container) {
    this.container = container; this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50); this.camera.position.set(0, 0.5, 6.5);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'Interactive illustrative neural map. Drag to rotate, scroll or pinch to zoom.');
    this.group = new THREE.Group(); this.scene.add(this.group); const rand = seededRandom(52), positions = [], groups = [];
    for (let i = 0; i < 5400; i++) {
      const side = i % 2 ? 1 : -1, lobe = i < 2600, a = rand() * Math.PI * 2, b = Math.acos(2 * rand() - 1), radius = Math.pow(rand(), 0.32);
      const x = Math.sin(b) * Math.cos(a) * radius, y = Math.cos(b) * radius, z = Math.sin(b) * Math.sin(a) * radius;
      positions.push(side * (lobe ? 1.5 : 0.57) + x * (lobe ? 0.64 : 0.83), y * (lobe ? 0.83 : 0.7) + (lobe ? 0 : 0.12), z * 0.52);
      groups.push(lobe ? 2 : i % 4);
    }
    this.groups = groups; this.positions = positions; this.colors = new Float32Array(positions.length);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.024, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); this.group.add(this.points);
    const fibers = [];
    for (let i = 0; i < 260; i++) { const side = i % 2 ? 1 : -1; const x = side * (1.05 + rand() * 0.4), y = (rand() - 0.5) * 0.9, z = (rand() - 0.5) * 0.5; fibers.push(vec(x, y, z), vec(side * rand() * 0.5, y * 0.4 - 0.15, z * 0.6)); }
    this.group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(fibers), new THREE.LineBasicMaterial({ color: '#dbe8a1', transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending })));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true; this.controls.enablePan = false; this.controls.enableDamping = true;
    this.controls.minDistance = 0.65; this.controls.maxDistance = 12;
    this.controls.zoomSpeed = 0.9; this.controls.rotateSpeed = 0.7;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
    this.homePosition = this.camera.position.clone(); this.homeTarget = this.controls.target.clone(); this.resetMotion = null;
    this.controls.addEventListener('start', () => { this.resetMotion = null; this.controls.enableDamping = true; });
    new ResizeObserver(() => { const w = container.clientWidth, h = container.clientHeight; if (w && h) { this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); } }).observe(container);
  }
  resetView() {
    // Flush residual orbit motion before smoothly restoring the overview.
    this.controls.enableDamping = false; this.controls.update();
    this.resetMotion = { started: performance.now(), position: this.camera.position.clone(), target: this.controls.target.clone(), duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650 };
  }
  update(sim) {
    if (this.resetMotion) {
      const motion = this.resetMotion, t = motion.duration ? Math.min(1, (performance.now() - motion.started) / motion.duration) : 1;
      const eased = t * t * (3 - 2 * t);
      this.camera.position.lerpVectors(motion.position, this.homePosition, eased);
      this.controls.target.lerpVectors(motion.target, this.homeTarget, eased);
      if (t === 1) { this.resetMotion = null; this.controls.enableDamping = true; }
    }
    const values = Object.values(sim.signals);
    for (let i = 0; i < this.groups.length; i++) { const a = values[this.groups[i]], flash = Math.sin(i * 12.3 + sim.time * (3 + a * 5)) > 0.91 ? 1 : 0.15; const b = 0.15 + a * 0.65 + flash * 0.25; this.colors[i * 3] = b * (this.groups[i] === 1 ? 0.5 : 0.86); this.colors[i * 3 + 1] = b; this.colors[i * 3 + 2] = b * (this.groups[i] === 1 ? 0.92 : 0.62); }
    this.points.geometry.attributes.color.needsUpdate = true; this.group.rotation.y = Math.sin(sim.time * 0.12) * 0.17; this.controls.update(); this.renderer.render(this.scene, this.camera);
  }
}
