import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleOpponentTake,OPPONENT_DURATION,OPPONENT_SHOTS} from '../src/director-opponent-timeline.js';
test('Opponent reserves its double for the reveal and ends transformed',()=>{
  assert.equal(OPPONENT_DURATION,14);
  assert.equal(sampleOpponentTake(3.8).freeze,true);assert.equal(sampleOpponentTake(3.8).opponent,false);
  assert.equal(sampleOpponentTake(6).opponent,true);assert.equal(sampleOpponentTake(11).opponent,false);
  assert.equal(sampleOpponentTake(11).transformed,true);
  assert.equal(sampleOpponentTake(14).caption,'HE WAS ALWAYS THE COMPETITION.');
  for(const [shot,start,end] of OPPONENT_SHOTS)assert.equal(sampleOpponentTake((start+end)/2).shot,shot);
  assert.deepEqual(sampleOpponentTake(-5),sampleOpponentTake(0));assert.deepEqual(sampleOpponentTake(NaN),sampleOpponentTake(0));
  assert.deepEqual(sampleOpponentTake(100),sampleOpponentTake(14));
});
