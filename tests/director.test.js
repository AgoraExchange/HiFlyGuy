import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleTake, SHOTS, TAKE_DURATION, LEAD_IN } from '../src/director-timeline.js';
test('Maybach choreography is repeatable, finite, and covers every requested shot',()=>{
  assert.equal(LEAD_IN,2);assert.equal(TAKE_DURATION,22);
  assert.deepEqual(SHOTS.map(s=>s.id),['elevator','turn','apartment','desk','wallet','chair']);
  const first=Array.from({length:220},(_,i)=>sampleTake(i/10));
  for(let i=0;i<first.length;i++){
    const f=first[i];assert.deepEqual(f,sampleTake(i/10));
    for(const n of [...f.position,...f.camera,...f.target,f.heading,f.fov,f.lean,f.door])assert.ok(Number.isFinite(n));
    assert.ok(f.door>=0&&f.door<=1);assert.ok(f.lean>=0&&f.lean<=1);
  }
  assert.equal(sampleTake(0).door,0);assert.equal(sampleTake(3).door,1);
  assert.ok(sampleTake(4.99).position[2]>-5);
  assert.ok(sampleTake(6.9).heading>.7);
  assert.equal(sampleTake(13).wallet,true);assert.equal(sampleTake(17).wallet,false);
  assert.equal(sampleTake(22).lean,1);assert.deepEqual(sampleTake(99),sampleTake(22));
  assert.deepEqual(sampleTake(-1),sampleTake(0));
});
