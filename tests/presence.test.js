import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { separateViewer, FLY_PERSONAL_SPACE as radius, approachViewer, noticeViewer } from '../src/presence.js';

const v = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);
test('viewer cannot pass through FlyGuy from any direction, including long steps', () => {
  for (const axis of [v(1), v(0, 1), v(0, 0, 1), v(1, 1, 1).normalize()]) {
    for (const sign of [-1, 1]) {
      const from = axis.clone().multiplyScalar(8 * sign), desired = from.clone().negate();
      const result = separateViewer(from, desired, v(), v());
      assert.ok(result.length() >= radius - 1e-6); assert.ok(result.dot(from) > 0);
    }
  }
});
test('contact permits sideways movement and repeated forward movement stays outside', () => {
  let eye = v(0, 0, radius);
  for (let i = 0; i < 200; i++) { eye = separateViewer(eye, eye.clone().add(v(0, 0, -.3)), v(), v()); assert.ok(eye.z >= radius - 1e-6); }
  const slid = separateViewer(eye, eye.clone().add(v(.5, 0, -.3)), v(), v());
  assert.ok(slid.x > 0); assert.ok(slid.length() >= radius - 1e-6);
});
test('a fly crossing a stationary viewer cannot tunnel through; overlap recovery stays finite', () => {
  const eye = separateViewer(v(), v(), v(0, 0, -5), v(0, 0, 5));
  assert.ok(eye.z >= 5 + radius - 1e-6);
  const recovered = separateViewer(v(), v(), v(), v()); assert.ok(Number.isFinite(recovered.x)); assert.ok(recovered.length() >= radius - 1e-6);
});
test('conversation approaches arc around the viewer, finish in front, and return exactly', () => {
  const eye = v(0, 3, 0), from = v(0, 3, 5), target = v(0, 3, -4.5);
  for (let i = 0; i <= 100; i++) assert.ok(approachViewer(from, target, eye, i / 100).distanceTo(eye) >= radius);
  assert.ok(approachViewer(from, target, eye, 1).distanceTo(target) < 1e-6);
  assert.ok(approachViewer(from, target, eye, 0).distanceTo(from) < 1e-6);
});
test('idle FlyGuy notices the actual nearby observer; urgent actions and other rooms keep priority', () => {
  const sim = { observer: { x: 3, y: 2, z: 0 }, environment: 'playground', x: 0, y: 2, z: 0, speed: 0, state: 'Grooming', heading: 0 };
  noticeViewer(sim, .1); assert.ok(sim.heading > 0);
  for (const changes of [{ state: 'Feeding' }, { environment: 'habitat' }, { speed: 1 }, { observer: null }]) {
    const other = { ...sim, heading: 0, ...changes }; noticeViewer(other, .1); assert.equal(other.heading, 0);
  }
});
