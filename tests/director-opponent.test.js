import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleOpponentTake,OPPONENT_DURATION,OPPONENT_SHOTS} from '../src/director-opponent-timeline.js';
test('Opponent builds to one transformation and closes with a matching reflection',()=>{
  assert.equal(OPPONENT_DURATION,14);
  assert.equal(sampleOpponentTake(3.8).freeze,false);assert.equal(sampleOpponentTake(3.8).opponent,false);
  assert.equal(sampleOpponentTake(6).opponent,false);assert.equal(sampleOpponentTake(11).opponent,false);
  assert.equal(sampleOpponentTake(11).transformed,true);
  assert.equal(sampleOpponentTake(14).caption,'BECOME THE ONE YOU KEEP IMAGINING.');
  assert.equal(sampleOpponentTake(6.999).future,false);assert.equal(sampleOpponentTake(7).future,true);
  assert.equal(sampleOpponentTake(7).caption,'YOUR NEXT OPPONENT IS YOU.');
  assert.equal(sampleOpponentTake(14).reflection,true);
  for(const [shot,start,end] of OPPONENT_SHOTS)assert.equal(sampleOpponentTake((start+end)/2).shot,shot);
  assert.deepEqual(sampleOpponentTake(-5),sampleOpponentTake(0));assert.deepEqual(sampleOpponentTake(NaN),sampleOpponentTake(0));
  assert.deepEqual(sampleOpponentTake(100),sampleOpponentTake(14));
});
