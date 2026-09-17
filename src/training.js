// Authored virtual-pet reinforcement, independent of the synthetic neural net.
export const PERCHES = [
  { name: 'Sun pad', x: -5, z: -3, height: .55, color: '#edbd68' },
  { name: 'Sky pad', x: 4, z: -4, height: 1.05, color: '#78c9d4' },
  { name: 'Bloom pad', x: 3, z: 4, height: .75, color: '#cd94bf' },
];
export const HUMAN = { x: -3.5, z: 6.5 };
export const HELLO_SPOT = { name: 'you', x: HUMAN.x, z: HUMAN.z - 1.9, height: 0 };
export const recallTarget = selected => selected === 'you' ? HELLO_SPOT : PERCHES[selected];
export const TRAINING_STATES = ['Listening', 'Coming when called', 'Practicing flip', 'Backflipping', 'Waiting for treat'];
export function newTraining() {
  return { bond: .12, call: .08, flip: 0, selected: 0, cooldownUntil: 0, nextId: 1, active: null, pending: null, trials: [], message: 'Start with Practice call. Reward him when he lands.', nextVisitAt: 18, visitTarget: null, visitUntil: 0 };
}
export function surfaceHeight(environment, x, z) {
  if (environment !== 'playground') return 0;
  return PERCHES.find(p => Math.hypot(x - p.x, z - p.z) <= 1.55)?.height ?? 0;
}
export const cueChance = (sim, kind) => Math.min(.98, .2 + sim.training[kind] * .65 + sim.training.bond * .15);
export const flipUnlocked = sim => sim.training.bond >= .25 && sim.training.call >= .3;
const trial = (sim, id) => sim.training.trials.find(t => t.id === id);
export function cancelLesson(sim, message = 'Lesson paused. Try again when he feels settled.') {
  const t = sim.training;
  if (!t.active && !t.pending) return;
  if (t.active) { const record = trial(sim, t.active.id); if (record) record.outcome = 'interrupted'; }
  t.active = null; t.pending = null; t.message = message; sim.log(message, 'behavior');
}
export function requestLesson(sim, kind, guided = true) {
  const t = sim.training;
  if (sim.environment !== 'playground' || !['call', 'flip'].includes(kind)) return false;
  if (t.active || t.pending) { t.message = 'Finish this turn: reward him, or end the lesson.'; return false; }
  if (sim.time < t.cooldownUntil) { t.message = 'Give him a moment between cues.'; return false; }
  if (sim.distress > .15 || sim.startle > 0 || sim.energy < .25 || sim.state === 'Feeding') { t.message = 'Let him finish eating, rest, or settle down first.'; return false; }
  if (kind === 'flip' && !flipUnlocked(sim)) { t.message = 'Flips unlock at 25% bond and 30% recall. Practice calling, then reward him.'; return false; }
  if (kind === 'flip' && !guided && t.flip < .55) { t.message = 'Practice a few tumbles first. A full backflip unlocks at 55% flip skill.'; return false; }
  const record = { id: t.nextId++, kind, guided, time: sim.time, outcome: 'trying', latency: null, destination: kind === 'call' ? t.selected : null };
  t.trials.unshift(record); t.trials.length = Math.min(20, t.trials.length); t.cooldownUntil = sim.time + 5;
  if (!guided && sim.random() > cueChance(sim, kind)) {
    record.outcome = 'missed'; t.message = 'Not quite ready for that cue. A rewarded practice round can help.'; sim.log(t.message, 'behavior'); return false;
  }
  t.active = { id: record.id, kind, guided, perch: t.selected, started: sim.time, delay: .35 + (1 - t[kind]) * 2.1, phaseAt: null };
  t.visitTarget = null; t.nextVisitAt = sim.time + 25;
  t.message = kind === 'call' ? t.selected === 'you' ? 'Come say hello! Calling FlyGuy over to you. Reward him when he arrives.' : `Calling him to ${PERCHES[t.selected].name}. Wait for his landing.` : guided ? 'A little tumble. Reward the effort when he finishes.' : 'Backflip cue given. Here he goes!';
  sim.log(t.message, 'behavior'); return true;
}
function complete(sim) {
  const t = sim.training, a = t.active, record = trial(sim, a.id);
  record.outcome = 'completed'; record.latency = sim.time - a.started;
  t.pending = { id: a.id, kind: a.kind, until: sim.time + 12 }; t.active = null;
  t.message = record.destination === 'you' ? 'He came to you! Give a treat within 12 seconds to reward your little visitor.' : 'He did it! Give a treat within 12 seconds to reinforce the cue.'; sim.log(t.message, 'behavior');
}
export function rewardLesson(sim) {
  const t = sim.training, pending = t.pending;
  if (!pending || sim.time > pending.until || sim.environment !== 'playground' || sim.distress > .15 || sim.startle > 0) return false;
  const record = trial(sim, pending.id); if (!record || record.outcome !== 'completed') return false;
  record.outcome = 'rewarded'; t[pending.kind] += .22 * (1 - t[pending.kind]); t.bond = Math.min(1, t.bond + .055);
  sim.hunger = Math.max(0, sim.hunger - .035); sim.energy = Math.min(1, sim.energy + .025);
  t.pending = null; t.cooldownUntil = sim.time + 2; t.nextVisitAt = sim.time + 15;
  t.message = `Treat received. ${pending.kind === 'call' ? 'Recall' : 'Flip skill'} is now ${Math.round(t[pending.kind] * 100)}%. He is getting to know you.`;
  sim.log(t.message, 'behavior'); return true;
}
export function updateTraining(sim, dt) {
  const t = sim.training;
  if (sim.environment !== 'playground') cancelLesson(sim, 'Lesson ended. Your progress comes with you.');
  if (t.pending && sim.time > t.pending.until) { t.pending = null; t.message = 'The reward window passed. Try another round; learned progress remains.'; }
  if (t.active && sim.time - t.active.started > 35) cancelLesson(sim, 'That spot is hard to reach right now. Try another pad or clear distractions.');
  if (sim.swatter.active && sim.startle > 0) t.bond = Math.max(0, t.bond - dt * .012);
  else if (sim.state === 'Feeding') t.bond = Math.min(1, t.bond + dt * .0008);
}
export function lessonMotion(sim) {
  const t = sim.training, a = t.active;
  if (t.pending) return { state: 'Waiting for treat', velocity: 0, y: surfaceHeight(sim.environment, sim.x, sim.z) + .87 };
  if (!a) return null;
  const floor = surfaceHeight(sim.environment, sim.x, sim.z);
  if (sim.time - a.started < a.delay) return { state: 'Listening', velocity: 0, y: floor + .87 };
  if (a.kind === 'call') {
    const p = recallTarget(a.perch), dx = p.x - sim.x, dz = p.z - sim.z, arrived = Math.hypot(dx, dz) < .5;
    if (arrived && a.perch === 'you') sim.heading = Math.atan2(HUMAN.x - sim.x, HUMAN.z - sim.z);
    if (arrived && Math.abs(sim.y - p.height - .87) < .08) { complete(sim); return lessonMotion(sim); }
    return { state: 'Coming when called', dx, dz, velocity: arrived ? 0 : 1.1 + t.call * 1.4, y: p.height + .87 + (arrived ? 0 : .6) };
  }
  a.phaseAt ??= sim.time;
  const progress = (sim.time - a.phaseAt) / 1.8;
  if (progress >= 1) { complete(sim); return lessonMotion(sim); }
  return { state: a.guided && t.flip < .55 ? 'Practicing flip' : 'Backflipping', velocity: 0, y: floor + .87 + Math.sin(progress * Math.PI) * 1.45 };
}
export function perchMotion(sim) {
  const t = sim.training;
  if (sim.time < t.nextVisitAt) return null;
  if (t.visitTarget === null) { t.visitTarget = Math.floor(sim.random() * PERCHES.length); t.visitUntil = 0; }
  const p = PERCHES[t.visitTarget], dx = p.x - sim.x, dz = p.z - sim.z, arrived = Math.hypot(dx, dz) < .5;
  if (arrived && !t.visitUntil) t.visitUntil = sim.time + 7;
  if (t.visitUntil && sim.time >= t.visitUntil) { t.visitTarget = null; t.nextVisitAt = sim.time + 18; return null; }
  return { state: arrived ? 'Perching' : 'Finding a perch', dx, dz, velocity: arrived ? 0 : 1.15, y: p.height + .87 + (arrived ? 0 : .7) };
}

export function decodeTraining(value, time) {
  if (value === undefined) return newTraining();
  const t = value, finite = n => typeof n === 'number' && Number.isFinite(n), unit = n => finite(n) && n >= 0 && n <= 1;
  const index = n => Number.isInteger(n) && n >= 0 && n < PERCHES.length;
  const destination = n => n === 'you' || index(n);
  if (!t || !['bond', 'call', 'flip'].every(k => unit(t[k])) || !destination(t.selected)) return null;
  if (!['cooldownUntil', 'nextVisitAt', 'visitUntil'].every(k => finite(t[k])) || !(t.visitTarget === null || index(t.visitTarget))) return null;
  if (!Number.isSafeInteger(t.nextId) || t.nextId < 1 || typeof t.message !== 'string' || t.message.length > 400) return null;
  if (!Array.isArray(t.trials) || t.trials.length > 20 || !t.trials.every(r => r && Number.isSafeInteger(r.id) && r.id > 0 && r.id < t.nextId && ['call', 'flip'].includes(r.kind) && typeof r.guided === 'boolean' && finite(r.time) && r.time >= 0 && r.time <= time && ['trying', 'missed', 'completed', 'rewarded', 'interrupted'].includes(r.outcome) && (r.latency === null || finite(r.latency) && r.latency >= 0 && r.latency <= 36))) return null;
  if (new Set(t.trials.map(r => r.id)).size !== t.trials.length) return null;
  if (!t.trials.every(r => r.destination === undefined || r.destination === null || destination(r.destination))) return null;
  if (t.active !== null) {
    const a = t.active, r = t.trials.find(r => r.id === a?.id);
    if (!a || !r || r.outcome !== 'trying' || r.kind !== a.kind || r.guided !== a.guided || !destination(a.perch) || !finite(a.started) || a.started < 0 || a.started > time || !finite(a.delay) || a.delay < 0 || a.delay > 3 || !(a.phaseAt === null || finite(a.phaseAt) && a.phaseAt >= a.started && a.phaseAt <= time)) return null;
  }
  if (t.pending !== null) { const p = t.pending, r = t.trials.find(r => r.id === p?.id); if (!p || !r || r.outcome !== 'completed' || r.kind !== p.kind || !finite(p.until) || p.until > time + 12.01 || t.active) return null; }
  return structuredClone(t);
}
