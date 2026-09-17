import * as THREE from 'three';
import { PERCHES, HUMAN, HELLO_SPOT, recallTarget } from './training.js';

function label(text, color = '#d4eee2') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = color; ctx.font = '28px Consolas, monospace'; ctx.textAlign = 'center'; ctx.fillText(text, 256, 55);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.8, .71), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })); mesh.rotation.x = -Math.PI / 2; return mesh;
}
export class Playground {
  constructor() {
    this.group = new THREE.Group(); this.surfaces = []; this.halos = [];
    const material = color => new THREE.MeshStandardMaterial({ color, roughness: .65, metalness: .2 });
    const pale = material('#c1d3bd'), stem = material('#3a6763');
    for (const [index, p] of PERCHES.entries()) {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.4, p.height - .08, 48), stem); base.position.set(p.x, (p.height - .08) / 2, p.z); base.receiveShadow = base.castShadow = true; this.group.add(base);
      const cushion = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, .12, 64), material(p.color)); cushion.position.set(p.x, p.height - .06, p.z); cushion.receiveShadow = true; this.group.add(cushion);
      const surface = new THREE.Mesh(new THREE.CircleGeometry(1.55, 64), material(p.color)); surface.rotation.x = -Math.PI / 2; surface.position.set(p.x, p.height + .003, p.z); surface.userData.perch = index; surface.receiveShadow = true; this.surfaces.push(surface); this.group.add(surface);
      const halo = new THREE.Mesh(new THREE.RingGeometry(1.72, 1.78, 64), new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: .45, side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.set(p.x, .018, p.z); this.group.add(halo); this.halos.push(halo);
      const tag = label(`0${index + 1} / ${p.name.toUpperCase()}`, p.color); tag.position.set(p.x, .025, p.z + 2.2); this.group.add(tag);
      const inlay = new THREE.Mesh(new THREE.RingGeometry(.95, .98, 48), new THREE.MeshBasicMaterial({ color: '#f8f6d9', transparent: true, opacity: .65, side: THREE.DoubleSide })); inlay.rotation.x = -Math.PI / 2; inlay.position.set(p.x, p.height + .008, p.z); this.group.add(inlay);
    }
    // A small holographic human represents the user's cue source.
    const hologram = new THREE.MeshBasicMaterial({ color: '#8fe2c5', transparent: true, opacity: .7, wireframe: true });
    const person = new THREE.Group(); person.position.set(HUMAN.x, 0, HUMAN.z); this.group.add(person); this.arms = [];
    const head = new THREE.Mesh(new THREE.SphereGeometry(.29, 12, 8), hologram); head.position.y = 2.05; person.add(head);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(.34, .23, .8, 8), hologram); torso.position.y = 1.35; person.add(torso);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .83, 7), hologram); leg.position.set(side * .15, .53, 0); person.add(leg);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .76, 7), hologram); arm.position.set(side * .42, 1.3, 0); arm.rotation.z = side * .23; person.add(arm); this.arms.push(arm);
    }
    const footprint = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, .12, 48), stem); footprint.position.y = .06; person.add(footprint);
    const you = label('YOU / A FAMILIAR PRESENCE', '#9ce8ce'); you.position.set(-3.5, .03, 8.2); this.group.add(you);
    this.helloHalo = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.1, 48), new THREE.MeshBasicMaterial({ color: '#a5f2ce', transparent: true, opacity: .65, side: THREE.DoubleSide })); this.helloHalo.rotation.x = -Math.PI / 2; this.helloHalo.position.set(HELLO_SPOT.x, .02, HELLO_SPOT.z); this.group.add(this.helloHalo);
    // A climbing arch and a pair of low sculptural rails frame the play space.
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.5, .13, 12, 64, Math.PI), pale); arch.position.set(0, .2, -8.3); this.group.add(arch);
    for (const x of [-2.5, 2.5]) { const foot = new THREE.Mesh(new THREE.CylinderGeometry(.38, .5, .22, 24), stem); foot.position.set(x, .11, -8.3); this.group.add(foot); }
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.TorusGeometry(1.6, .09, 8, 32, Math.PI), material(side < 0 ? '#bca1cf' : '#b4c88e')); rail.position.set(side * 8, .05, .3); rail.rotation.y = side * Math.PI / 3; this.group.add(rail);
    }
    this.cue = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: '#b7ffe0', dashSize: .2, gapSize: .14, transparent: true, opacity: .65 })); this.group.add(this.cue); this.lastPerch = -1;
    const lamp = new THREE.PointLight('#b3ffe0', 25, 20); lamp.position.set(-3.5, 4, 6.5); this.group.add(lamp);
  }
  update(sim) {
    const t = sim.training, selected = t.active?.perch ?? t.selected;
    this.helloHalo.visible = selected === 'you'; this.helloHalo.material.opacity = .55 + Math.sin(sim.time * 3) * .2;
    this.arms.forEach(arm => { arm.rotation.x = t.active?.perch === 'you' ? -.9 + Math.sin(sim.time * 4) * .12 : 0; });
    this.halos.forEach((halo, index) => { const active = index === selected; halo.material.opacity = active ? .65 + Math.sin(sim.time * 3) * .2 : .2; halo.scale.setScalar(active ? 1.04 + Math.sin(sim.time * 3) * .03 : 1); });
    this.cue.visible = !!t.active && t.active.kind === 'call';
    if (selected !== this.lastPerch) { this.lastPerch = selected; const p = recallTarget(selected); this.cue.geometry.dispose(); this.cue.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(HUMAN.x, .16, HUMAN.z), new THREE.Vector3(p.x, p.height + .07, p.z)]); this.cue.computeLineDistances(); }
  }
}
