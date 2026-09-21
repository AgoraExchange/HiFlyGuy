import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {sampleComebackTake,COMEBACK_SHOTS,COMEBACK_DURATION} from '../src/director-comeback-timeline.js';
import {DESK_TOP} from '../src/director-comeback-desk.js';
import {createComebackOutfit,SANDAL_ANKLE} from '../src/director-comeback-outfit.js';

test('Comeback keeps lab before profit and reveals the outfit in order',()=>{
  const visited=new Set();
  for(let i=0;i<=COMEBACK_DURATION*100;i++){
    const f=sampleComebackTake(i/100);visited.add(f.shot);
    assert.deepEqual(f,sampleComebackTake(i/100));
    for(const n of [...f.position,...f.camera,...f.target,f.fov,f.door,f.desk])assert.ok(Number.isFinite(n));
    assert.equal(f.lab,f.time<3.5);assert.equal(f.profit,f.time>=2&&f.time<3.5);
  }
  assert.deepEqual([...visited],COMEBACK_SHOTS.map(s=>s.id));
  assert.deepEqual(sampleComebackTake(-1),sampleComebackTake(0));
  assert.deepEqual(sampleComebackTake(NaN),sampleComebackTake(0));
  assert.deepEqual(sampleComebackTake(99),sampleComebackTake(18));
});

test('Six fitted sandals stay attached, clear the desk edge, and settle flat',()=>{
  const fly={group:new T.Group(),legs:Array.from({length:6},()=>new T.Group())};
  const materials=new Set(),outfit=createComebackOutfit(fly,materials);
  const pose=time=>{const f=sampleComebackTake(time);fly.group.position.set(...f.position);fly.group.rotation.set(f.lean,f.heading,0,'YXZ');outfit.update(f);fly.group.updateMatrixWorld(true);return f;};
  assert.equal(outfit.feet.length,6);assert.ok(fly.legs.every(leg=>!leg.visible));
  pose(6);const initial=outfit.feet.map(f=>f.shoe.position.toArray());
  for(let t=14;t<=18;t+=.05){
    pose(t);
    for(const foot of outfit.feet){
      const ankle=new T.Vector3(...SANDAL_ANKLE).applyMatrix4(foot.shoe.matrixWorld);
      const shinEnd=new T.Vector3(0,.5,0).applyMatrix4(foot.segments[1].matrixWorld);
      assert.ok(ankle.distanceTo(shinEnd)<1e-6,'shin ends at the ankle inside the sandal');
      const bounds=new T.Box3().setFromObject(foot.shoe);
      if(bounds.min.z<0)assert.ok(bounds.min.y>=DESK_TOP-.012,'shoe clears the desktop while lifting');
    }
  }
  pose(18);
  const positions=outfit.feet.map(f=>f.shoe.getWorldPosition(new T.Vector3()).toArray());
  assert.equal(new Set(positions.map(p=>p.join(','))).size,6);
  for(const foot of outfit.feet){
    const bottom=new T.Box3().setFromObject(foot.shoe).min.y;
    assert.ok(Math.abs(bottom-DESK_TOP)<.001,'sole rests on the desktop');
    const normal=new T.Vector3(0,1,0).applyQuaternion(foot.shoe.getWorldQuaternion(new T.Quaternion()));
    assert.ok(normal.distanceTo(new T.Vector3(0,1,0))<1e-6,'sole stays level despite the body leaning');
  }
  pose(6);assert.deepEqual(outfit.feet.map(f=>f.shoe.position.toArray()),initial);
  fly.group.traverse(o=>o.geometry?.dispose());for(const m of materials)m.dispose();
});
