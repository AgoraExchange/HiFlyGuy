import { PARK, parkWalkingHeight } from './park-layout.js';
import * as THREE from 'three';
import { HUMAN } from './training.js';
import { withinHabitat } from './simulation.js';
import { ROOMS } from './life.js';
import { separateViewer } from './presence.js';

// A camera at the familiar presence's actual eye height. World geometry stays unchanged.
export class FirstPerson {
  constructor(habitat, { selectFruit, place, cancelPlacement, inviteFly }) {
    this.habitat = habitat; this.keys = new Set(); this.active = false; this.cancelPlacement = cancelPlacement;
    this.stick = { x: 0, y: 0 }; this.touchRun = false;
    const button = document.createElement('button'); button.id = 'first-person-btn'; button.type = 'button'; button.hidden = true;
    button.textContent = 'Join World'; button.setAttribute('aria-pressed', 'false');
    button.title = 'Explore the playground in first person and interact with FlyGuy';
    document.querySelector('#autonomy-btn').after(button); this.button = button;
    this.button.onclick = () => this.active ? this.exit() : this.enter();
    const hud = document.createElement('div'); hud.className = 'first-person-hud'; hud.hidden = true;
    hud.innerHTML = `<div class="first-person-top"><div><strong>YOU / INSIDE HIS WORLD</strong><span class="desktop-look-hint">WASD move · Arrows look · Hold Space to run · Q / E down / up</span><span class="touch-look-hint">Left thumb moves · Right finger looks</span><span id="first-person-presence"></span></div><button id="exit-first-person">Exit first person</button></div>
      <span class="first-person-crosshair" aria-hidden="true">+</span>
      <div class="first-person-bottom"><div class="first-person-movement" role="group" aria-label="Move through the playground">
      <button data-move="KeyW" aria-label="Fly forward">↑</button><button data-move="KeyA" aria-label="Fly left">←</button><button data-move="KeyS" aria-label="Fly backward">↓</button><button data-move="KeyD" aria-label="Fly right">→</button><button data-move="KeyQ" aria-label="Fly lower">−</button><button data-move="KeyE" aria-label="Fly higher">+</button></div>
      <div class="first-person-touch"><div id="movement-joystick" role="group" aria-label="Movement joystick: drag with your left thumb"><span class="joystick-thumb"></span><span class="joystick-caption">MOVE</span></div><button id="touch-run" aria-pressed="false">Run</button></div>
      <div class="first-person-fruit"><button data-fruit="banana">Banana</button><button data-fruit="tomato">Tomato</button><button id="first-person-drop">Place in front</button><button id="first-person-find">Invite FlyGuy</button><button id="first-person-train" aria-expanded="false">Train FlyGuy</button><button id="first-person-slide" hidden>Slide down</button><button id="first-person-home" title="Return to your original eye position">Back to your spot</button></div></div>`;
    habitat.container.append(hud); this.hud = hud;
    const joystick = hud.querySelector('#movement-joystick'), thumb = joystick.querySelector('.joystick-thumb');
    this.releaseStick = () => { this.stick = { x: 0, y: 0 }; this.stickPointer = null; thumb.style.transform = 'translate(0px, 0px)'; joystick.classList.remove('engaged'); };
    const moveStick = e => {
      const r = joystick.getBoundingClientRect(), radius = r.width * .32;
      const dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
      const length = Math.hypot(dx,dy), scale = length > radius ? radius / length : 1;
      this.stick.x = length < radius * .12 ? 0 : dx * scale / radius;
      this.stick.y = length < radius * .12 ? 0 : dy * scale / radius;
      thumb.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
    };
    joystick.onpointerdown = e => { if(this.stickPointer != null)return;e.preventDefault();this.stickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);joystick.classList.add('engaged');moveStick(e); };
    joystick.onpointermove = e => { if(e.pointerId===this.stickPointer){e.preventDefault();moveStick(e);} };
    joystick.onpointerup = joystick.onpointercancel = joystick.onlostpointercapture = e => { if(e.pointerId===this.stickPointer)this.releaseStick(); };
    hud.querySelector('#touch-run').onclick = e => { this.touchRun=!this.touchRun;e.currentTarget.setAttribute('aria-pressed',String(this.touchRun));e.currentTarget.textContent=this.touchRun?'Running':'Run'; };
    hud.querySelector('#exit-first-person').onclick = () => this.exit();
    hud.querySelector('#first-person-home').onclick = () => this.home();
    hud.querySelector('#first-person-train').onclick = e => {
      const open=habitat.container.classList.toggle('first-person-training');
      e.currentTarget.setAttribute('aria-expanded',String(open));e.currentTarget.textContent=open?'Close training':'Train FlyGuy';
      if(open)document.querySelector('#training-dock').hidden=false;
      this.keys.clear();this.releaseStick();
    };
    hud.querySelector('#first-person-slide').onclick = () => this.startSlide();
    hud.querySelector('#first-person-find').onclick = () => {
      if (this.sim?.environment !== 'playground') { inviteFly(); return; }
      const direction = habitat.fly.group.position.clone().sub(habitat.camera.position);
      this.yaw = Math.atan2(-direction.x, -direction.z);
      this.pitch = Math.max(-1.35, Math.min(1.35, Math.atan2(direction.y, Math.hypot(direction.x, direction.z)))); this.look();
    };
    hud.querySelectorAll('[data-fruit]').forEach(button => button.onclick = () => selectFruit(button.dataset.fruit));
    hud.querySelector('#first-person-drop').onclick = () => { const p = this.ahead(); place(p.x, p.z); };
    hud.querySelectorAll('[data-move]').forEach(button => {
      button.onpointerdown = e => { e.preventDefault(); button.setPointerCapture(e.pointerId); this.keys.add(button.dataset.move); };
      button.onpointerup = button.onpointercancel = button.onlostpointercapture = () => this.keys.delete(button.dataset.move);
    });
    const canvas = habitat.renderer.domElement;
    canvas.addEventListener('pointerdown', e => {
      if (!this.active || habitat.swatterMode || e.button !== 0) return;
      this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!this.active || this.pointer?.id !== e.pointerId) return;
      this.yaw -= (e.clientX - this.pointer.x) * .004;
      this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - (e.clientY - this.pointer.y) * .004));
      this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.look();
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, () => { this.pointer = null; });
    document.addEventListener('keydown', e => {
      if (!this.active || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable || document.querySelector('dialog[open]')) return;
      if (e.code === 'Escape') { this.exit(); return; }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) { e.preventDefault(); this.keys.add(e.code); }
    });
    document.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.pointer = null; this.releaseStick(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.keys.clear(); this.releaseStick(); } });
  }
  home() {
    this.habitat.endEncounter();
    this.sliding = null;
    this.walking = true;
    this.releaseStick();
    this.keys.clear(); this.habitat.camera.position.set(HUMAN.x, 2.05, HUMAN.z);
    this.previousEye = this.habitat.camera.position.clone(); this.previousFly = null;
    this.yaw = 0; this.pitch = -.1; this.look();
  }
  look() { this.habitat.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')); }
  enter() {
    const h = this.habitat; if (h.environment !== 'playground') return;
    h.endEncounter(); this.cancelPlacement();
    this.saved = { position: h.camera.position.clone(), target: h.controls.target.clone(), fov: h.camera.fov, follow: h.follow, homeFraming: h.homeFraming };
    this.active = true; h.follow = h.homeFraming = false; h.controls.enabled = false;
    h.playground.person.visible = false; h.camera.fov = 65; h.camera.updateProjectionMatrix(); this.home();
    h.container.classList.add('first-person'); h.container.dataset.firstPerson = 'true'; this.hud.hidden = false;
    this.button.textContent = 'Return to overhead view'; this.button.setAttribute('aria-pressed', 'true');
    h.renderer.domElement.setAttribute('aria-label', 'First person playground. Drag to look. W A S D to move. Arrow keys to look. Hold Space to run; Q and E to change height.');
    h.renderer.domElement.focus({ preventScroll: true }); h.container.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
  exit() {
    if (!this.active) return;
    this.habitat.endEncounter(); if (this.sim) this.sim.observer = null;
    const h = this.habitat; this.active = false; this.keys.clear(); this.pointer = null;
    this.releaseStick(); this.sliding=null; this.touchRun=false;this.hud.querySelector('#touch-run').setAttribute('aria-pressed','false');this.hud.querySelector('#touch-run').textContent='Run';
    this.cancelPlacement(); h.playground.person.visible = true;
    h.camera.position.copy(this.saved.position); h.camera.fov = this.saved.fov; h.camera.updateProjectionMatrix();
    h.controls.target.copy(this.saved.target); h.controls.enabled = true; h.controls.update();
    h.follow = this.saved.follow; h.homeFraming = this.saved.homeFraming;
    h.container.classList.remove('first-person'); h.container.dataset.firstPerson = 'false'; this.hud.hidden = true;
    h.container.classList.remove('first-person-training');this.hud.querySelector('#first-person-train').setAttribute('aria-expanded','false');this.hud.querySelector('#first-person-train').textContent='Train FlyGuy';
    document.querySelector('#training-dock').hidden=document.querySelector('#training-toggle').getAttribute('aria-expanded')!=='true';
    this.button.textContent = 'Join World'; this.button.setAttribute('aria-pressed', 'false');
    h.renderer.domElement.setAttribute('aria-label', 'Interactive 3D habitat. Drag to orbit, scroll to zoom.');
  }
  ahead() {
    const direction = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const p = this.habitat.camera.position.clone().addScaledVector(direction, 2.5);
    return withinHabitat(p.x, p.z, PARK.objectRadius - .1);
  }
  addressSpot() {
    if (this.sliding) return null;
    const h = this.habitat, direction = h.camera.getWorldDirection(new THREE.Vector3());
    const point = h.camera.position.clone().addScaledVector(direction, 4.5);
    // Wait for a view with enough room to hover in front of the person.
    if (Math.hypot(point.x, point.z) > PARK.flyRadius - .3 || point.y < 1.6 || point.y > 9) return null;
    return point;
  }
  nearbySlide() {
    const p = this.habitat.camera.position;
    return this.habitat.playground?.slides?.find(s => Math.hypot(p.x-s.top.x,p.z-s.top.z)<1.6 && Math.abs(p.y-PARK.eyeHeight-s.top.y)<.3);
  }
  startSlide() {
    const slide = this.nearbySlide(); if (!slide || this.sliding) return;
    this.sliding = { slide, elapsed: 0, duration: 3.2 };
    this.keys.clear(); this.releaseStick();
  }
  resolvePresence(sim) {
    if (!this.active) return;
    const h = this.habitat, eye = h.camera.position, fly = h.fly.group.position;
    if (sim.environment === 'playground') {
      eye.copy(separateViewer(this.previousEye ?? eye, eye, this.previousFly ?? fly, fly));
      this.previousFly = fly.clone();
    } else this.previousFly = null;
    this.previousEye = eye.clone();
    // Transient observer position: deliberately excluded from saved world state.
    sim.observer = { x: eye.x, y: eye.y, z: eye.z, forwardX:-Math.sin(this.yaw),forwardZ:-Math.cos(this.yaw) };
  }
  update(dt, sim) {
    this.sim = sim;
    const h = this.habitat; this.button.hidden = h.environment !== 'playground';
    if (!this.active) return;
    if (h.environment !== 'playground') { this.exit(); return; }
    const slideButton = this.hud.querySelector('#first-person-slide');
    const nearSlide = this.nearbySlide();
    slideButton.hidden = !nearSlide || !!this.sliding;
    if (document.hidden || document.querySelector('dialog[open]')) { this.keys.clear(); this.releaseStick(); return; }
    if (this.sliding) {
      this.sliding.elapsed += Math.min(dt,.1);
      const progress=Math.min(1,this.sliding.elapsed/this.sliding.duration), point=this.sliding.slide.path.getPoint(progress), tangent=this.sliding.slide.path.getTangent(progress);
      h.camera.position.set(point.x,point.y+PARK.eyeHeight*.72,point.z);
      this.yaw=Math.atan2(-tangent.x,-tangent.z);this.pitch=Math.atan2(tangent.y,Math.hypot(tangent.x,tangent.z));this.look();
      sim.observer={x:h.camera.position.x,y:h.camera.position.y,z:h.camera.position.z,forwardX:-Math.sin(this.yaw),forwardZ:-Math.cos(this.yaw)};
      if(progress>=1){
        this.sliding=null;this.walking=true;
        h.camera.position.addScaledVector(new THREE.Vector3(tangent.x,0,tangent.z).normalize(),1.4);
        h.camera.position.y=PARK.eyeHeight;
      }
      return;
    }
    const present = sim.environment === 'playground';
    this.hud.querySelector('#first-person-presence').textContent = present ? `FlyGuy / ${h.encounter?.firstPerson ? 'Talking to you' : sim.state}` : `FlyGuy is in ${ROOMS[sim.environment]?.name ?? sim.environment}`;
    this.hud.querySelector('#first-person-find').textContent = present ? 'Look at FlyGuy' : 'Invite FlyGuy';
    this.hud.querySelector('#first-person-drop').disabled = !h.placing;
    if (document.hidden || document.querySelector('dialog[open]')) { this.keys.clear(); this.releaseStick(); return; }
    if (h.encounter?.firstPerson) { this.keys.clear(); this.releaseStick(); return; }
    const k = code => Number(this.keys.has(code));
    if (k('KeyE') || k('KeyQ')) this.walking=false;
    this.yaw += (k('ArrowLeft') - k('ArrowRight')) * Math.min(dt, .1) * 1.5;
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch + (k('ArrowUp') - k('ArrowDown')) * Math.min(dt, .1) * 1.2));
    const direction = new THREE.Vector3(k('KeyD') - k('KeyA') + this.stick.x, k('KeyE') - k('KeyQ'), k('KeyS') - k('KeyW') + this.stick.y);
    direction.clampLength(0,1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    h.camera.position.addScaledVector(direction, Math.min(dt, .1) * (k('Space') || this.touchRun ? PARK.runSpeed : PARK.walkSpeed));
    const p = h.camera.position, radius = Math.hypot(p.x, p.z), bound = PARK.flyRadius;
    if (radius > bound) { p.x *= bound / radius; p.z *= bound / radius; }
    p.y = Math.max(.6, Math.min(9, p.y));
    // Colliders match tree trunks, benches, planters, equipment and fence posts.
    const distance = this.previousEye ? this.previousEye.distanceTo(p) : 0;
    const steps = Math.max(1, Math.ceil(distance / .18)), target = p.clone();
    if (this.previousEye) p.copy(this.previousEye);
    const movement = target.clone().sub(p).divideScalar(steps);
    for (let step=0;step<steps;step++) {
      const before = p.clone();
      p.add(movement);
      const floor = parkWalkingHeight(p.x,p.z);
      if (this.walking) {
        if (floor > before.y-PARK.eyeHeight+.4) { p.copy(before); continue; }
        if (movement.lengthSq()>0 || floor>0) p.y=floor+PARK.eyeHeight;
      } else if (p.y<=floor+PARK.eyeHeight && before.y>=floor+PARK.eyeHeight) {
        p.y=floor+PARK.eyeHeight;this.walking=true;
      }
      for (const obstacle of h.playground.colliders) {
        if (p.y - PARK.eyeHeight >= obstacle.height-.01 || p.y + .2 <= obstacle.base) continue;
        const dx=p.x-obstacle.x,dz=p.z-obstacle.z,d=Math.hypot(dx,dz),r=obstacle.radius+.32;
        if(d<r){p.x=obstacle.x+(d>.001?dx/d:1)*r;p.z=obstacle.z+(d>.001?dz/d:0)*r;}
      }
    }
    this.look();
    sim.observer = { x: p.x, y: p.y, z: p.z, forwardX:-Math.sin(this.yaw),forwardZ:-Math.cos(this.yaw) };
  }
}
