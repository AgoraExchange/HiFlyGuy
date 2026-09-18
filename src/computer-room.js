import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';

// The desk shares the habitat's floor coordinates, so scents, placement and
// spatial memories keep their meaning when the scenery changes.
export class ComputerRoom {
  constructor(container, scene) {
    this.group = new THREE.Group(); scene.add(this.group);
    const metal = new THREE.MeshStandardMaterial({ color: '#182836', metalness: .6, roughness: .42 });
    const dark = new THREE.MeshStandardMaterial({ color: '#101620', roughness: .8 });
    const cyan = new THREE.MeshBasicMaterial({ color: '#57ddd9' });
    const violet = new THREE.MeshBasicMaterial({ color: '#9560c8' });
    const box = (size, at, mat = metal) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
      mesh.position.set(...at); mesh.castShadow = true; mesh.receiveShadow = true; this.group.add(mesh); return mesh;
    };
    box([29, .65, 29], [0, -.36, -1]);
    box([28.7, .045, .05], [0, -.13, 13.5], cyan);
    box([.05, .045, 28.5], [-14.4, -.13, -1], cyan);
    for (const x of [-12, 12]) box([.7, 8, .7], [x, -4.5, 10]);
    // Laptop base, keyboard, touchpad, hinge and upright display.
    box([17.4, .34, 4], [0, .17, -12.25]);
    box([17.1, .04, .045], [0, .36, -10.27], cyan);
    box([3.7, .025, .5], [0, .36, -10.55], dark);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 17; col++) {
      box([.71, .07, .42], [(col - 8) * .87, .4, -11.05 - row * .56], dark);
      box([.28, .005, .018], [(col - 8) * .87, .44, -11.05 - row * .56], row % 2 ? cyan : violet);
    }
    box([16.9, .23, .28], [0, .46, -13.75]);
    box([17.4, 10.35, .32], [0, 5.6, -13.9]);
    box([16.6, .035, .025], [0, .64, -13.71], cyan);
    const webcam = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 8), cyan); webcam.position.set(0, 10.65, -13.7); this.group.add(webcam);
    // A transparent depth-writing screen reveals the DOM display behind WebGL.
    // Foreground geometry still occludes the display, including FlyGuy.
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(16.5, 9.9), new THREE.MeshBasicMaterial({ color: 0, opacity: 0, blending: THREE.NoBlending, side: THREE.FrontSide }));
    screen.position.set(0, 5.6, -13.72); this.group.add(screen); this.screen = screen;
    this.cssScene = new THREE.Scene();
    this.display = document.createElement('div'); this.display.className = 'laptop-display';
    this.iframe = document.createElement('iframe'); this.iframe.title = 'FlyGuy market terminal — TradingView';
    this.iframe.addEventListener('load', () => { this.lastTelemetry = -1; this.lastDeskActive = undefined; this.lastDeskView = undefined; this.setTerminalMode(this.iframe.parentElement !== this.display); });
    this.iframe.src = `${import.meta.env.BASE_URL}market.html`; this.iframe.tabIndex = -1; this.display.append(this.iframe);
    const surface = new CSS3DObject(this.display); surface.position.copy(screen.position); surface.scale.setScalar(.02); this.cssScene.add(surface);
    this.css = new CSS3DRenderer(); this.css.domElement.className = 'computer-display-layer'; container.prepend(this.css.domElement);
    // Night window: procedural city lights and mullions, no image assets needed.
    box([39, 20, .3], [0, 5, -17], dark);
    const windowMat = new THREE.MeshBasicMaterial({ color: '#080f20' });
    box([35, 15, .08], [0, 7, -16.78], windowMat);
    const lightMaterials = ['#2e4565', '#516c80', '#6b537d', '#657c8d'].map(color => new THREE.MeshBasicMaterial({ color }));
    for (let col = 0; col < 36; col++) for (let row = 0; row < 13; row++) {
      if ((col * 13 + row * 7) % 9 < 3) continue;
      box([.13, .3, .02], [-16.5 + col * .94, .8 + row * .96, -16.71], lightMaterials[(col + row * 3) % 4]);
    }
    for (const x of [-17.5, -8.75, 0, 8.75, 17.5]) box([.15, 16, .23], [x, 7, -16.55]);
    box([36, .16, .23], [0, 6, -16.55]);
    // Tower with two luminous fans, mug, speakers, and a large desk mat.
    box([3, 6.6, 4.3], [12.6, 3.3, -9.1], dark);
    for (const y of [1.7, 4.7]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.98, .065, 8, 48), cyan); ring.position.set(12.6, y, -6.93); this.group.add(ring);
      for (let i = 0; i < 6; i++) { const blade = box([.13, 1.25, .045], [12.6, y, -6.97]); blade.rotation.z = i * Math.PI / 3; }
    }
    for (const x of [-10.1, 10.1]) {
      box([1.5, 2.6, 1.5], [x, 1.3, -12.5], dark);
      const cone = new THREE.Mesh(new THREE.TorusGeometry(.46, .055, 8, 32), violet); cone.position.set(x, 1.55, -11.73); this.group.add(cone);
    }
    const mugMat = new THREE.MeshStandardMaterial({ color: '#786085', roughness: .5 });
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(.68, .58, 1.4, 32, 1, true), mugMat); mug.position.set(-12, .7, -5); this.group.add(mug);
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(.64, 32), dark); coffee.rotation.x = -Math.PI / 2; coffee.position.set(-12, 1.24, -5); this.group.add(coffee);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(.43, .11, 8, 24), mugMat); handle.position.set(-12.73, .7, -5); this.group.add(handle);
    const mat = box([21, .012, 18], [0, -.012, 1], new THREE.MeshStandardMaterial({ color: '#101e29', roughness: .96 })); mat.castShadow = false;
    const glow = new THREE.PointLight('#5bdce9', 90, 26, 2); glow.position.set(0, 6, -10); this.group.add(glow);
    const pink = new THREE.PointLight('#9b56d9', 65, 25, 2); pink.position.set(-12, 5, -3); this.group.add(pink);
    this.setVisible(false); this.lastTelemetry = -1;
  }
  setVisible(visible) { this.visible = visible; this.group.visible = visible; this.css.domElement.hidden = !visible; this.iframe.tabIndex = visible ? 0 : -1; }
  resize(w, h) { this.css.setSize(w, h); }
  setTerminalMode(expanded) { this.iframe.contentWindow?.postMessage({ type: 'market-mode', expanded }, location.origin); }
  screenHit(ray, scene) {
    if (!this.visible) return null;
    // Only the nearest visible surface can receive a screen click. The back of
    // the laptop and objects in front of it must not click through to the UI.
    const hit = ray.intersectObjects(scene.children, true).find(({ object }) => {
      if (!object.isMesh) return false;
      for (let p = object; p; p = p.parent) if (!p.visible) return false;
      return object === this.screen || !object.material.transparent || object.material.opacity >= .5;
    });
    return hit?.object === this.screen ? hit : null;
  }
  clickScreen(hit) {
    this.iframe.contentWindow?.postMessage({ type: 'market-pointer', x: hit.uv.x * 825, y: (1 - hit.uv.y) * 495 }, location.origin);
  }
  updateDesk(elapsed, sim, running) {
    const active = sim.life.deskFocus && sim.environment === 'computer' && sim.state === 'Locked in';
    if (!active) { this.deskElapsed = 0; this.deskStep = -1; this.deskClicked = false; }
    if (this.lastDeskActive !== (active && running)) {
      this.lastDeskActive = active && running;
      this.iframe.contentWindow?.postMessage({ type: 'desk-active', active: this.lastDeskActive, enabled: active }, location.origin);
      if (active && running && !this.deskClicked) this.deskStep = -1;
    }
    if (active && running) this.deskElapsed = (this.deskElapsed ?? 0) + elapsed;
    const wallet = active && (this.deskElapsed ?? 0) % 36 >= 24;
    if (this.lastDeskView !== wallet) {
      this.lastDeskView = wallet;
      this.iframe.contentWindow?.postMessage({ type: 'desk-view', wallet }, location.origin);
    }
    if (!active || !running) return;
    const step = Math.floor(this.deskElapsed / 2);
    if (step !== this.deskStep) {
      this.deskStep = step; this.deskClicked = false;
      this.iframe.contentWindow?.postMessage({ type: 'desk-action', step, click: false }, location.origin);
    }
    if (!this.deskClicked && this.deskElapsed % 2 >= .45) {
      this.deskClicked = true;
      this.iframe.contentWindow?.postMessage({ type: 'desk-action', step, click: true }, location.origin);
    }
  }
  update(camera, sim) {
    if (!this.visible) return;
    this.css.render(this.cssScene, camera);
    if (Math.abs(sim.time - this.lastTelemetry) > .2) {
      this.lastTelemetry = sim.time;
      this.iframe.contentWindow?.postMessage({ type: 'flyguy-telemetry', state: sim.state, energy: sim.energy, time: sim.time, signals: sim.signals }, location.origin);
    }
  }
}
