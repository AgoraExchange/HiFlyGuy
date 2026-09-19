import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleTake, SHOTS, TAKE_DURATION, LEAD_IN } from '../src/director-timeline.js';
import { sampleLabTake, LAB_DURATION, LAB_SHOTS } from '../src/director-lab-timeline.js';

test('Lab take replays exactly, clamps time and confines electricity to three pulses',()=>{
  const visited=new Set();let pulses=0,active=false;
  for(let i=0;i<=LAB_DURATION*100;i++){
    const f=sampleLabTake(i/100);visited.add(f.shot);
    assert.deepEqual(f,sampleLabTake(i/100));
    for(const n of [...f.camera,f.pulse,f.slump,f.panic])assert.ok(Number.isFinite(n));
    assert.ok(f.pulse>=0&&f.pulse<=1);
    if(f.pulse>0&&!active)pulses++;
    active=f.pulse>0;
    if(active)assert.equal(f.shot,'correction');
  }
  assert.equal(pulses,3);assert.deepEqual([...visited],LAB_SHOTS.map(s=>s.id));
  assert.equal(sampleLabTake(LAB_DURATION).slump,1);
  assert.deepEqual(sampleLabTake(-10),sampleLabTake(0));
  assert.deepEqual(sampleLabTake(NaN),sampleLabTake(0));
  assert.deepEqual(sampleLabTake(100),sampleLabTake(LAB_DURATION));
});
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
