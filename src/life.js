// Authored fictional routines, separate from the illustrative neural controller.
export const ROOMS = {
  habitat: { name: 'Habitat', subtitle: 'A room of his own.', exit: [7, -4], station: [-3.5, -3], action: 'Sleeping', duration: 28, links: ['fireescape', 'computer', 'playground'] },
  fireescape: { name: 'Fire escape', subtitle: 'A small light in the city.', exit: [0, -7], station: [1.5, 6.5], action: 'Smoking', duration: 22, links: ['habitat', 'rooftop'] },
  computer: { name: 'Night desk', subtitle: 'The world behind the screen.', exit: [7, 3], links: ['habitat', 'bar'] },
  bar: { name: 'Bar', subtitle: 'The small hours.', exit: [7, 4], station: [0, -3.4], action: 'Having a drink', duration: 18, links: ['computer', 'rooftop'] },
  rooftop: { name: 'Rooftop', subtitle: 'Somewhere above it all.', exit: [-6, 4], station: [0, -7], action: 'Watching the city', duration: 26, links: ['bar', 'fireescape'] },
  playground: { name: 'Playground', subtitle: 'A little trust. A little magic.', exit: [0, 8], links: ['habitat'] },
};
export const LIFE_STATES = ['Heading out', 'Crossing doorway', 'Settling in', 'Sleeping', 'Making the bed', 'Smoking', 'Having a drink', 'Watching the city'];
export const isRoom = room => Object.hasOwn(ROOMS, room);
const clamp = n => Math.max(0, Math.min(1, n));
export function newLife() {
  return { autonomous: true, deskFocus: false, mood: .7, motivation: .7, stress: .12, tidiness: .8, buzz: 0, smokingHabit: .25, drinkingHabit: .2, cigarettes: 0, drinks: 0, nextDecision: 40, holdUntil: 0, action: null, actionUntil: 0, route: [], destination: null, crossingUntil: 0, visits: 0 };
}
export function routeBetween(from, to) {
  const queue = [[from]], seen = new Set([from]);
  while (queue.length) { const path = queue.shift(), room = path.at(-1); if (room === to) return path.slice(1); for (const next of ROOMS[room].links) if (!seen.has(next)) { seen.add(next); queue.push([...path, next]); } }
  return [];
}
export function invite(sim, room) {
  if (!isRoom(room)) return false;
  if (room !== 'computer') sim.life.deskFocus = false;
  sim.cancelLesson(); sim.putAwaySwatter();
  const l = sim.life; l.action = null; l.crossingUntil = 0; l.route = routeBetween(sim.environment, room); l.destination = l.route.length ? room : null; l.holdUntil = sim.time + 120; l.nextDecision = sim.time + 22;
  sim.log(room === sim.environment ? 'Staying here for a little while with you.' : `An invitation to ${ROOMS[room].name}. Heading over.`);
  return true;
}
function startTravel(sim, room) {
  const l = sim.life; l.action = null; l.route = routeBetween(sim.environment, room); l.destination = room; l.crossingUntil = 0;
  sim.log(`Decided to visit ${ROOMS[room].name}.`);
}
export function roomHeight(room, x, z) {
  if (room === 'habitat' && Math.abs(x + 3.5) <= 2.1 && Math.abs(z + 3) <= 3) return .85;
  if (room === 'bar' && [-4, 0, 4].some(seat => Math.hypot(x - seat, z + 3.4) <= 1.2)) return 1.35;
  return 0;
}
export function updateLife(sim, dt) {
  const l = sim.life;
  l.buzz = clamp(l.buzz - dt * .0025);
  l.stress = clamp(l.stress + dt * (sim.distress * .11 + (sim.hunger > .8 ? .001 : -.0005)));
  const comfort = clamp(.25 + sim.energy * .4 + (1 - sim.hunger) * .25 + sim.training.bond * .2 - l.stress * .4 - l.buzz * .2);
  l.mood = clamp(l.mood + (comfort - l.mood) * dt * .012);
  l.motivation = clamp(l.motivation + (l.mood * .7 + sim.energy * .3 - l.buzz * .4 - l.motivation) * dt * .009);
  l.tidiness = clamp(l.tidiness - dt * (.0003 + (1 - l.motivation) * .0012 + l.buzz * .001));
  if (sim.state === 'Feeding') { l.stress = clamp(l.stress - dt * .007); l.mood = clamp(l.mood + dt * .003); }
  if (sim.training.active || sim.training.pending) l.holdUntil = sim.time + 75;
  // An interruption pauses the routine; it cannot consume an unseen drink or smoke.
  if (l.action && sim.state !== l.action) l.actionUntil += dt;
  if (l.action && sim.time >= l.actionUntil) {
    if (l.action === 'Smoking') { l.cigarettes++; l.smokingHabit = clamp(l.smokingHabit + .018); sim.log('The ember fades. A last look over the railing.'); }
    if (l.action === 'Having a drink') { l.drinks++; l.drinkingHabit = clamp(l.drinkingHabit + .012); sim.log('An empty glass. Another quiet moment at the bar.'); }
    l.action = null; l.nextDecision = sim.time + 9;
  }
}
export function lifeMotion(sim, dt) {
  const l = sim.life, room = ROOMS[sim.environment];
  if (sim.training.active || sim.training.pending) return null;
  const approach = (point, state, height = 1.6) => {
    const dx = point[0] - sim.x, dz = point[1] - sim.z;
    return { state, dx, dz, velocity: Math.hypot(dx, dz) < .45 ? 0 : 1.65, y: height };
  };
  if (l.route.length) {
    const motion = approach(room.exit, 'Heading out', 1.8);
    if (motion.velocity) return motion;
    l.crossingUntil ||= sim.time + 1.4;
    if (sim.time >= l.crossingUntil) {
      sim.environment = l.route.shift(); const next = ROOMS[sim.environment];
      [sim.x, sim.z] = next.exit; sim.y = 1.8; sim.heading += Math.PI; sim.target = null; sim.caution = 0; sim.putAwaySwatter();
      sim.watchScreen = sim.environment === 'computer'; l.crossingUntil = 0; l.visits++; sim.waypointUntil = 0;
      sim.log(`Arrived at ${next.name}.`);
      if (!l.route.length) { l.destination = null; l.nextDecision = sim.time + 5; l.holdUntil = Math.max(l.holdUntil, sim.time + 30); }
    }
    return { state: 'Crossing doorway', velocity: 0, y: 1.8 };
  }
  if (l.deskFocus && sim.environment === 'computer') return null;
  if (!l.action && sim.time >= l.nextDecision && l.autonomous) {
    l.nextDecision = sim.time + 22;
    const staying = sim.time < l.holdUntil;
    if (!staying && sim.energy < .3 && sim.environment !== 'habitat') startTravel(sim, 'habitat');
    else if (sim.environment === 'habitat') {
      if (sim.energy < .55 || l.buzz > .3) l.action = 'Sleeping';
      else if (l.tidiness < .75 && l.motivation > .52) l.action = 'Making the bed';
      else if (!staying) startTravel(sim, sim.random() < .45 + l.smokingHabit * .25 ? 'fireescape' : sim.random() < .6 ? 'computer' : 'playground');
    } else if (sim.environment === 'fireescape') {
      if (sim.state === 'Smoking' || l.cigarettes > 0 && sim.random() < .55 && !staying) startTravel(sim, sim.random() < .75 ? 'habitat' : 'rooftop');
      else l.action = 'Smoking';
    } else if (sim.environment === 'bar') {
      if (!staying && (l.buzz > .62 || l.drinks > 0 && sim.random() < .3)) startTravel(sim, 'rooftop');
      else l.action = 'Having a drink';
    } else if (sim.environment === 'rooftop') {
      if (!staying && sim.random() < .4) startTravel(sim, l.buzz > .2 ? 'habitat' : 'bar');
      else l.action = 'Watching the city';
    } else if (!staying) startTravel(sim, sim.environment === 'computer' ? 'bar' : 'habitat');
    if (l.action) { l.actionUntil = sim.time + 60; sim.log(`${l.action}. Taking a moment for himself.`); }
  }
  if (!l.action) return l.route.length ? lifeMotion(sim, dt) : null;
  const motion = approach(room.station, 'Settling in', roomHeight(sim.environment, ...room.station) + 1.4);
  if (motion.velocity) { l.actionUntil = sim.time + (room.duration ?? 16); return motion; }
  motion.state = l.action; motion.y = roomHeight(sim.environment, ...room.station) + .87;
  const facing = sim.environment === 'fireescape' ? 0 : Math.PI;
  sim.heading += Math.atan2(Math.sin(facing - sim.heading), Math.cos(facing - sim.heading)) * Math.min(1, dt * 3);
  if (l.action === 'Sleeping') { sim.energy = clamp(sim.energy + dt * .022); l.stress = clamp(l.stress - dt * .005); l.tidiness = clamp(l.tidiness - dt * .004); }
  if (l.action === 'Making the bed') l.tidiness = clamp(l.tidiness + dt * .045);
  if (l.action === 'Smoking') { l.stress = clamp(l.stress - dt * .01); sim.energy = clamp(sim.energy - dt * .001); }
  if (l.action === 'Having a drink') { l.buzz = clamp(l.buzz + dt * .014); l.stress = clamp(l.stress - dt * .006); sim.energy = clamp(sim.energy - dt * .002); }
  if (l.action === 'Watching the city') { l.stress = clamp(l.stress - dt * .005); sim.energy = clamp(sim.energy + dt * .003); }
  return motion;
}
export function decodeLife(value, environment) {
  if (value === undefined) return newLife();
  const l = { ...value, deskFocus: value?.deskFocus ?? false };
  if (typeof l.deskFocus !== 'boolean') return null;
  if (!l || typeof l.autonomous !== 'boolean') return null;
  for (const key of ['mood', 'motivation', 'stress', 'tidiness', 'buzz', 'smokingHabit', 'drinkingHabit']) if (!Number.isFinite(l[key]) || l[key] < 0 || l[key] > 1) return null;
  for (const key of ['cigarettes', 'drinks', 'visits']) if (!Number.isSafeInteger(l[key]) || l[key] < 0) return null;
  for (const key of ['nextDecision', 'holdUntil', 'actionUntil', 'crossingUntil']) if (!Number.isFinite(l[key]) || l[key] < 0 || l[key] > 1e10) return null;
  if (!Array.isArray(l.route) || l.route.length > 5 || !l.route.every(isRoom) || !(l.destination === null || isRoom(l.destination))) return null;
  let previous = environment; for (const room of l.route) { if (!ROOMS[previous].links.includes(room)) return null; previous = room; }
  if (l.route.length ? l.route.at(-1) !== l.destination : l.destination !== null) return null;
  if (l.action !== null && l.action !== ROOMS[environment].action && !(environment === 'habitat' && l.action === 'Making the bed')) return null;
  if (l.route.length && l.action || l.crossingUntil && !l.route.length) return null;
  return Object.fromEntries(Object.keys(newLife()).map(key => [key, key === 'route' ? [...l.route] : l[key]]));
}

export function setDeskFocus(sim, enabled) {
  sim.life.deskFocus = enabled;
  if (enabled) { invite(sim, 'computer'); sim.watchScreen = true; }
  else { sim.life.holdUntil = sim.time; sim.life.nextDecision = sim.time + 5; }
}
