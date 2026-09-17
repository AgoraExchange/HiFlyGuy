import * as T from 'three';

const mat = (color, metalness = .15) => new T.MeshStandardMaterial({ color, roughness: .72, metalness });
const steel = mat('#384652', .7), dark = mat('#17232e'), wood = mat('#352a27'), linen = mat('#b3c0c5');
function box(g, size, pos, material = dark) {
  const m = new T.Mesh(new T.BoxGeometry(...size), material); m.position.set(...pos); m.castShadow = m.receiveShadow = true; g.add(m); return m;
}
function rod(g, a, b, r = .04, material = steel) {
  const from = new T.Vector3(...a), to = new T.Vector3(...b), delta = to.clone().sub(from);
  const m = new T.Mesh(new T.CylinderGeometry(r, r, delta.length(), 8), material); m.position.copy(from).add(to).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()); g.add(m); return m;
}
function outline(g, mesh, color = '#577484', opacity = .25) {
  const edges = new T.LineSegments(new T.EdgesGeometry(mesh.geometry), new T.LineBasicMaterial({ color, transparent: true, opacity })); mesh.add(edges); return edges;
}
function label(g, text, x, y, z, width = 4, color = '#a6c9da') {
  const c = document.createElement('canvas'); c.width = 768; c.height = 128; const ctx = c.getContext('2d');
  ctx.font = '28px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.fillText(text, 384, 75);
  const texture = new T.CanvasTexture(c), m = new T.Mesh(new T.PlaneGeometry(width, width / 6), new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })); m.position.set(x, y, z); g.add(m); return m;
}
function gridWall(g, x, y, z, w, h) {
  const wall = box(g, [w, h, .15], [x, y, z]); outline(g, wall);
  const pts = []; for (let a = -w / 2; a <= w / 2; a++) pts.push(x + a, y - h / 2, z + .09, x + a, y + h / 2, z + .09);
  for (let a = -h / 2; a <= h / 2; a++) pts.push(x - w / 2, y + a, z + .09, x + w / 2, y + a, z + .09);
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.add(new T.LineSegments(geo, new T.LineBasicMaterial({ color: '#536d7e', transparent: true, opacity: .2 })));
}
function rail(g, a, b, height = 2.2) {
  rod(g, [a[0], height, a[1]], [b[0], height, b[1]], .085);
  rod(g, [a[0], .35, a[1]], [b[0], .35, b[1]], .045);
  const n = Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / .65);
  for (let i = 0; i <= n; i++) { const x = a[0] + (b[0] - a[0]) * i / n, z = a[1] + (b[1] - a[1]) * i / n; rod(g, [x, 0, z], [x, height, z], .038); }
}
function city(g) {
  // Stable outlined silhouettes; no image downloads or per-frame mesh allocation.
  for (let i = 0; i < 46; i++) {
    const x = (i % 16 - 7.5) * 5.5, z = -27 - Math.floor(i / 16) * 15, h = 4 + (Math.sin(i * 7.1) + 1) * 7;
    const b = box(g, [2.6 + i % 3, h, 3.3], [x, h / 2 - 3, z], mat('#101c2a')); outline(g, b, '#688aaf', .36);
    for (let j = 1; j < h; j += 1.3) for (let k = 0; k < 2; k++) if ((i + k + Math.floor(j)) % 3) box(g, [.18, .26, .02], [x - .7 + k * 1.4, j - 3, z + 1.67], new T.MeshBasicMaterial({ color: (i + k) % 5 ? '#526a84' : '#9b805b' }));
    if (i % 9 === 0) rod(g, [x, h - 3, z], [x, h + 1, z], .025);
  }
  // Suspension bridge on the horizon.
  const bridge = new T.Group(); bridge.position.set(22, 0, -23); g.add(bridge);
  rod(bridge, [-13, 1, 0], [13, 1, 0], .12);
  for (const x of [-7, 7]) { rod(bridge, [x, -3, 0], [x, 8, 0], .16); rod(bridge, [x + 1, -3, 0], [x + 1, 8, 0], .16); }
  for (let i = -13; i < 13; i++) {
    const h = x => 2 + 5 * Math.pow(Math.min(Math.abs(x + 7), Math.abs(x - 7)) / 7 - 1, 2);
    rod(bridge, [i, h(i), 0], [i + 1, h(i + 1), 0], .025); rod(bridge, [i, 1, 0], [i, h(i), 0], .012);
  }
}
function windowFrame(g, x, z) {
  box(g, [5.4, 5.6, .3], [x, 4.6, z], steel);
  box(g, [4.95, 5.1, .04], [x, 4.6, z + .18], new T.MeshBasicMaterial({ color: '#688294' }));
  for (let y = 2.2; y < 7.3; y += .46) { const slat = box(g, [5.05, .3, .18], [x, y, z + .35], mat('#263641')); slat.rotation.x = -.4; }
  box(g, [.13, 5.2, .2], [x, 4.6, z + .55], steel); box(g, [5.8, .2, .7], [x, 1.85, z + .35], steel);
}
function doorway(g, x, z, text) {
  box(g, [2.4, 3.9, .18], [x, 1.95, z], mat('#080f18'));
  for (const side of [-1, 1]) box(g, [.09, 4, .2], [x + side * 1.25, 2, z + .1], steel);
  box(g, [2.6, .1, .2], [x, 4, z + .1], steel); label(g, text, x, 4.45, z + .15, 3);
  const ring = new T.Mesh(new T.RingGeometry(.5, .53, 48), new T.MeshBasicMaterial({ color: '#a5c9c0', side: T.DoubleSide, transparent: true, opacity: .4 })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, .02, z + .8); g.add(ring);
}
export class LifeScenes {
  constructor(scene) { this.scene = scene; this.rooms = new Map(); this.surfaces = []; }
  setRoom(room) {
    this.room = room;
    if (['habitat', 'fireescape', 'bar', 'rooftop'].includes(room) && !this.rooms.has(room)) {
      const g = new T.Group(); g.userData.surfaces = []; if (['fireescape', 'rooftop'].includes(room)) { const grid = new T.GridHelper(22, 22, '#687c87', '#506372'); grid.position.y = .02; grid.material.transparent = true; grid.material.opacity = .38; g.add(grid); } this.rooms.set(room, g); this.scene.add(g); this[room](g);
    }
    for (const [key, g] of this.rooms) g.visible = key === room;
    this.surfaces = this.rooms.get(room)?.userData.surfaces ?? [];
  }
  habitat(g) {
    gridWall(g, 0, 4, -9, 20, 8); windowFrame(g, 3.2, -8.7); doorway(g, 7, -4.8, 'OUT INTO THE WORLD');
    box(g, [4.6, .4, 6.5], [-3.5, .25, -3], wood);
    const mattress = box(g, [4.2, .4, 6], [-3.5, .65, -3], linen); g.userData.surfaces.push(mattress);
    box(g, [4.7, 2.2, .25], [-3.5, 1.1, -6.2], mat('#3a4651'));
    const pillow = new T.Mesh(new T.SphereGeometry(1, 28, 16), linen); pillow.scale.set(1.65, .25, .67); pillow.position.set(-3.5, 1.02, -5.2); g.add(pillow);
    const blanket = new T.Mesh(new T.PlaneGeometry(4.9, 4.6, 34, 30), mat('#78919f')); blanket.rotation.x = -Math.PI / 2; blanket.position.set(-3.5, .9, -2.1); blanket.receiveShadow = true; blanket.castShadow = true; blanket.material.side = T.DoubleSide; g.add(blanket); this.blanket = blanket; this.blanketBase = blanket.geometry.attributes.position.array.slice();
    const clutter = new T.Group(); g.add(clutter); this.clutter = clutter;
    for (let i = 0; i < 7; i++) { const paper = box(clutter, [.5, .03, .7], [-.5 + Math.sin(i * 5) * 1.3, .05, -2 + Math.cos(i * 3) * 3], mat('#9a9f94')); paper.rotation.y = i * .7; }
    box(g, [1.5, 1, 1.4], [-7, .5, -4], wood); box(g, [.85, .08, .5], [-7, 1.05, -4], mat('#50686c'));
    rod(g, [-7, 1, -4.2], [-7, 2, -4.2], .035);
    const shade = new T.Mesh(new T.ConeGeometry(.5, .65, 20, 1, true), mat('#baaa7f')); shade.position.set(-7, 2, -4.2); g.add(shade);
    const lamp = new T.PointLight('#ffce89', 8, 7, 2); lamp.position.set(-7, 1.8, -4); g.add(lamp);
    // Soft slashes across floor and duvet read as light through the blinds.
    for (let i = 0; i < 11; i++) {
      const streak = new T.Mesh(new T.PlaneGeometry(6.8, .19), new T.MeshBasicMaterial({ color: '#c2e4ef', transparent: true, opacity: .13, depthWrite: false, side: T.DoubleSide })); streak.rotation.set(-Math.PI / 2, 0, -.58); streak.position.set(1.3 - i * .25, .012, -6.6 + i * .65); g.add(streak);
    }
    const moon = new T.SpotLight('#b6dbff', 100, 35, .65, .6, 1.5); moon.position.set(4, 7, -8); moon.target.position.set(-3, 0, -1); moon.castShadow = true; moon.shadow.bias = -.001; moon.shadow.normalBias = .035; moon.shadow.mapSize.set(1024, 1024); g.add(moon, moon.target);
    label(g, '01 / A ROOM OF HIS OWN', -3.5, 3.1, -8.8, 5);
  }
  fireescape(g) {
    gridWall(g, 0, 4, -8, 23, 10); windowFrame(g, -4, -7.7); doorway(g, 0, -7.8, 'HOME / 01');
    box(g, [20, .24, 20], [0, -.16, 0], steel);
    for (let x = -8.8; x < 9; x += .32) rod(g, [x, .015, -7.8], [x, .015, 7.8], .018, mat('#6a7e88', .8));
    rail(g, [-10, -8], [-10, 10]); rail(g, [10, -8], [10, 10]);
    rail(g, [-10, 10], [10, 10]);
    for (let i = 0; i < 10; i++) box(g, [2.5, .12, .8], [10.5, -i * .38, 6 - i * .85], steel);
    rod(g, [11.7, 2, 6], [11.7, -1.4, -1.65], .06);
    for (const x of [-8.5, 8.5]) rod(g, [x, -.25, 7], [x, -5, -8], .11);
    city(g); label(g, '02 / JUST OUTSIDE', 4.5, 4, -7.8, 5);
    const light = new T.PointLight('#f5c88c', 18, 13, 2); light.position.set(0, 4, -6); g.add(light);
  }
  bar(g) {
    gridWall(g, 0, 4.5, -9, 25, 9); doorway(g, 7, 3.2, 'STAIRS / ROOFTOP');
    box(g, [15, 2.2, 2.5], [-1, 1.1, -6.4], wood); box(g, [15.7, .22, 3], [-1, 2.3, -6.4], mat('#5a4234'));
    rod(g, [-8, .45, -4.6], [6, .45, -4.6], .07, mat('#9f8258', .7));
    for (const x of [-4, 0, 4]) {
      const seat = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, .25, 32), mat('#65423a')); seat.position.set(x, 1.225, -3.4); seat.castShadow = true; g.add(seat); g.userData.surfaces.push(seat);
      for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) rod(g, [x + Math.sin(a) * .6, 1.1, -3.4 + Math.cos(a) * .6], [x + Math.sin(a) * .8, 0, -3.4 + Math.cos(a) * .8], .055);
    }
    for (const y of [3.7, 5.4]) {
      box(g, [13, .15, 1], [-1, y, -8.4], wood);
      for (let i = 0; i < 12; i++) {
        const bottle = new T.Mesh(new T.CylinderGeometry(.14, .2, .75, 10), mat(['#36544a', '#644b34', '#355365'][i % 3], .4)); bottle.position.set(-6.5 + i, y + .45, -8.3); g.add(bottle); rod(g, [-6.5 + i, y + .8, -8.3], [-6.5 + i, y + 1.05, -8.3], .07, bottle.material);
      }
    }
    for (const x of [-5, 2]) {
      rod(g, [x, 8.5, -5.8], [x, 5.4, -5.8], .025);
      const shade = new T.Mesh(new T.ConeGeometry(.9, .6, 24, 1, true), mat('#514332')); shade.position.set(x, 5.4, -5.8); g.add(shade);
      const light = new T.PointLight('#ffbd70', 48, 15, 2); light.position.set(x, 5, -5.8); g.add(light);
      const pool = new T.Mesh(new T.ConeGeometry(2.9, 5, 32, 1, true), new T.MeshBasicMaterial({ color: '#ffbf78', transparent: true, opacity: .018, side: T.DoubleSide, depthWrite: false })); pool.position.set(x, 2.5, -5.8); g.add(pool);
    }
    label(g, 'THE SMALL HOURS', -1, 7, -8.85, 9, '#f4c795'); label(g, 'OPEN LATE  /  ANOTHER ROUND?', -1, 6.45, -8.84, 5, '#a28a6e');
  }
  rooftop(g) {
    box(g, [23, .3, 23], [0, -.2, 0], dark);
    for (const x of [-11.4, 11.4]) { const wall = box(g, [.35, 1.7, 23], [x, .85, 0], steel); outline(g, wall); }
    const parapet = box(g, [23, 1.7, .35], [0, .85, -9.5], steel); outline(g, parapet);
    const roofHouse = box(g, [4, 4.5, 4], [-6, 2.25, 1.8], dark); outline(g, roofHouse); doorway(g, -6, 4, 'BACK DOWNSTAIRS');
    const tank = new T.Mesh(new T.CylinderGeometry(2, 2, 3.5, 20), mat('#283849', .5)); tank.position.set(7, 5, -5); g.add(tank); outline(g, tank);
    const cap = new T.Mesh(new T.ConeGeometry(2.25, 1.15, 20), steel); cap.position.set(7, 7.3, -5); g.add(cap);
    for (const x of [5.6, 8.4]) for (const z of [-6.4, -3.6]) rod(g, [x, 0, z], [x, 3.3, z], .09);
    city(g); label(g, '05 / ABOVE THE NOISE', 0, 1.05, -9.28, 6);
    const moon = new T.Mesh(new T.SphereGeometry(.8, 24, 16), new T.MeshBasicMaterial({ color: '#b6cfe3' })); moon.position.set(-21, 21, -55); g.add(moon);
    const pts = []; for (let i = 0; i < 150; i++) pts.push(Math.sin(i * 13.7) * 90, 20 + (Math.sin(i * 6.3) + 1) * 25, -65 - Math.cos(i) * 20);
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.add(new T.Points(geo, new T.PointsMaterial({ color: '#7792ad', size: .07 })));
  }
  update(sim) {
    if (this.room === 'habitat' && this.blanket) {
      const tidy = sim.life.tidiness; if (Math.abs(tidy - (this.lastTidiness ?? -1)) < .002) return; this.lastTidiness = tidy; const attr = this.blanket.geometry.attributes.position;
      for (let i = 0; i < attr.count; i++) {
        const x = this.blanketBase[i * 3], y = this.blanketBase[i * 3 + 1];
        const drape = Math.max(0, Math.abs(x) - 2.1) * 1.5;
        attr.setZ(i, -drape + (1 - tidy) * (.3 + Math.sin(x * 3 + y * 4) * .16 + Math.sin(y * 6 - x) * .1));
        attr.setY(i, y + (1 - tidy) * Math.sin(x * 2) * .42);
      }
      attr.needsUpdate = true; this.blanket.geometry.computeVertexNormals();
      this.clutter.children.forEach((c, i) => { c.visible = 1 - tidy > (i + 1) / 9; });
    }
  }
}

export function addLifeProps(fly) {
  const cigarette = new T.Group(); fly.group.add(cigarette);
  rod(cigarette, [0, 0, 0], [0, 0, .55], .045, mat('#d3cbb7')); rod(cigarette, [0, 0, -.16], [0, 0, 0], .047, mat('#bc8855'));
  const ember = new T.Mesh(new T.SphereGeometry(.052, 10, 8), new T.MeshBasicMaterial({ color: '#ff8a4c' })); ember.position.z = .56; cigarette.add(ember);
  const glass = new T.Group(); fly.group.add(glass);
  const cup = new T.Mesh(new T.CylinderGeometry(.19, .15, .42, 20, 1, true), new T.MeshPhysicalMaterial({ color: '#c9e5eb', transparent: true, opacity: .35, roughness: .12, side: T.DoubleSide })); glass.add(cup);
  const drink = new T.Mesh(new T.CylinderGeometry(.16, .13, .24, 20), mat('#a76823')); drink.position.y = -.06; glass.add(drink);
  const smoke = new T.Group(); fly.group.add(smoke);
  for (let i = 0; i < 16; i++) { const puff = new T.Mesh(new T.SphereGeometry(1, 10, 8), new T.MeshBasicMaterial({ color: '#adb9c3', transparent: true, opacity: .12, depthWrite: false })); smoke.add(puff); }
  fly.lifeProps = { cigarette, glass, smoke, ember };
}
export function animateLifeProps(fly, sim) {
  const { cigarette, glass, smoke, ember } = fly.lifeProps;
  cigarette.visible = smoke.visible = sim.state === 'Smoking'; glass.visible = sim.state === 'Having a drink';
  const lift = (Math.sin(sim.time * 1.1) + 1) / 2;
  cigarette.position.set(.3, -.15 + lift * .22, 1.27); cigarette.rotation.y = -.3;
  glass.position.set(-.5 + lift * .25, -.45 + lift * .55, 1.48); glass.rotation.z = -lift * .6;
  ember.scale.setScalar(.8 + lift * .4);
  smoke.children.forEach((p, i) => { const t = (sim.time * .24 + i / 16) % 1; p.position.set(.2 + Math.sin(t * 6 + i) * t * .4, .3 + t * 2.8, 1.65 - t * .8); p.scale.setScalar(.07 + t * .42); p.material.opacity = Math.sin(t * Math.PI) * .1; });
}
