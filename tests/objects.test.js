import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';
import { NEW_ITEMS, itemAction } from '../src/world-items.js';
import { encodeSession, decodeSession } from '../src/session.js';
import { dialogueContext, FlyDialogue } from '../src/dialogue.js';
const advance=(sim,n)=>{for(let i=0;i<n*60;i++)sim.tick(1/60);};
const world=()=>{const s=new Simulation();s.life.autonomous=false;s.hunger=.1;s.energy=.7;return s;};

test('Every gift attracts an actual routine, and new objects keep paid interaction permissions',()=>{
 for(const [kind,def] of Object.entries(NEW_ITEMS)){
  const s=world();if(kind==='sugar')s.hunger=.85;
  const o=s.add(kind,0,0,'habitat',kind==='radio'?{station:'Space disco'}:{}),states=new Set();
  for(let i=0;i<35*60;i++){s.tick(1/60);states.add(s.state);}
  assert.ok(states.has(kind==='sugar'?'Feeding':kind==='radio'?'Dancing':def.state),`${kind}: ${[...states]}`);
  assert.ok(s.belongings.memories.some(m=>m.id===o.id&&m.visits>0),kind);
  if(['sugar','water'].includes(kind))assert.ok(o.amount<1,kind);
  if(kind==='hoop')assert.ok(s.belongings.basketSkill>.1);
  if(kind==='radio')assert.ok(s.belongings.stationPlays[1]>10);
  assert.equal(itemAction(kind),'interact');
 }
 assert.equal(itemAction('banana'),'food');
});
test('Gift routines and custom messages resume deterministically; removal keeps memories',()=>{
 for(const kind of ['note','hoop','airplane','radio']){
  const s=world(),o=s.add(kind,0,0,'habitat',{text:'<hello> & welcome',station:'Space disco'});advance(s,17);
  const restored=decodeSession(encodeSession(s));assert.ok(restored,kind);
  advance(s,35);advance(restored.sim,35);
  assert.deepEqual(JSON.parse(encodeSession(s)).world,JSON.parse(encodeSession(restored.sim)).world,kind);
  s.remove(o.id);assert.equal(s.belongings.active,null);assert.ok(s.belongings.memories.some(m=>m.id===o.id));
  assert.ok(decodeSession(encodeSession(s)));
 }
});
test('Corrupt gift data is rejected and older saves get empty belongings',()=>{
 const s=world();s.add('note',0,0);advance(s,17);const original=JSON.parse(encodeSession(s));
 for(const corrupt of [w=>w.belongings.basketSkill=2,w=>w.belongings.memories[0].lastVisit=1e9,w=>w.belongings.active.id=99,w=>w.objects[0].text='a'.repeat(121),w=>w.belongings.stationPlays=[0,-1,0]]){
  const copy=structuredClone(original);corrupt(copy.world);assert.equal(decodeSession(JSON.stringify(copy)),null);
 }
 delete original.world.belongings;assert.ok(decodeSession(JSON.stringify(original)));
});
test('Object speech reads personal notes literally and danger wins over gift routines',()=>{
 const s=world();s.add('note',0,0,'habitat',{text:'You are <special> $&'});advance(s,17);
 assert.equal(dialogueContext(s),'item_note');const d=new FlyDialogue(()=>0);d.pick=()=>'{note}';d.next=0;d.lastContext='item_note';
 assert.equal(d.update(.1,s).text,'You are <special> $&');
 const elapsed=s.belongings.active.elapsed;s.add('peppermint',s.x,s.z);advance(s,.5);
 assert.ok(['Avoiding','Panicking'].includes(s.state));assert.ok(s.belongings.active.elapsed-elapsed<.1);const interrupted=s.belongings.active.elapsed;advance(s,.1);assert.equal(s.belongings.active.elapsed,interrupted);
});
