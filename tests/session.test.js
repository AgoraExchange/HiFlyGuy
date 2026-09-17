import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';
import { encodeSession, decodeSession, loadSession, saveSession, SESSION_KEY } from '../src/session.js';

const advance = (sim, seconds) => { for (let i = 0; i < seconds * 60; i++) sim.tick(1 / 60); };

test('Night desk activity resumes and older habitat saves remain compatible', () => {
  const sim = new Simulation(); sim.environment = 'computer'; sim.watchScreen = true; advance(sim, 18);
  const restored = decodeSession(encodeSession(sim)).sim;
  assert.equal(restored.environment, 'computer'); assert.equal(restored.state, 'Watching screen'); assert.equal(restored.watchScreen, true);
  advance(sim, 60); advance(restored, 60);
  assert.deepEqual(JSON.parse(encodeSession(sim)).world, JSON.parse(encodeSession(restored)).world);
  const old = JSON.parse(encodeSession(new Simulation())); delete old.world.environment; delete old.world.watchScreen;
  assert.equal(decodeSession(JSON.stringify(old)).sim.environment, 'habitat');
  old.world.environment = 'unknown'; assert.equal(decodeSession(JSON.stringify(old)), null);
});
test('Saved feeding state resumes exactly, including future random movement', () => {
  const sim = new Simulation(); sim.add('banana', 1, 1); advance(sim, 8);
  assert.equal(sim.state, 'Feeding');
  const loaded = decodeSession(encodeSession(sim, { paused: true, speed: 2 }));
  assert.ok(loaded); assert.equal(loaded.paused, true); assert.equal(loaded.speed, 2);
  assert.equal(loaded.sim.target, loaded.sim.objects[0]);
  advance(sim, 70); advance(loaded.sim, 70);
  assert.deepEqual(JSON.parse(encodeSession(loaded.sim)).world, JSON.parse(encodeSession(sim)).world);
});
test('Learned memories, removed objects, and reset survive a reload', () => {
  const sim = new Simulation(); const candy = sim.add('peppermint', 0.5, 0); advance(sim, 2); sim.remove(candy.id);
  const loaded = decodeSession(encodeSession(sim));
  assert.ok(loaded); assert.equal(loaded.sim.objects.length, 0); assert.ok(loaded.sim.memories.length > 0);
  assert.deepEqual(loaded.sim.memories, sim.memories);
  sim.reset(); const fresh = decodeSession(encodeSession(sim));
  assert.equal(fresh.sim.time, 0); assert.equal(fresh.sim.memories.length, 0); assert.equal(fresh.sim.objects.length, 0);
});
test('Corrupt or incompatible saves are rejected safely', () => {
  assert.equal(decodeSession('{broken'), null); assert.equal(decodeSession(null), null);
  for (const alter of [s => s.version = 999, s => s.world.x = null, s => s.world.energy = 100, s => s.world.activity = [], s => s.world.objects = [{id:1,kind:'unknown',x:0,z:0,amount:1}], s => s.world.targetId = 500]) {
    const data = JSON.parse(encodeSession(new Simulation())); alter(data); assert.equal(decodeSession(JSON.stringify(data)), null);
  }
});
test('Storage failures do not crash the simulation', () => {
  const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Full'); } };
  assert.equal(loadSession(blocked), null); assert.equal(saveSession(blocked, new Simulation()), false);
  const store = new Map(), storage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
  assert.equal(saveSession(storage, new Simulation(), { paused: true, speed: 0.5 }), true);
  assert.ok(store.has(SESSION_KEY)); assert.equal(loadSession(storage).speed, 0.5);
});

test('Reloading during a chase preserves FlyGuy but puts away the pointer tool', () => {
  const sim = new Simulation(); sim.aimSwatter(0, 0); advance(sim, 0.1);
  const loaded = decodeSession(encodeSession(sim));
  assert.ok(loaded); assert.equal(loaded.sim.state, 'Panicking'); assert.equal(loaded.sim.distress, sim.distress);
  assert.equal(loaded.sim.swatter.active, false); advance(loaded.sim, 10);
  assert.notEqual(loaded.sim.state, 'Panicking'); assert.equal(loaded.sim.distress, 0);
  const old = JSON.parse(encodeSession(new Simulation())); delete old.world.distress; delete old.world.escapeX; delete old.world.escapeZ;
  assert.ok(decodeSession(JSON.stringify(old)));
});
