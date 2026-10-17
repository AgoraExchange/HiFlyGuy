import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';
import { invite, routeBetween } from '../src/life.js';
import { encodeSession, decodeSession } from '../src/session.js';
import { cityWork } from '../src/megacity.js';
test('Fly Guy reaches Megacity, works at HQ and saves his routine', () => {
  const sim = new Simulation(); invite(sim, 'megacity');
  for (let i = 0; i < 60 * 45; i++) sim.tick(1 / 60);
  assert.equal(sim.environment, 'megacity'); assert.equal(sim.state, 'Working');
  assert.ok(Math.hypot(sim.x, sim.z + 3) < .5);
  const saved = decodeSession(encodeSession(sim)); assert.ok(saved); assert.equal(saved.sim.environment, 'megacity');
  assert.deepEqual(routeBetween('megacity', 'computer'), ['habitat', 'computer']);
});
test('City work is deterministic and advances on simulation time', () => {
  assert.deepEqual(cityWork(12), cityWork(12));
  assert.equal(cityWork(12, 1).phase, 'Working');
  assert.equal(cityWork(24, 1).completed, 1);
  assert.equal(cityWork(24, 2).progress, 0);
  assert.equal(cityWork(12, 2).phase, 'Awaiting the team briefing');
  assert.equal(cityWork(120).completed, 1);
});

import { domainDeal, domainProfit, CITY_FOUNDATION, OUTER_BUILDINGS } from '../src/megacity-workstations.js';
import { ROOMS } from '../src/life.js';
test('Domain profit posts only on resale and survives repeated clock readings', () => {
  assert.deepEqual([0,6,12,18,24].map(t=>domainDeal(t).phase),[0,1,2,3,4]);
  assert.equal(domainDeal(23.99).closed,0); assert.equal(domainDeal(24).closed,1);
  assert.equal(domainDeal(30).closed,1); assert.equal(domainDeal(54).closed,2);
  assert.equal(domainProfit(0),0); assert.equal(domainProfit(24),810);
  assert.equal(domainProfit(30),810); assert.equal(domainProfit(54),1620);
});
test('Every outer building including its roof trim fits on the foundation', () => {
  for(const b of OUTER_BUILDINGS) {
    assert.ok(Math.abs(b.x)+(b.width+.5)/2 < CITY_FOUNDATION/2);
    assert.ok(Math.abs(b.z)+(b.depth+.5)/2 < CITY_FOUNDATION/2);
  }
  assert.deepEqual(Object.keys(ROOMS),['habitat','computer','fireescape','rooftop','bar','store','playground','megacity']);
});
