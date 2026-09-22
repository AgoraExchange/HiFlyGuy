import { newLife, updateLife, lifeMotion, roomHeight, ROOMS, LIFE_STATES } from './life.js';
// A deliberately small, synthetic rate network. No FlyWire records are loaded.
import { newTraining, updateTraining, requestLesson, rewardLesson, cancelLesson, lessonMotion, perchMotion, surfaceHeight, TRAINING_STATES } from './training.js';
export const NEURAL_UNITS=768, NEURAL_GROUP_SIZE=192, NEURAL_CONNECTIONS=4608;
export const STIMULI = {
  banana: { name: 'Ripe banana', scent: 1, color: '#e5c76a', description: 'Sweet, fermenting fruit', response: 'Food attraction' },
  tomato: { name: 'Fresh tomato', scent: 0.65, color: '#e08169', description: 'A softer scent to explore', response: 'Gentle attraction' },
  peppermint: { name: 'Peppermint candy', scent: -1, color: '#b9d6cb', description: 'Something a little intense', response: 'Scent avoidance' },
};
export function seededRandom(seed = 42) {
  const next = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  next.getState = () => seed >>> 0;
  return next;
}
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const WORLD = { radius: 11, flyRadius: 9.9, objectRadius: 9.7 };
export const SWATTER = { speed: 2.4, escapeSpeed: 5.4, alarmRadius: 3.8, clearance: 1.8, radius: 12 };
export function withinHabitat(x, z, radius = WORLD.objectRadius) {
  const distance = Math.hypot(x, z), scale = distance > radius ? radius / distance : 1;
  return { x: x * scale, z: z * scale };
}
export class Simulation {
  constructor() { this.reset(); }
  reset() {
    this.random = seededRandom(78); this.time = 0; this.x = 0; this.z = 0; this.y = 1.5; this.heading = 0.65;
    this.energy = 0.85; this.hunger = 0.62; this.state = 'Exploring'; this.objects = []; this.nextId = 1;
    this.target = null; this.speed = 0; this.startle = 0; this.signals = { scent: 0, aversion: 0, motor: 0, reward: 0 };
    this.appetite = true; this.memories = []; this.nextMemoryId = 1; this.caution = 0;
    this.waypoint = { x: 2, z: 4 }; this.waypointUntil = 0; this.lastMemoryLog = -20;
    this.nextGroomAt = 24; this.groomingUntil = 0;
    this.swatter = { active: false, x: 0, z: 0, targetX: 0, targetZ: 0 };
    this.distress = 0; this.escapeX = 0; this.escapeZ = 0;
    this.environment = 'habitat'; this.watchScreen = false;
    this.training = newTraining(); this.life = newLife();
    this.activity = new Float32Array(NEURAL_UNITS); this.edges = [];
    const neuralRandom=seededRandom(7853);
    // Keep the existing behavior RNG sequence stable while expanding the network.
    for(let i=0;i<1536;i++)this.random();
    for (let i=0;i<NEURAL_UNITS;i++) for(let j=0;j<6;j++) this.edges.push({from:i,to:Math.floor(i/NEURAL_GROUP_SIZE)*NEURAL_GROUP_SIZE+Math.floor(neuralRandom()*NEURAL_GROUP_SIZE),weight:(.045+neuralRandom()*.055)*4/6});
    this.events = []; this.log('A little world, ready to explore.', 'system');
  }
  log(message, type = 'behavior') { this.events.unshift({ time: this.time, message, type }); this.events.length = Math.min(100, this.events.length); }
  requestLesson(kind, guided = true) { return requestLesson(this, kind, guided); }
  rewardLesson() { return rewardLesson(this); }
  cancelLesson() { cancelLesson(this, 'A little break. Your learned skills are saved.'); }
  groundHeight(x = this.x, z = this.z, room = this.environment) { return Math.max(surfaceHeight(room, x, z), roomHeight(room, x, z)); }
  roomObjects(room = this.environment) { return this.objects.filter(o => (o.room ?? this.environment) === room); }
  roomMemories(room = this.environment) { return this.memories.filter(m => (m.room ?? this.environment) === room); }
  add(kind, x, z, room = this.environment) {
    if (!STIMULI[kind] || !Object.hasOwn(ROOMS, room) || this.roomObjects(room).length >= 8) return null;
    const object = { id: this.nextId++, kind, room, ...withinHabitat(x, z), amount: 1 };
    this.objects.push(object); this.log(`${STIMULI[kind].name} placed in ${ROOMS[room].name}.`, 'object'); return object;
  }
  remove(id) { this.objects = this.objects.filter(o => o.id !== id); if (this.target?.id === id) this.target = null; }
  clear(room = this.environment) { this.objects = this.objects.filter(o => (o.room ?? this.environment) !== room); if (this.target && !this.objects.includes(this.target)) this.target = null; this.log(`${ROOMS[room].name} objects cleared.`, 'system'); }
  aimSwatter(x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    const target = withinHabitat(x, z, SWATTER.radius), swatter = this.swatter;
    if (!swatter.active) {
      // Equip near the pointer without spawning on top of FlyGuy.
      let start = target;
      if (Math.hypot(target.x - this.x, target.z - this.z) < 3.4) {
        let best = Infinity;
        for (let i = 0; i < 32; i++) {
          const a = i * Math.PI / 16, candidate = { x: this.x + Math.sin(a) * 3.4, z: this.z + Math.cos(a) * 3.4 };
          const score = Math.hypot(candidate.x - target.x, candidate.z - target.z);
          if (Math.hypot(candidate.x, candidate.z) <= SWATTER.radius && score < best) { start = candidate; best = score; }
        }
      }
      swatter.x = start.x; swatter.z = start.z; swatter.active = true;
    }
    swatter.targetX = target.x; swatter.targetZ = target.z;
  }
  putAwaySwatter() { this.swatter.active = false; }
  updateSwatter(dt) {
    const s = this.swatter;
    if (s.active) {
      const dx = s.targetX - s.x, dz = s.targetZ - s.z, d = Math.hypot(dx, dz), step = Math.min(d, SWATTER.speed * dt);
      const x = s.x + dx / (d || 1) * step, z = s.z + dz / (d || 1) * step;
      if (Math.hypot(x - this.x, z - this.z) >= SWATTER.clearance) { s.x = x; s.z = z; }
    }
    const near = s.active && Math.hypot(s.x - this.x, s.z - this.z) < SWATTER.alarmRadius;
    if (near) { this.startle = 1.3; this.escapeX = s.x; this.escapeZ = s.z; }
    this.distress = clamp(this.distress + dt * (near ? 1.2 : -0.22), 0, 1);
  }
  escapeDirection() {
    // Score safe escape routes ahead, including tangential routes along the wall.
    let direction = { x: 0, z: 1 }, best = -Infinity;
    for (let i = 0; i < 48; i++) {
      const a = i * Math.PI / 24, x = Math.sin(a), z = Math.cos(a);
      const px = this.x + x * 1.15, pz = this.z + z * 1.15;
      if (Math.hypot(px, pz) > WORLD.flyRadius - 0.02) continue;
      const clearance = Math.hypot(px - this.escapeX, pz - this.escapeZ);
      const continuity = (x * Math.sin(this.heading) + z * Math.cos(this.heading)) * 0.04;
      if (clearance + continuity > best) { best = clearance + continuity; direction = { x, z }; }
    }
    return direction;
  }
  memoryRisk(x, z) {
    return Math.min(1, this.roomMemories().reduce((risk, m) => risk + m.strength * Math.exp(-(Math.hypot(x - m.x, z - m.z) ** 2) / 12), 0));
  }
  updateMemories(dt) {
    for (const m of this.memories) m.strength *= Math.exp(-dt / 300);
    for (const o of this.roomObjects()) {
      if (o.kind !== 'peppermint' || Math.hypot(o.x - this.x, o.z - this.z) > 3.4) continue;
      let m = this.roomMemories().find(m => Math.hypot(m.x - o.x, m.z - o.z) < 1.8);
      if (!m) {
        m = { id: this.nextMemoryId++, room: this.environment, x: o.x, z: o.z, strength: 0.12, encounters: 0, lastEncounter: -20, lastSeen: -20 };
        this.memories.push(m);
        if (this.memories.length > 32) this.memories.splice(this.memories.indexOf(this.memories.reduce((a, b) => a.strength < b.strength ? a : b)), 1);
      }
      if (this.time - m.lastSeen > 3 && this.time - m.lastEncounter > 6) {
        m.encounters++; m.lastEncounter = this.time;
        m.strength = Math.min(1, m.strength + 0.17);
        this.log(m.encounters === 1 ? 'Remembering this spot: that peppermint was unpleasant.' : 'Another peppermint encounter. More cautious about this spot.', 'memory');
      }
      m.lastSeen = this.time;
      m.strength = Math.min(1, m.strength + dt * 0.1);
    }
    // Safe visits weaken the association; removing an object alone does not erase it.
    for (const m of this.memories) {
      const nearby = (m.room ?? this.environment) === this.environment && Math.hypot(m.x - this.x, m.z - this.z) < 2.1;
      const dangerous = this.roomObjects().some(o => o.kind === 'peppermint' && Math.hypot(m.x - o.x, m.z - o.z) < 3.4);
      if (nearby && !dangerous) m.strength = Math.max(0, m.strength - dt * (this.state === 'Feeding' ? 0.025 : 0.006));
    }
    this.memories = this.memories.filter(m => m.strength >= 0.025);
  }
  chooseWaypoint() {
    let best, bestScore = -Infinity;
    for (let i = 0; i < 18; i++) {
      const angle = this.random() * Math.PI * 2, radius = Math.sqrt(this.random()) * 8.7;
      const point = { x: Math.sin(angle) * radius, z: Math.cos(angle) * radius };
      const distance = Math.hypot(point.x - this.x, point.z - this.z);
      let risk = 0;
      for (const fraction of [0.3, 0.6, 1]) risk += this.memoryRisk(this.x + (point.x - this.x) * fraction, this.z + (point.z - this.z) * fraction);
      const score = Math.min(distance, 5) * 0.15 - risk * 3 + this.random() * 0.35;
      if (score > bestScore) { bestScore = score; best = point; }
    }
    this.waypoint = best; this.waypointUntil = this.time + 12;
  }
  tick(dt) {
    if (dt <= 0) return;
    this.time += dt; this.startle = Math.max(0, this.startle - dt);
    this.updateSwatter(dt);
    updateTraining(this, dt);
    updateLife(this, dt);
    this.hunger = clamp(this.hunger + dt * 0.002, 0, 1);
    // Hysteresis: finish a meal at 12%; seek a new one only after hunger reaches 40%.
    if (this.appetite) {
      if (this.hunger <= 0.12 && this.energy >= 0.48) this.appetite = false;
    } else if (this.hunger >= 0.4 || this.energy < 0.25) this.appetite = true;
    this.updateMemories(dt);
    let food = null, foodScore = 0, avoid = null, avoidScore = 0;
    for (const o of this.roomObjects()) {
      const d = Math.hypot(o.x - this.x, o.z - this.z);
      const s = Math.abs(STIMULI[o.kind].scent) * Math.exp(-d / 3.5) * o.amount;
      if (STIMULI[o.kind].scent > 0 && s > foodScore && o.amount > 0.04) { foodScore = s; food = o; }
      if (STIMULI[o.kind].scent < 0 && s > avoidScore) { avoidScore = s; avoid = o; }
    }
    const lure = this.appetite ? Math.min(1, foodScore * (0.65 + this.hunger)) : 0;
    const aheadX = this.x + Math.sin(this.heading) * 1.2, aheadZ = this.z + Math.cos(this.heading) * 1.2;
    this.caution = Math.max(this.memoryRisk(this.x, this.z), this.memoryRisk(aheadX, aheadZ)) * (1 - lure * 0.95);
    const external = [foodScore * (0.35 + this.hunger), avoidScore + this.caution * 0.45 + this.startle * 0.4 + this.distress * 0.7, this.energy * 0.23 + this.distress * 0.65, this.state === 'Feeding' ? 0.9 : 0.02];
    const recurrent = new Float32Array(NEURAL_UNITS);
    for (const e of this.edges) recurrent[e.to] += this.activity[e.from] * e.weight;
    const groups = [0, 0, 0, 0];
    for (let i = 0; i < NEURAL_UNITS; i++) {
      const g = Math.floor(i / NEURAL_GROUP_SIZE);
      const drive = clamp(external[g] + recurrent[i] + 0.015 * Math.sin(this.time * 4 + i), 0, 1);
      this.activity[i] += (drive - this.activity[i]) * Math.min(1, dt * 6);
      groups[g] += this.activity[i] / NEURAL_GROUP_SIZE;
    }
    this.signals = { scent: groups[0], aversion: groups[1], motor: groups[2], reward: groups[3] };
    const previous = this.state;
    let dx, dz, motion, velocity = 0.6 + groups[2] * 1.4, desiredY = 1.65;
    const committed = this.target?.id === food?.id && ['Seeking food', 'Feeding'].includes(previous);
    this.target = null;
    const danger = avoidScore > (previous === 'Avoiding' ? 0.3 : 0.48);
    if (this.life.deskFocus && this.life.route.length && (motion = lifeMotion(this, dt))) {
      this.state = motion.state; dx = motion.dx; dz = motion.dz; velocity = motion.velocity; desiredY = motion.y;
    } else if (this.life.deskFocus && this.environment === 'computer' && !this.life.route.length) {
      dx = -this.x; dz = -8.8 - this.z;
      if (Math.hypot(dx, dz) < .45) {
        this.state = 'Locked in'; velocity = 0; desiredY = .87;
        this.heading += Math.atan2(Math.sin(Math.PI - this.heading), Math.cos(Math.PI - this.heading)) * Math.min(1, dt * 5);
        this.energy = Math.min(1, this.energy + dt * .003);
      } else { this.state = 'Approaching screen'; velocity = 2.2; desiredY = 1.4; }
    } else if (this.startle > 0) {
      this.state = 'Panicking'; const escape = this.escapeDirection(); dx = escape.x; dz = escape.z;
      velocity = SWATTER.escapeSpeed; desiredY = 2.9;
    } else if (groups[1] > 0.3 && danger) {
      this.state = 'Avoiding'; dx = this.x - (avoid?.x ?? this.x - 1); dz = this.z - (avoid?.z ?? this.z - 1);
      if (Math.hypot(dx, dz) < 0.01) dx = 1;
      velocity = 1.8; desiredY = 2.4;
    } else if (this.life.route.length && (motion = lifeMotion(this, dt))) {
      this.state = motion.state; dx = motion.dx; dz = motion.dz; velocity = motion.velocity; desiredY = motion.y;
    } else if (this.energy < 0.13 || (previous === 'Resting' && this.energy < 0.48)) {
      this.state = 'Resting'; velocity = 0; desiredY = 0.87; this.energy += dt * 0.018;
    } else if (food && groups[0] > (committed ? 0.025 : 0.075) && this.appetite) {
      this.target = food; dx = food.x - this.x; dz = food.z - this.z;
      if (Math.hypot(dx, dz) < 0.95 && this.caution < 0.23) {
        this.state = 'Feeding'; velocity = 0; desiredY = 0.87;
        this.hunger = Math.max(0, this.hunger - dt * 0.036); this.energy = Math.min(1, this.energy + dt * 0.025);
        food.amount = Math.max(0, food.amount - dt * 0.012);
        if (this.hunger <= 0.12 && this.energy >= 0.48) this.appetite = false;
      } else { this.state = 'Seeking food'; desiredY = 1.05; }
    } else if (this.environment === 'playground' && (motion = lessonMotion(this))) {
      this.state = motion.state; dx = motion.dx; dz = motion.dz; velocity = motion.velocity; desiredY = motion.y;
    } else if ((motion = lifeMotion(this, dt))) {
      this.state = motion.state; dx = motion.dx; dz = motion.dz; velocity = motion.velocity; desiredY = motion.y;
    } else if (this.time >= this.nextGroomAt || (previous === 'Grooming' && this.time < this.groomingUntil)) {
      if (previous !== 'Grooming') {
        this.groomingUntil = this.time + 6;
        this.nextGroomAt = this.groomingUntil + 30 + this.random() * 25;
      }
      this.state = 'Grooming'; velocity = 0; desiredY = 0.87;
      this.energy = Math.min(1, this.energy + dt * 0.005);
    } else if (this.environment === 'computer' && this.watchScreen) {
      dx = -this.x; dz = -6.5 - this.z;
      if (Math.hypot(dx, dz) < .65) {
        this.state = 'Watching screen'; velocity = 0; desiredY = .87;
        const facing = Math.PI + Math.sin(this.time * .7) * .08;
        this.heading += Math.atan2(Math.sin(facing - this.heading), Math.cos(facing - this.heading)) * Math.min(1, dt * 3);
        this.energy = Math.min(1, this.energy + dt * .003);
      } else { this.state = 'Approaching screen'; desiredY = 1.4; }
    } else if (this.environment === 'playground' && (motion = perchMotion(this))) {
      this.state = motion.state; dx = motion.dx; dz = motion.dz; velocity = motion.velocity; desiredY = motion.y;
    } else {
      this.state = 'Exploring';
      if (this.time >= this.waypointUntil || Math.hypot(this.waypoint.x - this.x, this.waypoint.z - this.z) < 0.8) this.chooseWaypoint();
      dx = this.waypoint.x - this.x; dz = this.waypoint.z - this.z;
    }
    if (!this.life.deskFocus && !['Panicking', 'Avoiding', 'Feeding', ...LIFE_STATES].includes(this.state) && this.caution > (previous === 'Cautious' ? 0.09 : 0.17)) {
      this.state = 'Cautious'; velocity = 0.75; desiredY = 1.9;
      if (previous !== 'Cautious' && this.time - this.lastMemoryLog > 12) {
        this.log('I remember this area. Keeping a little distance.', 'memory'); this.lastMemoryLog = this.time;
      }
    }
    if (velocity > 0) {
      const length = Math.hypot(dx ?? 0, dz ?? 1) || 1; dx = (dx ?? 0) / length; dz = (dz ?? 1) / length;
      if (!this.life.deskFocus && !['Panicking', 'Avoiding', ...LIFE_STATES].includes(this.state)) for (const m of this.roomMemories()) {
        const mx = this.x - m.x, mz = this.z - m.z, distance = Math.hypot(mx, mz);
        const force = m.strength * Math.exp(-distance * distance / 16) * 3.2 * (1 - lure * 0.95);
        dx += (distance > 0.01 ? mx / distance : 1) * force; dz += (distance > 0.01 ? mz / distance : 0) * force;
      }
      const edgeDistance = Math.hypot(this.x, this.z);
      if (this.state !== 'Panicking' && edgeDistance > WORLD.flyRadius - 1.5) { const push = (edgeDistance - WORLD.flyRadius + 1.5) * 2; dx -= this.x / edgeDistance * push; dz -= this.z / edgeDistance * push; }
      const angle = Math.atan2(dx, dz), diff = Math.atan2(Math.sin(angle - this.heading), Math.cos(angle - this.heading));
      this.heading += diff * (this.state === 'Panicking' ? 1 : Math.min(1, dt * 2.8));
      const next = withinHabitat(this.x + Math.sin(this.heading) * velocity * dt, this.z + Math.cos(this.heading) * velocity * dt, WORLD.flyRadius);
      this.x = next.x; this.z = next.z;
      this.energy = Math.max(0, this.energy - dt * 0.0018);
    }
    this.speed = velocity;
    {
      desiredY = Math.max(desiredY, this.groundHeight() + .87);
      // Raise the approach before crossing a platform rim; no walking through it.
      if (velocity) desiredY = Math.max(desiredY, this.groundHeight(this.x + Math.sin(this.heading) * 1.3, this.z + Math.cos(this.heading) * 1.3) + 1.2);
    }
    if ((this.training.active || this.training.pending) && !TRAINING_STATES.includes(this.state)) cancelLesson(this, 'Something else needs his attention. Try the lesson again when he is settled.');
    this.y += (desiredY + (velocity ? Math.sin(this.time * 3.4) * 0.09 : 0) - this.y) * Math.min(1, dt * 3);
    if (this.state !== previous && this.state !== 'Cautious') this.log(({ ...Object.fromEntries(LIFE_STATES.map(s => [s, s === 'Heading out' ? `Heading for ${ROOMS[this.life.destination]?.name ?? 'another room'}.` : `${s}.`])), Listening: 'Listening for your cue.', 'Coming when called': this.training.active?.perch === 'you' ? 'Responding to your cue. Coming over to say hello.' : 'Following your call to the landing pad.', 'Practicing flip': 'Practicing a little tumble.', Backflipping: 'A learned backflip, just for you.', 'Waiting for treat': 'Waiting for a little reward.', Perching: 'Settling onto a favorite perch.', 'Finding a perch': 'Looking for a comfortable perch.' })[this.state] ?? (this.state === 'Locked in' ? 'Locked in. Working through the markets.' : this.state === 'Watching screen' ? 'Front-row seat. Watching the glowing screen.' : this.state === 'Approaching screen' ? 'Heading over to the laptop.' : this.state === 'Panicking' ? 'Swatter nearby! Taking off in a hurry.' : this.state === 'Seeking food' ? `Picked up the scent of ${STIMULI[food.kind].name.toLowerCase()}.` : this.state === 'Feeding' ? 'Landed. A little snack is in order.' : this.state === 'Avoiding' ? 'Strong stimulus detected. Moving away.' : this.state === 'Grooming' ? 'A quiet spot. Landing for a little grooming.' : this.state === 'Resting' ? 'Taking a moment to recharge.' : previous === 'Feeding' && !this.appetite ? 'Full for now. Off to explore.' : 'Off to explore again.'));
  }
}
