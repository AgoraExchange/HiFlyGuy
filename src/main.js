import { ROOMS, invite, setDeskFocus } from './life.js';
import './style.css';
import { setupMembership } from './membership.js';
import { scopedStorage } from './access-policy.js';
import { scienceHTML, helpHTML } from './world-copy.js';
import './computer-room.css';
import { Simulation, STIMULI, withinHabitat } from './simulation.js';
import { Habitat, BrainView } from './scene.js';
import { loadSession, saveSession } from './session.js';
import { playgroundControls, setupTrainingUI, updateTrainingUI } from './training-ui.js';
import './life.css';
import { setupUpdates } from './pwa.js';
import { setupDirector } from './director.js';

const icons = {
  fly: '<path d="M12 9v10m0-9C5-2-3 9 10 12m2-2c7-12 15-1 2 2M9 16l-4 4m10-4 4 4M9 13l-6 1m12-1 6 1M10 6 8 3m6 3 2-3"/><ellipse cx="12" cy="14" rx="3" ry="5"/>',
  habitat: '<path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5m-9 5v9"/>',
  brain: '<path d="M9 4C5 1 2 7 5 9c-5 2-2 8 1 8-1 5 6 5 6 1V6c0-4 6-5 7-1 4 0 4 6 1 7 4 3 1 8-3 7-1 3-5 2-5-1M5 9l3 1m-2 7 3-2m10-10-3 3m4 4-4 1"/>',
  log: '<path d="M6 3h12v18H6zM9 7h6m-6 5h6m-6 5h4"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  focus: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="4"/>',
  clapper: '<path d="M3 10h18v11H3zM3 10 2 5l17-3 1 5zM7 4l3 4m3-5 3 4M8 14l6 3-6 3z"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
  pause: '<path d="M9 5v14m6-14v14"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  scent: '<path d="M7 19c-5-5 5-8 0-14m6 14c-5-5 5-8 0-14m6 14c-5-5 5-8 0-14"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.habitat}</svg>`;
const swatterArt = '<svg viewBox="0 0 100 75" aria-hidden="true"><g transform="rotate(30 50 35)"><path d="M48 39h4v28h-4z" fill="#b59065"/><rect x="46" y="60" width="8" height="12" rx="3" fill="#70785a"/><rect x="30" y="4" width="40" height="39" rx="8" fill="#b68a5950" stroke="#d8aa78" stroke-width="4"/><path d="M38 7v32m8-32v32m8-32v32m8-32v32M33 14h34M33 23h34M33 32h34" stroke="#c3b68b" stroke-width="1.5"/></g></svg>';
const foodArt = kind => kind === 'banana' ? '<svg viewBox="0 0 100 75"><path d="M17 21c1 39 44 57 65 18C55 61 35 42 30 20z" fill="#e7c45f"/><path d="M23 24c7 29 30 39 50 21" fill="none" stroke="#aa8337" stroke-width="2"/><path d="m24 24-4-12 8-1 3 13M79 41l6-7" stroke="#84794a" stroke-width="5"/><path d="M33 42c4 6 10 11 17 13" stroke="#ffe6a0" stroke-width="3" fill="none"/></svg>' : kind === 'tomato' ? '<svg viewBox="0 0 100 75"><ellipse cx="50" cy="44" rx="27" ry="24" fill="#ca6350"/><ellipse cx="40" cy="38" rx="11" ry="10" fill="#df8068" opacity=".7"/><path d="m50 27-16-8 13 1 4-12 4 13 14-2-13 9-6-6z" fill="#87915b"/><path d="m51 23 3-14" stroke="#a2a777" stroke-width="4"/></svg>' : '<svg viewBox="0 0 100 75"><path d="m26 28-15-8v31l16-6m48-17 14-8v31l-15-6" fill="#abbcaf" opacity=".6"/><circle cx="50" cy="37" r="24" fill="#e3e3ce"/><g fill="#c87266"><path d="M50 37 41 15a24 24 0 0 1 15-1zM50 37l23-5a24 24 0 0 1-1 15zM50 37l-2 24a24 24 0 0 1-13-5zM50 37 28 29a24 24 0 0 1 8-10zM50 37l15 19a24 24 0 0 1-13 5z"/></g><circle cx="50" cy="37" r="23" fill="none" stroke="#f2eee0" opacity=".5"/></svg>';
document.querySelector('#app').innerHTML = `
<aside class="rail"><a class="brand-mark" href="./" aria-label="HiFlyGuy home">${icon('fly')}</a><div class="rail-links"><button class="rail-link selected" data-view="habitat" aria-label="Habitat" title="Habitat">${icon('habitat')}</button><button class="rail-link" data-open="science" aria-label="Brain and data" title="Brain and data">${icon('brain')}</button><button class="rail-link" data-open="log" aria-label="Experiment log" title="Experiment log">${icon('log')}</button></div><button class="rail-link rail-bottom" data-open="help" aria-label="How to interact" title="How to interact">${icon('info')}</button><span class="rail-version">01</span></aside>
<div class="shell">
  <header class="topbar"><a class="wordmark" href="./">HiFlyGuy<span>✳</span></a><span class="brand-caption">A little life. A whole world.</span><div class="top-right"><span class="local-label"><i class="status-dot"></i> <span id="save-label">LOCAL HABITAT</span></span><button class="quiet-btn" data-open="science">About this world ${icon('arrow')}</button></div></header>
  <main>
    <section class="page-heading"><div><div class="eyebrow">YOUR OWN LITTLE UNIVERSE</div><h1>Meet FlyGuy<span>.</span></h1><p>A curious little fly. An entire world to discover.</p></div><div class="session"><span class="eyebrow">SESSION TIME</span><div><i class="status-dot"></i><span id="session-time">00:00:00</span><span class="live-label" id="run-label">LIVE</span></div></div></section>
    <div class="workspace-heading"><div class="tabs"><button class="tab active" data-view="habitat">${icon('habitat')} Habitat <span>01</span></button><button class="tab" data-open="log">${icon('log')} Experiment log</button></div><button class="model-badge" data-open="science"><span class="tiny-dot"></span> Fruit-fly brain model ${icon('info')}</button></div>
    <div class="workspace">
      <div class="world-column">
        <section class="viewport" id="viewport" aria-label="FlyGuy habitat">
          <div class="scene-top"><div class="specimen-tag"><i class="status-dot"></i><span>FLYGUY <b>/</b> <small>D. melanogaster</small></span></div><span class="scene-code">HABITAT_001</span></div>
          <div class="scene-title"><span class="eyebrow">SMALL WINGS. BIG WORLD.</span><h2>Make yourself<br>at home, little guy.</h2></div>
          <div class="environment-controls" role="group" aria-label="Choose environment">${Object.entries(ROOMS).map(([id, r], i) => `<button data-environment="${id}" aria-pressed="false">0${i + 1} <span>${r.name}</span><i aria-hidden="true"></i></button>`).join('')}</div>
          <div class="life-location"><div><span class="life-kicker">FLYGUY IS IN</span><strong id="actual-room">Habitat</strong><span id="life-activity">Exploring</span></div><div class="life-location-actions"><button id="find-fly">Find FlyGuy</button><button id="invite-fly">Invite here</button><button id="autonomy-btn" aria-pressed="true" title="Allow FlyGuy to choose his own rooms and routines">Free will: on</button><button id="adderall-btn" aria-pressed="false" hidden title="Send FlyGuy to the desk and work through markets">Adderall: off</button></div></div>
          <div class="room-caption"><span id="room-kicker">01 / HABITAT</span><h2 id="room-title">A room of his own.</h2><p id="room-presence">A little life, unfolding.</p></div>
          ${playgroundControls}
          <div class="desk-controls" id="desk-controls" hidden><button id="watch-screen-btn" aria-pressed="true">Watch screen</button><button id="terminal-btn">Open terminal ${icon('expand')}</button></div>
          <div class="desk-caption" id="desk-caption" hidden><span>NIGHT DESK / MARKET OBSERVATORY</span><p>A little fly. A very big screen.</p><small>Watching is a simulated activity. Market data is separate.</small></div>
          <dialog id="terminal-dialog" aria-labelledby="terminal-title"><div class="terminal-dialog-head"><span id="terminal-title">FLYGUY / MARKET TERMINAL</span><button id="close-terminal" aria-label="Close market terminal">${icon('close')}</button></div><div id="terminal-mount"></div></dialog>
          <div class="view-tools"><button id="focus-btn" title="Follow FlyGuy up close" aria-label="Follow FlyGuy up close" aria-pressed="false">${icon('focus')}</button><button id="scent-btn" title="Show scent fields" aria-label="Show scent fields" aria-pressed="false">${icon('scent')}</button><button id="camera-btn" title="Reset camera" aria-label="Reset camera">${icon('reset')}</button><button id="fullscreen-btn" title="Fullscreen habitat" aria-label="Fullscreen habitat">${icon('expand')}</button><button id="remove-selected-btn" title="Remove selected object" aria-label="Remove selected object" hidden>${icon('trash')}</button><button id="memory-btn" title="Brain and data" aria-label="Brain and data" aria-haspopup="dialog">${icon('brain')}</button><button id="director-actions-btn" title="Actions" aria-label="Director actions" aria-haspopup="dialog" hidden>${icon('clapper')}</button></div>
          <div id="selection-label" class="selection-label" hidden></div>
          <div class="placement-banner" id="placement-banner" hidden><span id="placement-message"></span><button id="place-center">Place near FlyGuy</button><button id="cancel-placement" aria-label="Cancel placement">${icon('close')}</button></div>
          <div class="swatter-banner" id="swatter-banner" hidden><div><strong>FLY SWATTER</strong><span id="swatter-status">Move over the habitat to guide it.</span></div><span id="distress-value">Distress 0%</span><button id="put-away-swatter">Put away <kbd>Esc</kbd></button></div>
          <div class="fly-label" id="fly-label"><span class="label-line"></span><span>FlyGuy <i class="tiny-dot"></i></span><small id="fly-action">Just looking around</small></div>
          <div class="scene-bottom"><span class="camera-hint">${icon('focus')} Drag to orbit <b>·</b> Scroll to zoom</span><span class="scene-coordinates" id="coordinates">X +0.00 &nbsp; Y +1.50 &nbsp; Z +0.00</span></div>
          <div id="render-error" class="render-error" hidden></div>
          <div class="memory-hud" id="memory-hud"><i></i><span id="memory-hud-text">Learning as he goes</span></div>
          <div class="inventory" id="inventory" role="group" aria-label="Habitat inventory">
            <div class="inventory-heading"><span>POCKET WORLD / INVENTORY</span><span>1–4 to select · Esc to cancel</span></div>
            <div class="inventory-slots">${Object.entries(STIMULI).map(([kind, o], i) => `<button class="inventory-slot" data-stimulus="${kind}" aria-label="Inventory: ${o.name.toLowerCase()}" aria-pressed="false" title="${o.name} (${i + 1})"><kbd>${i + 1}</kbd><div class="food-art">${foodArt(kind)}</div><span>${o.name}</span></button>`).join('')}<button class="inventory-slot" data-tool="swatter" aria-label="Inventory: fly swatter" aria-pressed="false" title="Fly Swatter (4)"><kbd>4</kbd><div class="food-art">${swatterArt}</div><span>Fly Swatter</span></button>${[5, 6].map(i => `<div class="inventory-slot empty" aria-label="Empty inventory slot ${i}"><kbd>${i}</kbd><span>—</span></div>`).join('')}</div>
          </div>
        </section>
        <div class="playback"><div class="playback-left"><button class="play-button" id="pause-btn" aria-label="Pause virtual world">${icon('pause')}</button><span id="playback-status">Virtual World Running</span><span class="playback-divider"></span><div class="speed-control" aria-label="Simulation speed"><button data-speed="0.5">½×</button><button data-speed="1" class="active">1×</button><button data-speed="2">2×</button></div></div><div class="playback-actions"><button class="quiet-btn" id="director-btn" aria-pressed="false">${icon('clapper')} Directors mode</button><button class="quiet-btn reset-world" id="reset-btn">${icon('reset')} Reset world</button></div></div>
        <section class="interaction-section"><div class="section-heading"><div><span class="eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</span><h2>Put something in his world.</h2></div><span class="step-label">SELECT → PLACE → OBSERVE</span></div><div class="stimulus-cards">${Object.entries(STIMULI).map(([kind, o]) => `<button class="stimulus-card" data-stimulus="${kind}" aria-label="Place ${o.name.toLowerCase()}"><div class="food-art ${kind}">${foodArt(kind)}</div><div class="stimulus-copy"><strong>${o.name}</strong><span>${o.description}</span><small><i style="background:${o.color}"></i>${o.response}</small></div><span class="add-circle">${icon('plus')}</span></button>`).join('')}</div><button class="swatter-launch" data-tool="swatter" aria-label="Use fly swatter" aria-pressed="false"><div class="food-art">${swatterArt}</div><span><strong>Fly Swatter</strong><small>A little chase. He always gets away.</small></span><kbd>4</kbd></button><div class="objects-footer"><span><i class="tiny-dot"></i> <span id="object-count">0 objects</span> in this room <span class="muted">/ 8 max</span></span><button class="text-button" id="clear-btn" disabled>Clear objects</button></div><div id="object-list" class="object-list"></div></section>
      </div>
      <aside class="telemetry">
        <section class="neural-panel"><div class="panel-heading"><h2>${icon('brain')} A window into his world</h2><i class="status-dot"></i></div><div class="neural-subhead"><span>NEURAL ACTIVITY</span><button id="reset-brain-btn" class="outlined-tag" type="button" title="Reset neural map: show the entire map">BRAIN MODEL</button></div><div id="brain-view" class="brain-view"><span class="brain-axis">DRAG TO ROTATE &middot; SCROLL / PINCH TO ZOOM</span></div><div class="brain-legend"><span><i></i> Quiet</span><div></div><span>Active <i></i></span></div><div class="network-stats"><div><strong>768</strong><span>MODEL UNITS</span></div><div><strong>4,608</strong><span>CONNECTIONS</span></div><button data-open="science" aria-label="Explore the brain model">${icon('arrow')}</button></div><p class="data-caption">Fruit-fly-inspired brain model</p></section>
        <section class="vitals-panel"><div class="panel-heading"><h2>How’s our little guy?</h2><span class="pill" id="behavior-pill">Exploring</span></div><div class="vital"><span>Energy</span><div class="meter"><div id="energy-meter"></div></div><strong id="energy-value">85%</strong></div><div class="vital"><span>Hunger</span><div class="meter hunger"><div id="hunger-meter"></div></div><strong id="hunger-value">62%</strong></div><div class="vitals-note" id="vitals-note">A little wander. A lot to discover.</div></section>
        <section class="signal-panel"><div class="panel-heading"><h2>Live signals</h2><span class="eyebrow">MODEL OUTPUT</span></div><div class="signal-metric"><span>Sensory response</span><strong><span id="signal-value">0.00</span> <small>0–1</small></strong></div><canvas id="signal-chart" aria-label="Recent sensory response from the brain model"></canvas><div class="signal-legend"><span><i></i> Attraction</span><span><i></i> Aversion</span><span>LAST 30s</span></div></section>
        <section class="memory-panel"><div class="panel-heading"><h2>Learning his world</h2><span class="pill" id="memory-count">0 places</span></div><p class="memory-intro">Unpleasant encounters leave a little memory.</p><div id="memory-list"><p class="memory-empty">No wary spots yet. Let him discover a peppermint.</p></div><div class="memory-footnote">Dashed lavender circles mark remembered areas. Safe visits and time rebuild trust.</div></section>
        <section class="recent-panel"><div class="panel-heading"><h2>Little moments</h2><button class="text-button" data-open="log">View all ${icon('arrow')}</button></div><div id="recent-events" aria-live="polite"></div></section>
      </aside>
    </div>
    <footer><span>${icon('fly')} A small experiment in curiosity.</span><button class="text-button" data-open="science">Inspired by the FlyWire connectome ${icon('arrow')}</button><div class="app-updates"><button class="text-button" id="check-updates">Check for updates</button><span id="update-status" role="status" aria-live="polite"></span></div><span class="footer-build">HIFLYGUY / V0.1</span></footer>
  </main>
</div>
<dialog id="dialog"><div class="dialog-head"><span class="eyebrow" id="dialog-kicker"></span><button id="close-dialog" aria-label="Close dialog">${icon('close')}</button></div><div id="dialog-body"></div></dialog><div class="toast" id="toast" role="status" hidden></div>`;

const $ = s => document.querySelector(s);
let storage; try { storage = window.localStorage; } catch { /* Private browser settings may disable storage. */ }
const browserStorage=storage; storage=scopedStorage(browserStorage);
const restored = loadSession(storage), sim = restored?.sim ?? new Simulation();
let viewRoom = restored?.viewRoom ?? sim.environment, lastResidence = sim.environment;
let director, access;
const allowed=(action,room=viewRoom)=>access?.allowed(action,room)??false;
const authorize=(action,room=viewRoom)=>access?.require(action,room)??false;
let habitat, brain, paused = restored?.paused ?? false, speed = restored?.speed ?? 1, placing = null, swatterEquipped = false, selectedId = null, history = [], lastSample = sim.time, lastUI = -1, toastTimer, logSignature = '', dialogMode;
function saveWorld() {
  const saved = saveSession(storage, sim, { paused, speed, viewRoom });
  $('#save-label').textContent = saved ? 'WORLD SAVED' : 'SAVE UNAVAILABLE';
  $('#save-label').parentElement.title = saved ? 'Your world is saved in this browser. Reloading will resume it.' : 'This browser could not save your world. Keep this tab open or export the session log.';
  return saved;
}
setupUpdates(saveWorld);
const formatTime = (n, hours = false) => { const s = Math.floor(n); return (hours ? `${String(Math.floor(s / 3600)).padStart(2, '0')}:` : '') + `${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 3500); }
function cancelPlacement() { placing = null; swatterEquipped = false; sim.putAwaySwatter(); habitat?.setSwatter(false); habitat?.setPlacement(false); $('#placement-banner').hidden = true; $('#swatter-banner').hidden = true; document.querySelectorAll('[data-stimulus], [data-tool]').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); }); }
function equipSwatter() {
  if(!authorize('interact'))return;
  if (!habitat) return;
  if (sim.environment !== viewRoom) return toast('FlyGuy is in another room. Use Find FlyGuy to visit him.');
  if (swatterEquipped) { cancelPlacement(); return; }
  cancelPlacement(); selectObject(null); swatterEquipped = true; habitat.setSwatter(true); $('#swatter-banner').hidden = false;
  document.querySelectorAll('[data-tool="swatter"]').forEach(b => { b.classList.add('selected'); b.setAttribute('aria-pressed', 'true'); });
}
function selectObject(id) {
  if(id!==null&&!allowed('interact'))return;
  selectedId = sim.objects.some(o => o.id === id) ? id : null;
  habitat?.setSelected(selectedId); $('#remove-selected-btn').hidden = selectedId === null; $('#selection-label').hidden = selectedId === null;
  if (selectedId !== null) $('#selection-label').textContent = `${STIMULI[sim.objects.find(o => o.id === selectedId).kind].name} selected · trash to remove`;
}
function removeObject(id) {
  if(!authorize('interact'))return;
  const object = sim.objects.find(o => o.id === id); if (!object) return;
  sim.remove(id); sim.log(`${STIMULI[object.kind].name} removed.`, 'object');
  if (selectedId === id) selectObject(null);
  renderObjects(); toast(object.kind === 'peppermint' && sim.memories.length ? 'Peppermint removed. FlyGuy still remembers what happened here.' : 'Object removed from the habitat.');
  saveWorld();
}
function place(x, z) { if (!placing) return; if(!allowed(placing==='peppermint'?'interact':'food',viewRoom)){cancelPlacement();return toast('Visitors can leave fruit in the Habitat. Choose that room first.');} const o = sim.add(placing, x, z, viewRoom); if (o) { toast(`${STIMULI[placing].name} added. Let’s see what happens.`); cancelPlacement(); renderObjects(); saveWorld(); } else { toast('Eight objects is plenty for this little world. Remove one first.'); cancelPlacement(); } }
try { habitat = new Habitat($('#viewport'), place, selectObject, (x, z) => { if (x === null) sim.putAwaySwatter(); else if (allowed('interact') && viewRoom === sim.environment) sim.aimSwatter(x, z); }, index => { if(!allowed('interact'))return; sim.training.selected = index; selectObject(null); saveWorld(); }, ()=>authorize('interact')); brain = new BrainView($('#brain-view')); } catch (error) { console.error(error); $('#render-error').hidden = false; $('#render-error').textContent = 'The 3D view needs WebGL. Enable hardware acceleration in your browser, then reload HiFlyGuy.'; }
setupTrainingUI(sim, saveWorld, toast, cancelPlacement, ()=>authorize('interact'));
$('#vitals-note').insertAdjacentHTML('beforebegin', '<div class="vital"><span>Mood</span><div class="meter mood"><div id="mood-meter"></div></div><strong id="mood-value">Content</strong></div><p id="life-details" class="life-details"></p><p id="life-habits" class="life-details"></p>');

function refreshEnvironment() {
  const computer = viewRoom === 'computer';
  habitat?.setEnvironment(viewRoom);
  document.querySelectorAll('button[data-environment]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.environment === viewRoom)));
  $('#adderall-btn').hidden = !computer;
  $('#desk-controls').hidden = $('#desk-caption').hidden = !computer;
  const playground = viewRoom === 'playground';
  $('#playground-controls').hidden = !playground; $('#training-dock').hidden = !playground || $('#training-toggle').getAttribute('aria-expanded') !== 'true';
  const number = Object.keys(ROOMS).indexOf(viewRoom) + 1;
  $('.scene-code').textContent = `ROOM_00${number}`; $('#room-kicker').textContent = `0${number} / ${ROOMS[viewRoom].name.toUpperCase()}`; $('#room-title').textContent = ROOMS[viewRoom].subtitle;
  $('#viewport').setAttribute('aria-label', `FlyGuy ${ROOMS[viewRoom].name}`);
  renderObjects();
  $('#watch-screen-btn').setAttribute('aria-pressed', String(sim.watchScreen));
  $('#watch-screen-btn').textContent = sim.watchScreen ? 'Watching enabled' : 'Watch screen';
  $('#focus-btn').classList.remove('active'); $('#focus-btn').setAttribute('aria-pressed', 'false');
}
function viewEnvironment(room) {
  if (!habitat || viewRoom === room) return;
  cancelPlacement(); selectObject(null); viewRoom = room; refreshEnvironment(); saveWorld();
}
document.querySelectorAll('button[data-environment]').forEach(b => b.onclick = () => viewEnvironment(b.dataset.environment));
$('#find-fly').onclick = () => { viewEnvironment(sim.environment); habitat?.frame(true); };
$('#invite-fly').onclick = () => { if(!authorize('interact'))return; invite(sim, viewRoom); saveWorld(); toast(paused ? 'Invitation saved. Resume time so he can come over.' : sim.environment === viewRoom ? 'He will stay with you for a little while.' : 'He is on his way. Watch for him at the doorway.'); };
$('#autonomy-btn').onclick = () => { if(!authorize('interact'))return; sim.life.autonomous = !sim.life.autonomous; saveWorld(); updateUI(); toast(sim.life.autonomous ? 'Free to choose his own rooms and routines.' : 'New routines paused. His current visit will finish.'); };
$('#adderall-btn').onclick = () => { if(!authorize('interact'))return;
  cancelPlacement(); setDeskFocus(sim, !sim.life.deskFocus); saveWorld(); updateUI();
  toast(sim.life.deskFocus ? (paused ? 'Resume to send FlyGuy to the desk.' : 'Locked in. Markets change every six seconds once he settles.') : 'Desk session finished.');
};
$('#watch-screen-btn').onclick = () => { if(!authorize('interact'))return;
  if (sim.life.deskFocus) setDeskFocus(sim, false);
  sim.watchScreen = !sim.watchScreen;
  $('#watch-screen-btn').setAttribute('aria-pressed', String(sim.watchScreen));
  $('#watch-screen-btn').textContent = sim.watchScreen ? 'Watching enabled' : 'Watch screen';
  toast(sim.watchScreen ? 'FlyGuy will head to the laptop when he has a quiet moment.' : 'Free to roam the desk.'); saveWorld();
};
$('#terminal-btn').onclick = () => { if(!authorize('interact'))return;
  const room = habitat?.computerRoom; if (!room) return;
  cancelPlacement(); moveTerminal($('#terminal-mount')); $('#terminal-dialog').showModal(); $('#close-terminal').focus();
};
function moveTerminal(parent) { const frame = habitat.computerRoom.iframe; frame.contentWindow?.saveMarketState?.(); if (parent.moveBefore) parent.moveBefore(frame, null); else parent.append(frame); habitat.computerRoom.setTerminalMode(parent !== habitat.computerRoom.display); }
$('#close-terminal').onclick = () => $('#terminal-dialog').close();
$('#terminal-dialog').addEventListener('close', () => { moveTerminal(habitat.computerRoom.display); $('#terminal-btn').focus(); });
window.addEventListener('message', e => { if (e.origin === location.origin && e.source === habitat?.computerRoom?.iframe.contentWindow && e.data?.type === 'terminal-escape') $('#terminal-dialog').close(); });
refreshEnvironment();
director = setupDirector({ authorize:()=>authorize('director'), allowed:()=>allowed('director'), viewport: $('#viewport'), prepare: () => { cancelPlacement(); selectObject(null); $('#dialog').close(); $('#terminal-dialog').close(); saveWorld(); } });

function selectStimulus(kind) {
  if(kind==='peppermint'&&!authorize('interact'))return;
  if(kind!=='peppermint'&&!allowed('food',viewRoom)){toast('Leave fruit in the Habitat. FlyGuy can find it when he returns.');viewEnvironment('habitat');}
  if(!allowed(kind==='peppermint'?'interact':'food',viewRoom))return;
  if (!habitat) return toast('Enable WebGL to place objects in the 3D habitat.');
  if (sim.roomObjects(viewRoom).length >= 8) return toast('Habitat full. Remove an object to make a little room.');
  cancelPlacement(); selectObject(null); placing = kind;
  document.querySelectorAll('[data-stimulus]').forEach(b => { const active = b.dataset.stimulus === kind; b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active)); });
  habitat.setPlacement(true); $('#placement-message').textContent = `Click the floor inside the circle to place ${STIMULI[kind].name.toLowerCase()}.`; $('#placement-banner').hidden = false; $('#place-center').textContent = viewRoom === sim.environment ? 'Place near FlyGuy' : 'Place in this room';
}
document.querySelectorAll('[data-stimulus]').forEach(b => b.onclick = () => selectStimulus(b.dataset.stimulus));
document.querySelectorAll('[data-tool="swatter"]').forEach(b => b.onclick = equipSwatter);
$('#put-away-swatter').onclick = cancelPlacement;
window.addEventListener('blur', () => sim.putAwaySwatter());
$('#reset-brain-btn').onclick = () => brain?.resetView();
$('#cancel-placement').onclick = cancelPlacement;
$('#place-center').onclick = () => { const p = withinHabitat(viewRoom === sim.environment ? sim.x + 1.8 : 0, viewRoom === sim.environment ? sim.z + .7 : 2); place(p.x, p.z); };
function setPaused(value) { paused = value; $('#pause-btn').innerHTML = icon(paused ? 'play' : 'pause'); $('#pause-btn').setAttribute('aria-label', paused ? 'Resume virtual world' : 'Pause virtual world'); $('#playback-status').textContent = paused ? 'Virtual World Paused' : 'Virtual World Running'; $('#run-label').textContent = paused ? 'PAUSED' : 'LIVE'; document.body.classList.toggle('paused', paused); saveWorld(); }
$('#pause-btn').onclick = () => {if(authorize('interact'))setPaused(!paused);};
document.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => { if(!authorize('interact'))return; speed = +b.dataset.speed; saveWorld(); document.querySelectorAll('[data-speed]').forEach(c => c.classList.toggle('active', b === c)); toast(`Time moves at ${speed}× speed.`); });
$('#focus-btn').onclick = () => { if (!habitat) return; if (viewRoom !== sim.environment) viewEnvironment(sim.environment); habitat.frame(!habitat.follow); $('#focus-btn').classList.toggle('active', habitat.follow); $('#focus-btn').setAttribute('aria-pressed', String(habitat.follow)); };
$('#camera-btn').onclick = () => { habitat?.frame(); $('#focus-btn').classList.remove('active'); $('#focus-btn').setAttribute('aria-pressed', 'false'); };
$('#scent-btn').onclick = () => { if (!habitat) return; habitat.showScent = !habitat.showScent; $('#scent-btn').classList.toggle('active', habitat.showScent); $('#scent-btn').setAttribute('aria-pressed', String(habitat.showScent)); toast(habitat.showScent ? 'Scent fields visible. Place an object to see its reach.' : 'Scent fields hidden.'); };
$('#fullscreen-btn').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await $('#viewport').requestFullscreen(); } catch { toast('Your browser cannot enter fullscreen here.'); } };
document.addEventListener('fullscreenchange', () => {
  const full = document.fullscreenElement === $('#viewport');
  (full ? $('#viewport') : document.body).append($('#toast'));
  $('#fullscreen-btn').setAttribute('aria-label', full ? 'Exit fullscreen habitat' : 'Fullscreen habitat'); $('#fullscreen-btn').title = full ? 'Exit fullscreen habitat' : 'Fullscreen habitat';
});
$('#remove-selected-btn').onclick = () => removeObject(selectedId);
$('#memory-btn').onclick = () => openDialog('science');
$('#clear-btn').onclick = () => { if(!authorize('interact'))return; sim.clear(viewRoom); selectObject(null); renderObjects(); cancelPlacement(); saveWorld(); toast('Objects cleared. Learned memories remain until they fade or you reset.'); };
$('#reset-btn').onclick = () => { if(!authorize('interact'))return; sim.reset(); viewRoom = 'habitat'; lastResidence = sim.environment; refreshEnvironment(); selectObject(null); history = []; lastSample = 0; logSignature = ''; habitat?.resetTrail(); habitat?.frame(); $('#focus-btn').classList.remove('active'); $('#focus-btn').setAttribute('aria-pressed', 'false'); setPaused(false); cancelPlacement(); renderObjects(); saveWorld(); toast('A new beginning for FlyGuy.'); };
function renderObjects() {
  const objects = sim.roomObjects(viewRoom);
  $('#object-count').textContent = `${objects.length} object${objects.length === 1 ? '' : 's'}`; $('#clear-btn').disabled = !objects.length;
  $('#object-list').innerHTML = objects.map(o => `<button class="object-chip" data-remove="${o.id}" aria-label="Remove ${STIMULI[o.kind].name.toLowerCase()} ${o.id}"><i style="background:${STIMULI[o.kind].color}"></i>${STIMULI[o.kind].name} ${icon('close')}</button>`).join('');
  document.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => removeObject(+b.dataset.remove));
}
const escapeHTML = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const eventHTML = e => `<div class="event"><span class="event-dot ${e.type}"></span><p>${escapeHTML(e.message)}<time>${formatTime(e.time)}</time></p></div>`;
function renderLog() { return `<h2>A collection of little moments.</h2><p class="dialog-intro">Every new object, every change of direction. This is FlyGuy’s current session.</p><button class="secondary-btn" id="export-log">${icon('download')} Export session</button><div class="full-log">${sim.events.map(eventHTML).join('')}</div>`; }
function restoreBrain(){const view=$('#brain-view');if(view&&view.parentElement.id==='science-brain')$('.neural-panel').insertBefore(view,$('.brain-legend'));}
function openDialog(mode){
  restoreBrain();dialogMode=mode;$('#dialog-kicker').textContent=mode==='science'?'BRAIN & DATA':mode==='log'?'FLYGUY FIELD NOTES':'HOW TO INTERACT';
  $('#dialog-body').innerHTML=mode==='science'?scienceHTML:mode==='log'?renderLog():helpHTML(allowed('interact'),!!access?.state.user,allowed('director'));
  if(mode==='science')$('#science-brain').append($('#brain-view'));
  if(mode==='log')$('#export-log').onclick=()=>{const data={project:'HiFlyGuy',model:'fruit-fly-inspired-rate-network',flywireDataLoaded:false,simulatedSeconds:sim.time,objects:sim.objects,memories:sim.memories,training:sim.training,life:sim.life,environment:sim.environment,viewRoom,events:sim.events};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='hiflyguy-session.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  if(!$('#dialog').open)$('#dialog').showModal();
}
$('#dialog').addEventListener('close',restoreBrain);

document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openDialog(b.dataset.open));
$('#close-dialog').onclick = () => $('#dialog').close();
$('#dialog').addEventListener('click', e => { if (e.target === $('#dialog')) { const r = $('#dialog').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('#dialog').close(); } });
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { $('#dialog').close(); $('#viewport').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
document.addEventListener('keydown', e => {
  if (director?.busy || access?.busy) return;
  const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable;
  if (e.key === 'Escape') { cancelPlacement(); selectObject(null); }
  if ($('#dialog').open || $('#terminal-dialog').open || editing || e.repeat) return;
  if (['1', '2', '3', '4'].includes(e.key)) { e.preventDefault(); if (e.key === '4') equipSwatter(); else selectStimulus(Object.keys(STIMULI)[+e.key - 1]); }
  if (e.key === 'Delete' && selectedId !== null) { e.preventDefault(); removeObject(selectedId); }
  if (e.code === 'Space' && !['BUTTON', 'A'].includes(document.activeElement.tagName)) { e.preventDefault(); if(authorize('interact'))setPaused(!paused); }
});

function chart() {
  const canvas = $('#signal-chart'), r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio, 2);
  if (canvas.width !== Math.floor(r.width * d) || canvas.height !== Math.floor(r.height * d)) { canvas.width = r.width * d; canvas.height = r.height * d; }
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height; ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#29302a'; ctx.lineWidth = d * 0.6;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, i * h / 4); ctx.lineTo(w, i * h / 4); ctx.stroke(); }
  for (const [key, color] of [['scent', '#dce9a0'], ['aversion', '#80b7a5']]) { ctx.strokeStyle = color; ctx.lineWidth = 1.5 * d; ctx.beginPath(); history.forEach((s, i) => { const x = w - ((sim.time - s.time) / 30) * w, y = h - 7 * d - s[key] * (h - 14 * d); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); }
}
function updateUI() {
  updateTrainingUI(sim, !allowed('interact') || paused || sim.environment !== 'playground');
  const present = sim.environment === viewRoom, l = sim.life;
  if (lastResidence !== sim.environment) { cancelPlacement(); lastResidence = sim.environment; saveWorld(); }
  $('#actual-room').textContent = ROOMS[sim.environment].name;
  $('#life-activity').textContent = sim.life.destination ? 'To ' + ROOMS[sim.life.destination].name : sim.state;
  $('#find-fly').hidden = present; $('#invite-fly').textContent = present ? 'Stay with me' : 'Invite here';
  $('#adderall-btn').setAttribute('aria-pressed', String(l.deskFocus)); $('#adderall-btn').textContent = l.deskFocus ? 'Adderall: on' : 'Adderall: off';
  $('#autonomy-btn').setAttribute('aria-pressed', String(l.autonomous)); $('#autonomy-btn').textContent = l.autonomous ? 'Free will: on' : 'Free will: off';
  $('#room-presence').textContent = present ? (viewRoom === 'habitat' ? (l.tidiness > .7 ? 'Sheets smoothed. A little place to come home to.' : l.tidiness > .4 ? 'A lived-in room. The sheets can wait.' : 'Rumpled sheets. He has had a long day.') : sim.state + '. A moment in his own little world.') : 'An empty room. He is at the ' + ROOMS[sim.environment].name + '.';
  document.querySelectorAll('button[data-environment]').forEach(b => { b.classList.toggle('fly-resident', b.dataset.environment === sim.environment); });
  $('#mood-value').textContent = l.mood > .65 ? 'Content' : l.mood > .4 ? 'Quiet' : 'Low spirits';
  $('#mood-meter').style.width = Math.round(l.mood * 100) + '%';
  $('#life-details').textContent = 'Motivation ' + Math.round(l.motivation * 100) + '% ? Stress ' + Math.round(l.stress * 100) + '% ? Room care ' + Math.round(l.tidiness * 100) + '%';
  $('#life-habits').textContent = (l.buzz > .15 ? 'Tipsy ? ' : '') + l.cigarettes + ' smoke breaks ? ' + l.drinks + ' drinks';
  $('#watch-screen-btn').disabled = !present;
  $('#watch-screen-btn').setAttribute('aria-pressed', String(sim.watchScreen)); $('#watch-screen-btn').textContent = sim.watchScreen ? 'Watching enabled' : 'Watch screen';

  $('#session-time').textContent = formatTime(sim.time, true); $('#behavior-pill').textContent = sim.state;
  $('#behavior-pill').classList.toggle('panicking', sim.state === 'Panicking');
  $('#distress-value').textContent = `Distress ${Math.round(sim.distress * 100)}%`;
  $('#swatter-status').textContent = paused ? 'Time is paused. Resume to chase.' : !sim.swatter.active ? 'Move over the habitat to guide it.' : sim.state === 'Panicking' ? 'Too close! FlyGuy is making a quick escape.' : 'Move closer. He always has a head start.';
  for (const key of ['energy', 'hunger']) { const n = Math.round(sim[key] * 100); $(`#${key}-value`).textContent = `${n}%`; $(`#${key}-meter`).style.width = `${n}%`; }
  const notes = { Exploring: sim.appetite ? 'A little wander. A lot to discover.' : 'Full for now. Time to enjoy the world.', 'Seeking food': 'Something smells interesting over there.', Feeding: 'Found a snack. Life is pretty good.', Avoiding: 'A strong scent. Time for a little distance.', Cautious: 'I remember this spot. Better take another route.', Resting: 'Even little wings need a little rest.', Grooming: 'A little pause to tidy up those tiny legs.', Panicking: 'Swatter nearby! Faster wings, quick escape.' };
  notes['Approaching screen'] = 'A glowing laptop. Let’s get a closer look.';
  notes['Watching screen'] = 'Settled at the laptop, watching the glow.';
  Object.assign(notes, { Listening: 'A familiar signal. Taking a moment to respond.', 'Coming when called': sim.training.active?.perch === 'you' ? 'Coming over to say hello to you.' : 'On the way to your chosen landing pad.', 'Practicing flip': 'Trying a little tumble. Practice makes progress.', Backflipping: 'A learned trick, just for you.', 'Waiting for treat': 'That went well! A treat would help him remember.', Perching: 'A little landing spot of his own.', 'Finding a perch': 'Choosing somewhere to rest those wings.' });
  $('#memory-count').textContent = `${sim.memories.length} place${sim.memories.length === 1 ? '' : 's'}`;
  const localMemories = sim.roomMemories(viewRoom);
  $('#memory-hud-text').textContent = localMemories.length ? `${localMemories.length} remembered area${localMemories.length === 1 ? '' : 's'} in this room` : 'No wary spots in this room';
  $('#memory-list').innerHTML = sim.memories.length ? [...sim.memories].sort((a, b) => b.strength - a.strength).slice(0, 3).map(m => `<div class="memory-row"><span>Wary spot ${m.id}<small>${ROOMS[m.room ?? sim.environment].name} ? ${m.encounters} encounter${m.encounters === 1 ? '' : 's'} · X ${m.x.toFixed(1)} / Z ${m.z.toFixed(1)}</small></span><strong>${Math.round(m.strength * 100)}%<small>CAUTION</small></strong><div class="memory-strength"><i style="width:${m.strength * 100}%"></i></div></div>`).join('') : '<p class="memory-empty">No wary spots yet. Let him discover a peppermint.</p>';
  $('#vitals-note').textContent = notes[sim.state] ?? ({ Sleeping: 'Curled up at home. Let the world wait.', Smoking: 'An ember, a breath, the city below.', 'Having a drink': 'A quiet seat at the bar. Another round.', 'Watching the city': 'Little wings. An enormous horizon.', 'Making the bed': 'A little care for the place he calls home.', 'Heading out': 'A doorway and somewhere else to be.', 'Crossing doorway': 'Between one little moment and the next.', 'Settling in': 'Finding his spot.' })[sim.state] ?? sim.state; $('#fly-action').textContent = sim.state === 'Exploring' ? 'Just looking around' : sim.state;
  $('#signal-value').textContent = Math.max(sim.signals.scent, sim.signals.aversion).toFixed(2);
  $('#coordinates').textContent = `X ${sim.x.toFixed(2)}   Y ${sim.y.toFixed(2)}   Z ${sim.z.toFixed(2)}`;
  const signature = `${sim.events.length}/${sim.events[0]?.time}/${sim.events[0]?.message}`;
  if (signature !== logSignature) { logSignature = signature; $('#recent-events').innerHTML = sim.events.slice(0, 3).map(eventHTML).join(''); if ($('#dialog').open && dialogMode === 'log') $('.full-log').innerHTML = sim.events.map(eventHTML).join(''); }
  chart();
}
let memberUid='guest',previousAccess=false;
function applyMembership(state){
  const uid=state.user?.uid??'guest',paid=access?.allowed('interact')??false;
  if(uid!==memberUid){
    saveWorld();cancelPlacement();selectObject(null);storage=scopedStorage(browserStorage,uid);
    const saved=loadSession(storage);Object.assign(sim,saved?.sim??new Simulation());
    paused=saved?.paused??false;speed=saved?.speed??1;viewRoom=saved?.viewRoom??sim.environment;lastResidence=sim.environment;
    history=[];lastSample=sim.time;logSignature='';habitat?.resetTrail();refreshEnvironment();memberUid=uid;setPaused(paused);document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('active',+b.dataset.speed===speed));
  }
  if(!paid){
    if($('#terminal-dialog').open)$('#terminal-dialog').close();
    if(previousAccess||sim.swatter.active)cancelPlacement();
    if(sim.training.active||sim.training.pending)sim.cancelLesson();
    sim.life.autonomous=true;sim.life.holdUntil=0;if(sim.life.deskFocus)setDeskFocus(sim,false);sim.watchScreen=false;speed=1;
    if(paused)setPaused(false);
  }
  previousAccess=paid;
  const locked='[data-tool="swatter"],[data-stimulus="peppermint"],#training-toggle,#invite-fly,#autonomy-btn,#adderall-btn,#watch-screen-btn,#terminal-btn,#pause-btn,[data-speed],#reset-btn,#clear-btn';
  document.querySelectorAll(locked).forEach(button=>{button.classList.toggle('access-locked',!paid);button.setAttribute('aria-description',paid?'':'Membership required');});
  $('#director-btn').hidden=!allowed('director');if(!allowed('director'))$('#director-actions-btn').hidden=true;
}
let previous = performance.now(), accumulator = 0;
function animate(now) {
  requestAnimationFrame(animate); const rawElapsed = Math.max(0, (now - previous) / 1000), elapsed = Math.min(rawElapsed, 0.1); previous = now;
  if (director?.busy) { director.update(); return; }
  if (!paused && !document.hidden) { accumulator += elapsed * speed; while (accumulator >= 1 / 60) { sim.tick(1 / 60); accumulator -= 1 / 60; } }
  if (sim.time - lastSample >= 0.1) { lastSample = sim.time; history.push({ time: sim.time, ...sim.signals }); history = history.filter(s => sim.time - s.time <= 30); }
  habitat?.computerRoom?.updateDesk(elapsed, sim, !paused && !document.hidden);
  habitat?.update(sim, !paused); brain?.update(sim);
  if (now - lastUI > 150) { updateUI(); lastUI = now; }
  if (habitat) { const p = habitat.fly.group.position.clone(); p.y += 0.6; p.project(habitat.camera); const x = (p.x * 0.5 + 0.5) * $('#viewport').clientWidth, y = (-p.y * 0.5 + 0.5) * $('#viewport').clientHeight; const el = $('#fly-label'); el.style.left = `${x + 45}px`; el.style.top = `${y - 25}px`; el.style.visibility = sim.environment !== viewRoom || p.z > 1 || x < 0 || x > $('#viewport').clientWidth - 170 || y < 80 || y > $('#viewport').clientHeight - 80 ? 'hidden' : 'visible'; }
}
setPaused(paused); renderObjects();
document.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('active', +b.dataset.speed === speed));
updateUI(); saveWorld();
setInterval(saveWorld, 2000);
window.addEventListener('pagehide', saveWorld);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveWorld(); });
if (restored) toast('Welcome back. FlyGuy and his world are right where you left them.');
requestAnimationFrame(animate);

access=setupMembership({onChange:state=>queueMicrotask(()=>applyMembership(state)),onEnter:()=>{if(!allowed('interact')){sim.life.autonomous=true;setPaused(false);}}});
