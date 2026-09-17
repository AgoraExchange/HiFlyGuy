import test from 'node:test';
import assert from 'node:assert/strict';
import { createFly, animateFly } from '../src/scene.js';

test('Feeding and grooming have distinct foreleg poses and freeze at fixed simulation time', () => {
  const fly = createFly();
  const pose = (state, time) => {
    animateFly(fly, { state, time, y: 0.87, speed: 0 });
    return [...fly.forelegs.flatMap(l => l.segments.flatMap(s => [...s.position.toArray(), ...s.quaternion.toArray()])), ...fly.mouth.scale.toArray(), fly.mouth.rotation.x];
  };
  const feeding = pose('Feeding', 3), later = pose('Feeding', 3.2), grooming = pose('Grooming', 3.2);
  assert.notDeepEqual(feeding, later); assert.notDeepEqual(later, grooming);
  assert.deepEqual(grooming, pose('Grooming', 3.2)); assert.ok(grooming.every(Number.isFinite));
});

test('Room routines show the correct props, freeze when paused, and release the pose', () => {
  const fly = createFly(), sim = { state: 'Smoking', time: 3, y: .87, speed: 0, life: { motivation: .3, buzz: .4 } };
  animateFly(fly, sim);
  assert.equal(fly.lifeProps.cigarette.visible, true); assert.equal(fly.lifeProps.glass.visible, false);
  const smoke = fly.lifeProps.smoke.children.map(p => [...p.position.toArray(), ...p.scale.toArray()]);
  const lean = fly.group.rotation.z; animateFly(fly, sim);
  assert.equal(fly.group.rotation.z, lean); assert.deepEqual(fly.lifeProps.smoke.children.map(p => [...p.position.toArray(), ...p.scale.toArray()]), smoke);
  sim.state = 'Having a drink'; animateFly(fly, sim); assert.equal(fly.lifeProps.glass.visible, true); assert.equal(fly.lifeProps.smoke.visible, false);
  sim.state = 'Sleeping'; animateFly(fly, sim); assert.ok(Math.abs(fly.group.rotation.z) > .2); assert.ok(fly.legs[2].rotation.x < 0);
  sim.state = 'Exploring'; sim.life.buzz = 0; animateFly(fly, sim);
  assert.equal(fly.lifeProps.glass.visible, false); assert.equal(fly.lifeProps.cigarette.visible, false); assert.equal(fly.wings[0].rotation.y, 0); assert.equal(fly.group.rotation.z, 0);
});
