import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, roomBounds } from '../src/simulation.js';
import { encodeSession, decodeSession } from '../src/session.js';
import { PERCHES, recallTarget } from '../src/training.js';
import { PARK } from '../src/park-layout.js';

test('expanded park locations, food and high perches save without expanding the other rooms', () => {
  const sim=new Simulation();sim.environment='playground';sim.x=25;sim.z=12;sim.y=4.5;sim.waypoint={x:28,z:10};
  const fruit=sim.add('banana',28,14);assert.equal(fruit.x,28);
  const restored=decodeSession(encodeSession(sim));assert.ok(restored);assert.equal(restored.sim.x,25);assert.equal(restored.sim.objects[0].x,28);
  sim.environment='habitat';sim.x=0;sim.z=0;sim.y=1;sim.waypoint={x:0,z:0};assert.ok(decodeSession(encodeSession(sim)));
  const other=sim.add('banana',28,14);assert.ok(Math.hypot(other.x,other.z)<=roomBounds('habitat').objectRadius+.001);
  assert.ok(PARK.flyRadius>roomBounds('habitat').flyRadius*3);
});
test('all eight park destinations are real landing surfaces and new calls follow the observer', () => {
  const sim=new Simulation();sim.environment='playground';assert.equal(PERCHES.length,8);
  for(const p of PERCHES)assert.equal(sim.groundHeight(p.x,p.z),p.height);
  const a=recallTarget('you',{x:12,y:2.05,z:12,forwardX:1,forwardZ:0});assert.equal(a.x,14.8);assert.equal(a.z,12);
  const b=recallTarget('you',{x:-20,y:2.05,z:10,forwardX:0,forwardZ:-1});assert.equal(b.x,-20);assert.equal(b.z,7.2);
});
