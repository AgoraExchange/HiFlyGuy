import test from 'node:test';
import assert from 'node:assert/strict';
import {destroyTiming,sampleDestroyTake,DESTROY_DURATION} from '../src/director-destroy-timeline.js';
test('Destroy take reaches its chair before trading and keeps a fixed 22-second duration',()=>{
  assert.equal(DESTROY_DURATION,22);
  for(const drop of [3,5,9]){
    assert.equal(destroyTiming({drop}).duration,22);
    assert.equal(sampleDestroyTake(0,{drop}).shot,'check-in');
    assert.equal(sampleDestroyTake(drop*.5,{drop}).shot,'walk-in');
    assert.equal(sampleDestroyTake(drop-.001,{drop}).shot,'sit-down');
    assert.equal(sampleDestroyTake(drop-.001,{drop}).typing,false);
    assert.equal(sampleDestroyTake(drop,{drop}).shot,'lock-in');
    assert.equal(sampleDestroyTake(22,{drop}).shot,'hero');
    for(const [fraction,count] of [[.27,1],[.50,2],[.78,3]]){
      const f=sampleDestroyTake(drop+(22-drop)*fraction,{drop});
      assert.equal(f.wallet,true);assert.equal(f.closedTrades,count);
    }
  }
  assert.deepEqual(sampleDestroyTake(NaN),sampleDestroyTake(0));
  assert.deepEqual(sampleDestroyTake(99),sampleDestroyTake(22));
  assert.equal(destroyTiming({drop:-5}).drop,3);
  assert.equal(destroyTiming({drop:99}).drop,9);
});
