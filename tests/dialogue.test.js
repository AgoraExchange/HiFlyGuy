import test from 'node:test';
import assert from 'node:assert/strict';
import { DIALOGUE, FlyDialogue, dialogueContext } from '../src/dialogue.js';

const sim = () => ({ state: 'Exploring', environment: 'habitat', time: 20, hunger: .4, energy: .8, life: { stress: .1 } });
function advance(voice, seconds, world = sim(), options = {}) {
  const entries = [];
  for (let i = 0; i < seconds * 10; i++) { const e = voice.update(.1, world, options); if (e) entries.push(e); }
  return entries;
}
test('large authored library avoids repeating a pool before it is exhausted', () => {
  const all = Object.values(DIALOGUE).flat(); assert.ok(all.length > 200); assert.equal(new Set(all).size, all.length);
  const voice = new FlyDialogue(() => .5);
  for (const [pool, entries] of Object.entries(DIALOGUE)) assert.equal(new Set(entries.map(() => voice.pick(pool))).size, entries.length);
});
test('dialogue reflects actions and needs', () => {
  const world = sim();
  for (const [state, expected] of [['Working', 'working'], ['Feeding', 'feeding'], ['Panicking', 'panic'], ['Heading out', 'heading']]) {
    world.state = state; assert.equal(dialogueContext(world), expected);
  }
  world.state = 'Exploring'; world.energy = .1; assert.equal(dialogueContext(world), 'tired');
});
test('pause and sleeping do not produce dialogue; ordinary speech has real and world timestamps', () => {
  const voice = new FlyDialogue(() => .5), world = sim();
  assert.equal(advance(voice, 20, world, { running: false }).length, 0); assert.equal(voice.elapsed, 0);
  world.state = 'Sleeping'; assert.equal(advance(voice, 20, world).length, 0);
  world.state = 'Exploring'; const entries = advance(voice, 10, world);
  assert.equal(entries.length, 1); assert.equal(entries[0].worldTime, world.time); assert.ok(Number.isFinite(Date.parse(entries[0].at)));
});
test('fourth wall visits require permission and remain rare over a long session', () => {
  const voice = new FlyDialogue(() => .5);
  assert.ok(advance(voice, 180, sim(), { canAddress: false }).every(e => !e.direct));
  const entries = advance(voice, 800, sim(), { canAddress: true });
  const direct = entries.filter(e => e.direct); assert.ok(direct.length >= 2 && direct.length <= 4);
  assert.ok(entries.length > direct.length * 4);
});
