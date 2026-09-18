import { decodeLife, isRoom, LIFE_STATES } from './life.js';
import { Simulation, STIMULI, WORLD, seededRandom } from './simulation.js';
import { decodeTraining, TRAINING_STATES } from './training.js';

export const SESSION_KEY = 'hiflyguy.world.v1';
const scalars = ['time', 'x', 'z', 'y', 'heading', 'energy', 'hunger', 'speed', 'startle', 'nextId', 'nextMemoryId', 'caution', 'waypointUntil', 'lastMemoryLog', 'nextGroomAt', 'groomingUntil', 'distress', 'escapeX', 'escapeZ'];
const states = ['Locked in', 'Exploring', 'Seeking food', 'Feeding', 'Avoiding', 'Resting', 'Cautious', 'Grooming', 'Panicking', 'Approaching screen', 'Watching screen', 'Perching', 'Finding a perch', ...TRAINING_STATES, ...LIFE_STATES];
const finite = n => typeof n === 'number' && Number.isFinite(n);
const between = (n, min, max) => finite(n) && n >= min && n <= max;
const unit = n => between(n, 0, 1 + 1e-7);
const id = n => Number.isSafeInteger(n) && n > 0;
const point = (p, radius) => p && finite(p.x) && finite(p.z) && Math.hypot(p.x, p.z) <= radius + 0.001;

export function encodeSession(sim, { paused = false, speed = 1, viewRoom = sim.environment } = {}) {
  return JSON.stringify({
    version: 1, savedAt: Date.now(), paused, speed, viewRoom,
    world: {
      ...Object.fromEntries(scalars.map(key => [key, sim[key]])),
      state: sim.state, appetite: sim.appetite, randomState: sim.random.getState(), environment: sim.environment, watchScreen: sim.watchScreen,
      signals: sim.signals, activity: Array.from(sim.activity), waypoint: sim.waypoint,
      targetId: sim.target?.id ?? null, objects: sim.objects, memories: sim.memories, events: sim.events,
      training: sim.training, life: sim.life,
    },
  });
}

// Validate a saved world before it can reach physics, rendering, or the event log.
export function decodeSession(raw) {
  try {
    if (typeof raw !== 'string' || raw.length > 150000) return null;
    const saved = JSON.parse(raw), w = saved?.world;
    if (saved?.version !== 1 || !w || typeof saved.paused !== 'boolean' || ![0.5, 1, 2].includes(saved.speed)) return null;
    // Keep worlds saved before idle grooming was introduced.
    w.nextGroomAt ??= w.time + 24; w.groomingUntil ??= 0;
    w.distress ??= 0; w.escapeX ??= 0; w.escapeZ ??= 0;
    w.environment ??= 'habitat'; w.watchScreen ??= false;
    if (!isRoom(w.environment) || typeof w.watchScreen !== 'boolean') return null;
    const life = decodeLife(w.life, w.environment); if (!life) return null;
    if (saved.viewRoom !== undefined && !isRoom(saved.viewRoom)) return null;
    const training = decodeTraining(w.training, w.time); if (!training) return null;
    if (!scalars.every(key => finite(w[key])) || !states.includes(w.state) || typeof w.appetite !== 'boolean') return null;
    if (!unit(w.distress)) return null;
    if (!between(w.time, 0, 1e10) || !point(w, WORLD.flyRadius) || !between(w.y, 0, 4) || !unit(w.energy) || !unit(w.hunger) || !unit(w.caution)) return null;
    if (!between(w.speed, 0, 10) || !between(w.startle, 0, 100) || !id(w.nextId) || !id(w.nextMemoryId)) return null;
    if (!Number.isInteger(w.randomState) || !between(w.randomState, 0, 4294967295) || !point(w.waypoint, WORLD.flyRadius)) return null;
    if (!w.signals || !['scent', 'aversion', 'motor', 'reward'].every(key => unit(w.signals[key]))) return null;
    if (!Array.isArray(w.activity) || w.activity.length !== 192 || !w.activity.every(unit)) return null;
    if (!Array.isArray(w.objects) || w.objects.length > 48 || !w.objects.every(o => o && id(o.id) && Object.hasOwn(STIMULI, o.kind) && point(o, WORLD.objectRadius) && unit(o.amount) && (o.room === undefined || isRoom(o.room)))) return null;
    if (w.objects.some(o => w.objects.filter(p => (p.room ?? w.environment) === (o.room ?? w.environment)).length > 8)) return null;
    if (new Set(w.objects.map(o => o.id)).size !== w.objects.length || w.objects.some(o => o.id >= w.nextId)) return null;
    if (!Array.isArray(w.memories) || w.memories.length > 32 || !w.memories.every(m => m && id(m.id) && point(m, WORLD.objectRadius) && unit(m.strength) && Number.isSafeInteger(m.encounters) && m.encounters >= 0 && finite(m.lastEncounter) && finite(m.lastSeen) && (m.room === undefined || isRoom(m.room)))) return null;
    if (new Set(w.memories.map(m => m.id)).size !== w.memories.length || w.memories.some(m => m.id >= w.nextMemoryId)) return null;
    if (w.targetId !== null && !w.objects.some(o => o.id === w.targetId && STIMULI[o.kind].scent > 0)) return null;
    if (!Array.isArray(w.events) || w.events.length > 100 || !w.events.every(e => e && between(e.time, 0, w.time) && typeof e.message === 'string' && e.message.length <= 500 && ['behavior', 'system', 'object', 'memory'].includes(e.type))) return null;
    const sim = new Simulation();
    for (const key of scalars) sim[key] = w[key];
    sim.state = w.state; sim.appetite = w.appetite; sim.random = seededRandom(w.randomState);
    sim.environment = w.environment; sim.watchScreen = w.watchScreen;
    sim.training = training; sim.life = life;
    sim.signals = Object.fromEntries(['scent', 'aversion', 'motor', 'reward'].map(key => [key, w.signals[key]]));
    sim.activity.set(w.activity); sim.waypoint = { x: w.waypoint.x, z: w.waypoint.z };
    sim.objects = w.objects.map(({ id, kind, x, z, amount, room = w.environment }) => ({ id, kind, x, z, amount, room }));
    sim.memories = w.memories.map(({ id, x, z, strength, encounters, lastEncounter, lastSeen, room = w.environment }) => ({ id, x, z, strength, encounters, lastEncounter, lastSeen, room }));
    sim.events = w.events.map(({ time, message, type }) => ({ time, message, type }));
    sim.target = sim.objects.find(o => o.id === w.targetId) ?? null;
    return { sim, paused: saved.paused, speed: saved.speed, viewRoom: saved.viewRoom ?? w.environment };
  } catch { return null; }
}

export function loadSession(storage) {
  try { return decodeSession(storage.getItem(SESSION_KEY)); } catch { return null; }
}

export function saveSession(storage, sim, options) {
  try { storage.setItem(SESSION_KEY, encodeSession(sim, options)); return true; } catch { return false; }
}
