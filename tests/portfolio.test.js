import test from 'node:test';
import assert from 'node:assert/strict';
import { HOLDINGS, CASH, usd, valuation, quoteState, restoreQuotes, parsePrice, fetchQuotes, fetchHistory } from '../public/portfolio-data.js';
import { ComputerRoom } from '../src/computer-room.js';
const prices = { BTC: 70000, ETH: 3000, SOL: 150 };
const quotes = Object.fromEntries(HOLDINGS.map(h => [h.symbol, { price: prices[h.symbol], at: 100000 }]));
test('Portfolio totals and allocations use actual supplied prices with cent rounding', () => {
  assert.equal(valuation(quotes), 16620.5);
  assert.equal(usd(valuation(quotes)), '$16,620.50');
  assert.equal(valuation({ BTC: quotes.BTC }), null);
  assert.equal(usd(null), '\u2014');
  assert.equal(quoteState(quotes, false, 100001), 'live');
  assert.equal(quoteState(quotes, true, 100001), 'cached');
  assert.equal(quoteState(quotes, false, 200000), 'cached');
  assert.equal(quoteState({}), 'unavailable');
  assert.equal(quoteState({BTC:quotes.BTC}), 'partial');
  assert.equal(CASH, 1820.5);
});
test('Quote parsing and cached data reject malformed, negative, and future values', () => {
  assert.equal(parsePrice({data:{amount:'70000.25',currency:'USD',base:'BTC'}}, 'BTC'), 70000.25);
  for (const data of [{amount:'NaN',currency:'USD'},{amount:'-1',currency:'USD'},{amount:'30',currency:'EUR'},{amount:'30',currency:'USD',base:'ETH'}]) assert.throws(()=>parsePrice({data},'BTC'));
  assert.deepEqual(restoreQuotes('{broken'), {quotes:{},history:[]});
  assert.deepEqual(restoreQuotes(JSON.stringify({quotes:{BTC:{price:NaN,at:10},ETH:{price:2000,at:300000}}}),200000).quotes,{});
  assert.deepEqual(restoreQuotes(JSON.stringify({quotes}),200000).quotes,quotes);
});
test('Public quote failures remain partial, and history contains only complete real snapshots', async () => {
  const fetcher = async url => { const symbol = url.match(/prices\/(\w+)-USD/)[1]; return {ok:true,json:async()=>({data:{amount:String(prices[symbol]),currency:'USD',base:symbol}})}; };
  const live = await fetchQuotes(fetcher); assert.equal(live.failed,false); assert.equal(valuation(live.quotes),16620.5);
  const partial = await fetchQuotes(async url => { if(url.includes('ETH')) throw Error('Offline'); return fetcher(url); });
  assert.equal(partial.failed,true); assert.equal(valuation(partial.quotes),null);
  const history = await fetchHistory([],fetcher,Date.parse('2026-09-18T12:00:00Z'));
  assert.equal(history.length,7); assert.equal(history[0].date,'2026-09-11'); assert.equal(history[6].date,'2026-09-17'); assert.deepEqual(history[0].prices,prices);
  const cached = await fetchHistory(history,()=>{throw Error('Must use cache')},Date.parse('2026-09-18T12:00:00Z')); assert.deepEqual(cached,history);
});
test('Desk cycle opens wallet at 24s, returns at 36s, repeats at 60s, and freezes when paused', () => {
  globalThis.location = {origin:'http://localhost'};
  const messages=[]; const room=Object.create(ComputerRoom.prototype);
  room.iframe={contentWindow:{postMessage:m=>messages.push(m)}};
  const sim={life:{deskFocus:true},environment:'computer',state:'Locked in'};
  room.updateDesk(23.99,sim,true); assert.equal(room.lastDeskView,false);
  room.updateDesk(.02,sim,true); assert.equal(room.lastDeskView,true);
  const beforePause = room.deskElapsed; room.updateDesk(100,sim,false); assert.equal(room.lastDeskView,true); assert.equal(room.deskElapsed,beforePause);
  room.updateDesk(11.98,sim,true); assert.equal(room.lastDeskView,true);
  room.updateDesk(.02,sim,true); assert.equal(room.lastDeskView,false);
  room.updateDesk(24,sim,true); assert.equal(room.lastDeskView,true);
  sim.life.deskFocus=false; room.updateDesk(0,sim,true); assert.equal(room.lastDeskView,false); assert.equal(room.deskElapsed,0);
  assert.deepEqual(messages.filter(m=>m.type==='desk-view').map(m=>m.wallet),[false,true,false,true,false]);
  delete globalThis.location;
});
