import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleTeslaTake,teslaTiming,TESLA_INTRO,TESLA_CUTS,TESLA_TRADES,sampleTeslaTerminal} from '../src/director-tesla-timeline.js';

test('Tesla story precedes the chosen drop, then cuts on the selected beat grid',()=>{
  for(const config of [{drop:12,bpm:110},{drop:18,bpm:90}]){
    const timing=teslaTiming(config),seen=new Set();
    for(let t=0;t<timing.duration;t+=.025){const f=sampleTeslaTake(t,config);seen.add(f.shot);assert.deepEqual(f,sampleTeslaTake(t,config));assert.equal(f.drop,t>=config.drop);}
    assert.deepEqual([...seen],[...TESLA_INTRO.map(s=>s[0]),...TESLA_CUTS]);
    TESLA_CUTS.forEach((shot,i)=>assert.equal(sampleTeslaTake(config.drop+i*2*timing.beat+.001,config).shot,shot));
    assert.equal(sampleTeslaTake(config.drop,config).girls,false);
    assert.equal(sampleTeslaTake(timing.duration,config).shot,'hero');
  }
  assert.deepEqual(sampleTeslaTake(NaN),sampleTeslaTake(0));assert.deepEqual(sampleTeslaTake(-5),sampleTeslaTake(0));
  assert.deepEqual(sampleTeslaTake(999),sampleTeslaTake(teslaTiming().duration));
  assert.equal(teslaTiming({drop:0,bpm:999}).drop,8);assert.equal(teslaTiming({drop:0,bpm:999}).bpm,160);
});
test('Paper-trade wallet totals agree with the displayed trades',()=>{
  for(const trade of TESLA_TRADES)assert.ok(Math.abs((trade.exit-trade.entry)*trade.quantity-trade.profit)<1e-8);
  assert.equal(sampleTeslaTerminal(10).profit,4800);
  const symbols=new Set(),actions=new Set();
  for(let t=0;t<9;t+=.1){const f=sampleTeslaTerminal(t);symbols.add(f.asset);actions.add(f.cursor);}
  assert.equal(symbols.size,3);assert.deepEqual([...actions],['symbol','ema','order']);
});

test('Tesla opens on an empty desk and only trades after arriving in the chair',()=>{
  const opening=sampleTeslaTake(0);
  assert.equal(opening.flyVisible,false);assert.equal(opening.typing,false);assert.equal(opening.girls,false);
  assert.equal(sampleTeslaTake(2).flyVisible,true);
  assert.equal(sampleTeslaTake(5.4).shot,'scooter-ride');
  assert.equal(sampleTeslaTake(6).shot,'desk-arrival');assert.equal(sampleTeslaTake(6).typing,false);
  assert.equal(sampleTeslaTake(6.5).shot,'terminal');assert.equal(sampleTeslaTake(6.5).typing,true);
});
