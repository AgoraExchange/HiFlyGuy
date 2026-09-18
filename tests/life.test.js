import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';
import { ROOMS, invite, routeBetween } from '../src/life.js';
import { encodeSession, decodeSession } from '../src/session.js';

const advance = (sim, seconds) => { for (let i = 0; i < seconds * 60; i++) sim.tick(1 / 60); };
test('Invitations walk through connected rooms and viewer state never moves the fly', () => {
  const sim = new Simulation(); invite(sim, 'bar');
  assert.deepEqual(sim.life.route, ['computer', 'bar']);
  const saved = decodeSession(encodeSession(sim, { viewRoom: 'rooftop' }));
  assert.equal(saved.viewRoom, 'rooftop'); assert.equal(saved.sim.environment, 'habitat');
  advance(sim, 24); assert.equal(sim.environment, 'bar'); assert.equal(sim.life.destination, null);
  assert.ok(sim.events.some(e => e.message === 'Arrived at Night desk.'));
  for (const from of Object.keys(ROOMS)) for (const to of Object.keys(ROOMS)) {
    const route = routeBetween(from, to); if (from !== to) assert.equal(route.at(-1), to);
  }
});
test('Food and scent memories belong to a room, including clear and saved migration', () => {
  const sim = new Simulation(); sim.life.autonomous = false;
  sim.add('peppermint', 0, 0, 'bar'); sim.add('banana', 0, 0, 'rooftop'); advance(sim, 3);
  assert.equal(sim.memories.length, 0); assert.ok(sim.signals.scent < .02); assert.ok(sim.signals.aversion < .02);
  for (let i = 0; i < 8; i++) assert.ok(sim.add('banana', 1, 1, 'habitat'));
  assert.equal(sim.add('banana', 1, 1, 'habitat'), null); assert.ok(sim.add('tomato', 1, 1, 'bar'));
  sim.clear('habitat'); assert.equal(sim.roomObjects('habitat').length, 0); assert.equal(sim.roomObjects('bar').length, 2);
  sim.environment = 'bar'; sim.x = 1; sim.z = 0; advance(sim, 2); assert.equal(sim.memories[0].room, 'bar');
  sim.environment = 'habitat'; assert.equal(sim.memoryRisk(0, 0), 0);
  assert.ok(decodeSession(encodeSession(sim)));
  const legacy = JSON.parse(encodeSession(sim)); delete legacy.world.life; delete legacy.viewRoom;
  for (const o of legacy.world.objects) delete o.room; for (const m of legacy.world.memories) delete m.room;
  const old = decodeSession(JSON.stringify(legacy)); assert.ok(old); assert.equal(old.sim.objects[0].room, 'habitat');
});
test('Travel, mood, habits and action progress resume deterministically', () => {
  const sim = new Simulation(); invite(sim, 'fireescape'); advance(sim, 6);
  const restored = decodeSession(encodeSession(sim)).sim;
  advance(sim, 130); advance(restored, 130);
  assert.deepEqual(sim.life, restored.life); assert.equal(sim.environment, restored.environment); assert.equal(sim.x, restored.x);
  assert.ok(sim.life.cigarettes > 0); assert.ok(sim.events.some(e => e.message.includes('Arrived at Fire escape')));
  const frozen = encodeSession(sim); sim.tick(0); const after = JSON.parse(encodeSession(sim));
  assert.deepEqual(JSON.parse(frozen).world, after.world);
});
test('Smoking and drinking have finite bouts and never consume food or reward training', () => {
  const sim = new Simulation(); sim.environment = 'bar'; sim.x = 0; sim.z = -3.4; sim.y = 2.22;
  sim.life.nextDecision = 0; sim.life.holdUntil = 350; const bond = sim.training.bond;
  advance(sim, 160); assert.ok(sim.life.drinks >= 2); assert.ok(sim.life.buzz > .2); assert.equal(sim.objects.length, 0); assert.equal(sim.training.bond, bond);
  assert.ok(sim.events.some(e => e.message.includes('empty glass')));
  const mid = decodeSession(encodeSession(sim)); assert.ok(mid); assert.equal(mid.sim.life.drinks, sim.life.drinks);
});
test('Care, sleep and making the bed change room condition; interruption pauses routines', () => {
  const sim = new Simulation(); sim.x = -3.5; sim.z = -3; sim.y = 1.72;
  sim.hunger = .1; sim.energy = .8; sim.life.tidiness = .2; sim.life.nextDecision = 0;
  advance(sim, 15); assert.ok(sim.life.tidiness > .7); assert.ok(sim.events.some(e => e.message.includes('Making the bed')));
  sim.life.action = 'Sleeping'; sim.life.actionUntil = sim.time + 20; sim.energy = .4;
  advance(sim, 12); assert.ok(sim.energy > .6); assert.equal(sim.state, 'Sleeping');
  const tired = new Simulation(); tired.life.autonomous = false; tired.hunger = 1; tired.energy = .15; tired.life.stress = .9; advance(tired, 150);
  assert.ok(tired.life.mood < sim.life.mood); assert.ok(tired.life.tidiness < .8);
  const smoke = new Simulation(); smoke.environment = 'fireescape'; smoke.life.action = 'Smoking'; smoke.life.actionUntil = 5; smoke.startle = 20; advance(smoke, 6);
  assert.equal(smoke.life.cigarettes, 0); assert.equal(smoke.life.action, 'Smoking');
});
test('Long autonomous sessions visit multiple rooms and remain saveable and finite', () => {
  const sim = new Simulation(), visited = new Set();
  for (let i = 0; i < 900 * 60; i++) { sim.tick(1 / 60); visited.add(sim.environment); }
  assert.ok(visited.size >= 4); assert.ok(sim.life.visits >= 5); assert.ok(decodeSession(encodeSession(sim)));
  assert.ok(Number.isFinite(sim.x + sim.y + sim.z)); assert.ok(Math.hypot(sim.x, sim.z) <= 9.901);
});
test('Malformed life state, routes, object rooms and viewer rooms are rejected', () => {
  const base = JSON.parse(encodeSession(new Simulation()));
  for (const mutate of [w => w.world.life.mood = 2, w => w.world.life.route = ['bar'], w => w.world.life.action = 'Smoking', w => w.world.life.drinks = -1, w => w.viewRoom = 'unknown']) {
    const save = structuredClone(base); mutate(save); assert.equal(decodeSession(JSON.stringify(save)), null);
  }
});

test('Desk focus travels from every room, holds the desk, saves, and releases without changing free will', async () => {
  const { setDeskFocus } = await import('../src/life.js');
  for (const room of Object.keys(ROOMS)) {
    const sim = new Simulation(); sim.environment = room; sim.life.autonomous = false;
    setDeskFocus(sim, true); advance(sim, 60);
    assert.equal(sim.environment, 'computer'); assert.equal(sim.state, 'Locked in');
    advance(sim, 150); assert.equal(sim.state, 'Locked in');
    const restored = decodeSession(encodeSession(sim)); assert.ok(restored);
    assert.equal(restored.sim.life.deskFocus, true);
    setDeskFocus(sim, false); advance(sim, 1);
    assert.notEqual(sim.state, 'Locked in'); assert.equal(sim.life.autonomous, false);
    sim.reset(); assert.equal(sim.life.deskFocus, false);
  }
});
