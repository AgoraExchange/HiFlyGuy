import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, WORLD, SWATTER } from '../src/simulation.js';

function advance(sim, seconds) { for (let i = 0; i < seconds * 60; i++) sim.tick(1 / 60); }

test('The night desk observer settles facing the screen, yields to food and threats, and can roam', () => {
  const sim = new Simulation(); sim.environment = 'computer'; sim.watchScreen = true;
  advance(sim, 18); assert.equal(sim.state, 'Watching screen');
  assert.ok(Math.hypot(sim.x, sim.z + 6.5) < .65); assert.equal(sim.speed, 0);
  assert.ok(Math.cos(sim.heading) < -.95); assert.ok(sim.y < 1);
  const banana = sim.add('banana', sim.x, sim.z); advance(sim, 2); assert.equal(sim.state, 'Feeding');
  sim.aimSwatter(sim.x, sim.z); advance(sim, .1); assert.equal(sim.state, 'Panicking');
  sim.putAwaySwatter(); sim.remove(banana.id); sim.watchScreen = false; advance(sim, 4);
  assert.ok(!['Watching screen', 'Approaching screen'].includes(sim.state));
  sim.watchScreen = true; sim.environment = 'habitat'; advance(sim, 10);
  assert.ok(!['Watching screen', 'Approaching screen'].includes(sim.state));
});
test('A hungry fly finds fruit, lands, eats and replenishes energy', () => {
  const sim = new Simulation(); sim.energy = 0.5; sim.add('banana', 2, 1);
  advance(sim, 12);
  assert.ok(sim.events.some(e => e.message.includes('Landed')));
  assert.ok(sim.hunger < 0.5); assert.ok(sim.energy > 0.5);
  assert.ok(sim.objects[0].amount < 1);
});
test('Nearby peppermint activates aversion and increases distance', () => {
  const sim = new Simulation(); sim.add('peppermint', 0.3, 0.3);
  advance(sim, 3);
  assert.ok(sim.events.some(e => e.message.includes('Moving away')));
  assert.ok(Math.hypot(sim.x - 0.3, sim.z - 0.3) > 2);
});
test('No time step freezes the world and reset restores initial state', () => {
  const sim = new Simulation(); sim.add('tomato', 1, 1); advance(sim, 5);
  const before = JSON.stringify(sim); sim.tick(0); assert.equal(JSON.stringify(sim), before);
  sim.reset(); assert.equal(sim.time, 0); assert.equal(sim.objects.length, 0); assert.equal(sim.energy, 0.85);
});
test('Long sessions remain finite and bounded, including objects on the fly', () => {
  const sim = new Simulation(); sim.add('peppermint', 0, 0); sim.add('banana', -4, -4);
  advance(sim, 600);
  for (const n of [sim.x, sim.y, sim.z, sim.energy, sim.hunger, ...sim.activity]) assert.ok(Number.isFinite(n));
  assert.ok(Math.hypot(sim.x, sim.z) <= WORLD.flyRadius + 1e-9); assert.ok(sim.energy >= 0 && sim.energy <= 1); assert.ok(sim.hunger >= 0 && sim.hunger <= 1); assert.ok(sim.events.length <= 100);
});
test('Object limits, removal, and bounds are enforced', () => {
  const sim = new Simulation(); for (let i = 0; i < 10; i++) sim.add('banana', 100, -100);
  assert.equal(sim.objects.length, 8); assert.ok(Math.abs(Math.hypot(sim.objects[0].x, sim.objects[0].z) - WORLD.objectRadius) < 1e-9);
  sim.remove(sim.objects[0].id); assert.equal(sim.objects.length, 7); sim.clear(); assert.equal(sim.objects.length, 0);
});

test('Finishing a meal does not cause the banana seeking/exploring loop', () => {
  const sim = new Simulation(); sim.life.autonomous = false; sim.add('banana', 1, 1);
  advance(sim, 25);
  assert.equal(sim.appetite, false); assert.notEqual(sim.state, 'Feeding');
  const start = sim.time; advance(sim, 70);
  assert.equal(sim.events.filter(e => e.time >= start && (e.message.includes('Picked up') || e.message.includes('Landed'))).length, 0);
  assert.ok(Math.hypot(sim.x - 1, sim.z - 1) > 1);
  sim.hunger = 0.55; advance(sim, 30);
  assert.ok(sim.events.some(e => e.time >= start + 70 && e.message.includes('Landed')));
});

function encounter(sim, x = 0, z = 0) {
  sim.x = x + 1.6; sim.z = z; sim.heading = -Math.PI / 2; advance(sim, 2);
}
test('Low energy does not reintroduce the meal threshold loop', () => {
  const sim = new Simulation(); sim.hunger = 0.1; sim.energy = 0.2; sim.appetite = false;
  sim.add('banana', 1, 0); advance(sim, 35);
  assert.ok(sim.energy > 0.4); assert.equal(sim.appetite, false);
  assert.equal(sim.events.filter(e => e.message.includes('Landed')).length, 1);
});
test('Exploration includes finite grooming breaks that threats and food can interrupt', () => {
  const sim = new Simulation(); advance(sim, 25);
  assert.equal(sim.state, 'Grooming'); assert.equal(sim.speed, 0);
  advance(sim, 7); assert.equal(sim.state, 'Exploring'); assert.ok(sim.nextGroomAt > sim.time);
  sim.nextGroomAt = sim.time; advance(sim, 0.5); assert.equal(sim.state, 'Grooming');
  sim.add('banana', sim.x + 0.5, sim.z); advance(sim, 0.7); assert.equal(sim.state, 'Feeding');
  sim.add('peppermint', sim.x, sim.z); advance(sim, 0.5); assert.equal(sim.state, 'Avoiding'); assert.ok(sim.speed > 0);
});
test('Learning requires exposure, strengthens with encounters and survives object removal', () => {
  const sim = new Simulation(); const candy = sim.add('peppermint', 8, 0);
  advance(sim, 0.1); assert.equal(sim.memories.length, 0);
  encounter(sim, 8, 0); assert.equal(sim.memories.length, 1);
  const first = sim.memories[0].strength;
  sim.x = 0; sim.z = -7; advance(sim, 8); encounter(sim, 8, 0);
  assert.ok(sim.memories[0].strength > first); assert.ok(sim.memories[0].encounters >= 2);
  const learned = sim.memories[0].strength; sim.remove(candy.id);
  assert.equal(sim.memories[0].strength, learned); assert.ok(sim.memoryRisk(8, 0) > 0.3);
  sim.clear(); assert.equal(sim.memories.length, 1);
  sim.reset(); assert.equal(sim.memories.length, 0);
});

test('A learned area produces caution without peppermint; food can draw him back safely', () => {
  const sim = new Simulation(); const candy = sim.add('peppermint', 0, 0); encounter(sim);
  sim.remove(candy.id); sim.x = 1.5; sim.z = 0; sim.heading = -Math.PI / 2;
  advance(sim, 0.2); assert.equal(sim.state, 'Cautious');
  const remembered = sim.memories[0].strength;
  sim.add('banana', 0, 0); advance(sim, 15);
  assert.ok(sim.events.some(e => e.message.includes('Landed'))); assert.ok(sim.memories[0].strength < remembered);
});

test('Learned route choice reduces repeat entries into a removed hazard area', () => {
  const trained = new Simulation(); const candy = trained.add('peppermint', 0, 3);
  for (let i = 0; i < 3; i++) { encounter(trained, 0, 3); trained.x = -7; trained.z = -5; advance(trained, 8); }
  trained.remove(candy.id);
  const naive = new Simulation();
  for (const sim of [trained, naive]) { sim.x = 0; sim.z = 0; sim.heading = 0; sim.hunger = 0.05; sim.waypoint = { x: 0, z: 6 }; sim.waypointUntil = sim.time + 30; }
  let trainedMin = Infinity, naiveMin = Infinity;
  for (let i = 0; i < 8 * 60; i++) { trained.tick(1 / 60); naive.tick(1 / 60); trainedMin = Math.min(trainedMin, Math.hypot(trained.x, trained.z - 3)); naiveMin = Math.min(naiveMin, Math.hypot(naive.x, naive.z - 3)); }
  assert.ok(trainedMin > naiveMin + 0.8, `trained distance ${trainedMin}; naive distance ${naiveMin}`);
});

test('The swatter interrupts feeding, grooming and rest with a faster escape', () => {
  for (const state of ['Feeding', 'Grooming', 'Resting']) {
    const sim = new Simulation(); sim.state = state; sim.y = 0.87; sim.energy = 0;
    const food = sim.add('banana', 0, 0); sim.aimSwatter(sim.x, sim.z);
    sim.tick(1 / 60);
    assert.equal(sim.state, 'Panicking'); assert.ok(sim.speed > SWATTER.speed); assert.ok(sim.y > 0.87);
    assert.equal(food.amount, 1); assert.ok(sim.distress > 0);
  }
});

test('A chasing swatter stays speed limited and cannot trap FlyGuy at the boundary', () => {
  const sim = new Simulation(); sim.x = WORLD.flyRadius; sim.energy = 0; sim.aimSwatter(sim.x, sim.z);
  let panicFrames = 0;
  for (let i = 0; i < 7200; i++) {
    sim.aimSwatter(sim.x, sim.z);
    const old = { x: sim.x, z: sim.z, sx: sim.swatter.x, sz: sim.swatter.z };
    sim.tick(1 / 60);
    assert.ok(Math.hypot(sim.swatter.x - old.sx, sim.swatter.z - old.sz) <= SWATTER.speed / 60 + 1e-8);
    assert.ok(Math.hypot(sim.x, sim.z) <= WORLD.flyRadius + 1e-8);
    assert.ok(Math.hypot(sim.x - sim.swatter.x, sim.z - sim.swatter.z) >= SWATTER.clearance - 1e-8);
    if (sim.state === 'Panicking') { panicFrames++; assert.ok(Math.hypot(sim.x - old.x, sim.z - old.z) > SWATTER.speed / 60); }
  }
  assert.ok(panicFrames > 100); assert.ok(Number.isFinite(sim.energy));
  sim.putAwaySwatter(); advance(sim, 10);
  assert.notEqual(sim.state, 'Panicking'); assert.equal(sim.distress, 0);
});

test('Pausing freezes the swatter and tool use never consumes an object slot', () => {
  const sim = new Simulation(); for (let i = 0; i < 8; i++) sim.add('banana', i, 0);
  sim.aimSwatter(0, 0); const before = JSON.stringify(sim); sim.tick(0); assert.equal(JSON.stringify(sim), before);
  advance(sim, 1); assert.equal(sim.objects.length, 8); assert.equal(sim.state, 'Panicking');
  sim.reset(); assert.equal(sim.swatter.active, false); assert.equal(sim.distress, 0);
});
