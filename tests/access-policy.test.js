import test from 'node:test';
import assert from 'node:assert/strict';
import {canAccess,membershipTier,scopedStorage,normalizeUsername,validUsername,usernameIdentity} from '../src/access-policy.js';
import {Simulation,NEURAL_UNITS,NEURAL_CONNECTIONS} from '../src/simulation.js';
import {encodeSession,decodeSession} from '../src/session.js';
test('Visitor and free accounts can only place food in Habitat; tools require verified access',()=>{
  const free={user:{uid:'u'},verified:true};
  for(const state of [{},free]){assert.equal(canAccess(state,'food','habitat'),true);assert.equal(canAccess(state,'food','computer'),false);assert.equal(canAccess(state,'interact'),false);assert.equal(canAccess(state,'director'),false);assert.equal(canAccess(state,'brain'),true);}
  const paid={...free,entitlement:{tier:'flyest',expiresAt:2000}};
  assert.equal(canAccess(paid,'interact','habitat',1000),true);assert.equal(canAccess(paid,'interact','habitat',2000),false);
  assert.equal(canAccess({...paid,verified:false},'interact','habitat',1000),false);
  assert.equal(membershipTier({...paid,entitlement:{tier:'god',expiresAt:2000}},1000),'god');
  assert.equal(membershipTier({entitlement:paid.entitlement,verified:true},1000),'guest');
});
test('Local habitats are separated by account and usernames have a stable canonical form',()=>{
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const a=scopedStorage(storage,'a'),b=scopedStorage(storage,'b'),guest=scopedStorage(storage);
  a.setItem('world','a');b.setItem('world','b');assert.equal(a.getItem('world'),'a');assert.equal(b.getItem('world'),'b');assert.equal(guest.getItem('world'),undefined);
  assert.equal(normalizeUsername(' Fly_Guy '),'fly_guy');assert.equal(validUsername('fly_guy'),true);for(const v of ['a','../admin','<script>','has space','123guy'])assert.equal(validUsername(v),false);
});
test('Expanded neural network is real and old 192-unit activity migrates safely',()=>{
  const sim=new Simulation();assert.equal(sim.activity.length,NEURAL_UNITS);assert.equal(sim.edges.length,NEURAL_CONNECTIONS);
  const saved=JSON.parse(encodeSession(sim));saved.world.activity=Array(192).fill(.25);const migrated=decodeSession(JSON.stringify(saved));
  assert.ok(migrated);assert.equal(migrated.sim.activity.length,768);assert.ok(migrated.sim.activity.every(v=>v===.25));
});

test('Only an authenticated Godfather owner can use Director Mode',()=>{
  const member={user:{uid:'u'},verified:true,entitlement:{tier:'god',expiresAt:Date.now()+100000}};
  assert.equal(canAccess(member,'director'),false);assert.equal(canAccess({...member,creator:true},'director'),true);
  assert.equal(membershipTier({...member,creator:true}),'godfather');assert.equal(canAccess({creator:true},'director'),false);
});

test('Username sign-in uses one normalized internal identity and rejects injected names',()=>{assert.equal(usernameIdentity(' SwipingCC '),'swipingcc@accounts.hiflyguy.invalid');assert.throws(()=>usernameIdentity('other@example.com'));assert.throws(()=>usernameIdentity('../admin'));});
