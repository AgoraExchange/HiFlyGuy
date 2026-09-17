import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, seededRandom } from '../src/simulation.js';
import { PERCHES, HUMAN, HELLO_SPOT, cueChance, flipUnlocked } from '../src/training.js';
import { encodeSession, decodeSession } from '../src/session.js';
import { createFly, animateFly } from '../src/scene.js';
const advance = (sim, seconds) => { for (let i = 0; i < seconds * 60; i++) sim.tick(1 / 60); };
function practice(sim, kind = 'call') {
  advance(sim, 2.1); assert.equal(sim.requestLesson(kind, true), true, sim.training.message);
  for (let i = 0; i < 35 * 60 && !sim.training.pending; i++) sim.tick(1 / 60);
  assert.ok(sim.training.pending, sim.training.message);
}
const playground = () => { const sim = new Simulation(); sim.environment = 'playground'; return sim; };

test('Coming to the human faces the person and earns bond only after arrival and reward', () => {
  const sim = playground(); sim.training.selected = 'you';
  assert.equal(sim.rewardLesson(), false); practice(sim);
  assert.ok(Math.hypot(sim.x - HELLO_SPOT.x, sim.z - HELLO_SPOT.z) < .5);
  assert.ok(PERCHES.every(p => Math.hypot(sim.x - p.x, sim.z - p.z) > 3));
  const facing = Math.atan2(HUMAN.x - sim.x, HUMAN.z - sim.z); assert.ok(Math.cos(sim.heading - facing) > .99);
  assert.match(sim.training.message, /came to you/); assert.equal(sim.training.bond, .12);
  assert.equal(sim.rewardLesson(), true); assert.ok(sim.training.bond > .12); assert.equal(sim.training.trials[0].destination, 'you');
  assert.equal(sim.rewardLesson(), false);
});

test('Human recall uses learned cue response and saves its destination throughout the attempt', () => {
  const sim = playground(); sim.training.selected = 'you'; sim.training.call = 1; sim.training.bond = 1; sim.random = seededRandom(1);
  assert.equal(sim.requestLesson('call', false), true); advance(sim, 2);
  const restored = decodeSession(encodeSession(sim)); assert.ok(restored); assert.equal(restored.sim.training.active.perch, 'you');
  advance(sim, 8); advance(restored.sim, 8);
  assert.deepEqual(JSON.parse(encodeSession(sim)).world, JSON.parse(encodeSession(restored.sim)).world);
  assert.ok(restored.sim.training.pending); assert.equal(restored.sim.rewardLesson(), true);
  const invalid = JSON.parse(encodeSession(sim)); invalid.world.training.active = null; invalid.world.training.trials[0].destination = 'unknown'; assert.equal(decodeSession(JSON.stringify(invalid)), null);
});

test('Rewards require completed actions, cannot be spammed, and improve recall and bond', () => {
  const sim = playground(), chance = cueChance(sim, 'call');
  assert.equal(sim.rewardLesson(), false); const bond = sim.training.bond;
  practice(sim); assert.equal(sim.training.bond, bond); assert.equal(sim.training.call, .08);
  assert.ok(Math.abs(sim.y - PERCHES[0].height - .87) < .1); assert.equal(sim.state, 'Waiting for treat');
  assert.equal(sim.requestLesson('call'), false); assert.equal(sim.rewardLesson(), true);
  assert.ok(cueChance(sim, 'call') > chance); assert.ok(sim.training.bond > bond);
  const after = sim.training.bond; assert.equal(sim.rewardLesson(), false); assert.equal(sim.training.bond, after);
  assert.equal(sim.training.trials[0].outcome, 'rewarded');
});
test('Different raised landing pads support calls, natural perching, and food', () => {
  for (let index = 0; index < PERCHES.length; index++) {
    const sim = playground(); sim.training.selected = index; practice(sim);
    const p = PERCHES[index]; assert.ok(Math.hypot(sim.x - p.x, sim.z - p.z) < .5); assert.equal(sim.groundHeight(), p.height);
    sim.cancelLesson(); sim.add('banana', p.x, p.z); advance(sim, 5);
    assert.equal(sim.state, 'Feeding'); assert.ok(Math.abs(sim.y - p.height - .87) < .05);
  }
  const sim = playground(); advance(sim, 65);
  assert.ok(sim.events.some(e => e.message.includes('perch')));
});
test('Rewarded lessons unlock flip practice and an actual full rotation', () => {
  const sim = playground(); assert.equal(sim.requestLesson('flip'), false);
  for (let i = 0; i < 3; i++) { practice(sim); sim.rewardLesson(); }
  assert.equal(flipUnlocked(sim), true);
  practice(sim, 'flip'); sim.rewardLesson(); assert.equal(sim.requestLesson('flip', false), false);
  for (let i = 0; i < 3; i++) { practice(sim, 'flip'); sim.rewardLesson(); }
  assert.ok(sim.training.flip >= .55);
  advance(sim, 2.1); assert.equal(sim.requestLesson('flip', true), true);
  const fly = createFly(); let maximum = 0;
  for (let i = 0; i < 240; i++) { sim.tick(1 / 60); animateFly(fly, sim); maximum = Math.max(maximum, Math.abs(fly.group.rotation.x)); }
  assert.ok(maximum > 6); assert.ok(sim.training.pending);
});
test('Recall gets faster with reinforcement from the same starting point', () => {
  const slow = playground(); practice(slow); const first = slow.training.trials[0].latency;
  slow.rewardLesson(); for (let i = 0; i < 5; i++) { practice(slow); slow.rewardLesson(); }
  const learned = playground(); learned.training.call = slow.training.call; learned.training.bond = slow.training.bond; practice(learned);
  assert.ok(learned.training.trials[0].latency < first * .8);
});
test('Lessons and reward windows freeze, expire, and yield to threats without free progress', () => {
  const sim = playground(); practice(sim); const before = encodeSession(sim); sim.tick(0);
  assert.deepEqual(JSON.parse(encodeSession(sim)).world, JSON.parse(before).world);
  advance(sim, 13); assert.equal(sim.rewardLesson(), false); assert.equal(sim.training.call, .08);
  practice(sim); const bond = sim.training.bond; sim.aimSwatter(sim.x, sim.z); advance(sim, .2);
  assert.equal(sim.state, 'Panicking'); assert.equal(sim.training.pending, null); assert.ok(sim.training.bond < bond);
  assert.equal(sim.requestLesson('call'), false); assert.equal(sim.rewardLesson(), false);
});
test('Training saves resume exactly, old saves migrate, and corrupt progress is rejected', () => {
  const sim = playground(); sim.requestLesson('call'); advance(sim, 3);
  const saved = decodeSession(encodeSession(sim)); assert.ok(saved); advance(sim, 10); advance(saved.sim, 10);
  assert.deepEqual(JSON.parse(encodeSession(sim)).world, JSON.parse(encodeSession(saved.sim)).world);
  const pending = decodeSession(encodeSession(sim)); assert.ok(pending); assert.equal(pending.sim.rewardLesson(), true);
  const old = JSON.parse(encodeSession(new Simulation())); delete old.world.training;
  assert.equal(decodeSession(JSON.stringify(old)).sim.training.bond, .12);
  const bad = JSON.parse(encodeSession(sim)); bad.world.training.selected = 99; assert.equal(decodeSession(JSON.stringify(bad)), null);
  bad.world.training.selected = 0; bad.world.training.bond = NaN; assert.equal(decodeSession(JSON.stringify(bad)), null);
});
