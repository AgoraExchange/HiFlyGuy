import { PERCHES, cueChance, flipUnlocked } from './training.js';
import './training.css';
export const playgroundControls = `<div id="playground-controls" hidden><button id="training-toggle" aria-expanded="true" aria-controls="training-dock">Training & bond <span id="bond-mini">12%</span></button><span class="playground-kicker">A LITTLE TRUST. A LITTLE MAGIC.</span></div>
<section id="training-dock" class="training-dock" aria-label="Playground training" hidden>
<div class="training-heading"><span>YOUR LITTLE COMPANION</span><span id="bond-stage">Getting acquainted</span></div>
<div class="lesson-buttons personal-cues"><button data-lesson="call" data-guided="true" data-destination="you">Practice with me</button><button data-lesson="call" data-guided="false" data-destination="you">Come to me</button></div>
<label for="perch-select">Call him to</label><select id="perch-select" aria-label="Training landing pad"><option value="you">Me (YOU marker)</option>${PERCHES.map((p, i) => `<option value="${i}">${p.name}</option>`).join('')}</select>
<div class="lesson-buttons"><button data-lesson="call" data-guided="true">Practice call</button><button data-lesson="call" data-guided="false">Call FlyGuy</button><button data-lesson="flip" data-guided="true">Practice flip</button><button data-lesson="flip" data-guided="false">Backflip!</button></div>
<button id="reward-btn" class="reward-button" disabled>Give a treat <span id="reward-countdown"></span></button>
<p id="lesson-message" aria-live="polite">Start with Practice call. Reward him when he lands.</p>
<div class="lesson-foot"><span id="lesson-pause">Practice → complete → reward</span><button id="end-lesson">End lesson</button></div>
</section>`;
export const trainingPanel = `<section class="training-panel"><div class="panel-heading"><h2>Learning with you</h2><span class="pill" id="training-stage">New friends</span></div><p>Care builds familiarity. Rewarded practice builds skills.</p><div class="skill-row"><span>Recall <b id="call-skill">8%</b></span><div class="skill-meter"><i id="call-progress"></i></div><small id="call-chance"></small></div><div class="skill-row"><span>Backflip <b id="flip-skill">0%</b></span><div class="skill-meter"><i id="flip-progress"></i></div><small id="flip-unlock">Build bond and recall to unlock.</small></div><div class="training-history-title">RECENT PRACTICE</div><div id="training-history"><p>His first little lesson is waiting in the Playground.</p></div><small class="training-model-note">Virtual-pet learning · progress saved in this browser.</small></section>`;
export function setupTrainingUI(sim, save, toast, cancelPlacement, authorize=()=>true) {
  document.querySelector('.vitals-panel').insertAdjacentHTML('afterend', trainingPanel);
  document.querySelector('#vitals-note').insertAdjacentHTML('beforebegin', '<div class="vital"><span>Bond</span><div class="meter bond"><div id="bond-meter"></div></div><strong id="bond-value">12%</strong></div>');
  document.querySelector('#training-toggle').onclick = e => { if(!authorize())return; const button = e.currentTarget, open = button.getAttribute('aria-expanded') !== 'true'; button.setAttribute('aria-expanded', String(open)); document.querySelector('#training-dock').hidden = !open; };
  document.querySelector('#perch-select').onchange = e => { if(!authorize())return; sim.training.selected = e.target.value === 'you' ? 'you' : +e.target.value; save(); };
  document.querySelectorAll('[data-lesson]').forEach(button => button.onclick = () => { if(!authorize())return;
    if (document.body.classList.contains('paused')) return toast('Resume the simulation to start a lesson.');
    cancelPlacement(); if (button.dataset.destination === 'you') sim.training.selected = 'you'; sim.requestLesson(button.dataset.lesson, button.dataset.guided === 'true'); save();
  });
  document.querySelector('#reward-btn').onclick = () => { if(!authorize())return; if (!document.body.classList.contains('paused') && sim.rewardLesson()) { toast('A tiny treat. A little more trust.'); save(); } };
  document.querySelector('#end-lesson').onclick = () => { if(!authorize())return; sim.cancelLesson(); save(); };
}
export function updateTrainingUI(sim, paused) {
  const $ = s => document.querySelector(s), t = sim.training, percent = n => `${Math.round(n * 100)}%`;
  $('#bond-value').textContent = $('#bond-mini').textContent = percent(t.bond); $('#bond-meter').style.width = percent(t.bond);
  const stage = t.bond < .25 ? 'Getting acquainted' : t.bond < .55 ? 'Growing trust' : t.bond < .8 ? 'Familiar friend' : 'Little companion';
  $('#bond-stage').textContent = $('#training-stage').textContent = stage;
  for (const kind of ['call', 'flip']) { $(`#${kind}-skill`).textContent = percent(t[kind]); $(`#${kind}-progress`).style.width = percent(t[kind]); }
  $('#call-chance').textContent = `${Math.round(cueChance(sim, 'call') * 100)}% cue response · faster with practice`;
  $('#flip-unlock').textContent = !flipUnlocked(sim) ? 'Unlock: 25% bond + 30% recall.' : t.flip < .55 ? 'Practice tumbles. Full flip at 55% skill.' : 'Backflip learned. Try the cue!';
  $('#perch-select').value = String(t.selected);
  $('#lesson-message').textContent = t.message; $('#lesson-pause').textContent = paused ? 'Paused — lessons wait with you' : 'Practice → complete → reward';
  const busy = !!t.active || !!t.pending || sim.time < t.cooldownUntil;
  document.querySelectorAll('[data-lesson]').forEach(b => { b.disabled = paused || busy || b.dataset.lesson === 'flip' && (!flipUnlocked(sim) || b.dataset.guided === 'false' && t.flip < .55); });
  $('#reward-btn').disabled = paused || !t.pending || t.pending.until < sim.time || sim.distress > .15 || sim.startle > 0;
  $('#reward-countdown').textContent = t.pending ? `${Math.max(0, Math.ceil(t.pending.until - sim.time))}s` : '';
  $('#end-lesson').disabled = !t.active && !t.pending;
  const signature = t.trials.slice(0, 5).map(r => `${r.id}:${r.outcome}`).join('|');
  if ($('#training-history').dataset.signature !== signature) {
    $('#training-history').dataset.signature = signature;
    $('#training-history').replaceChildren();
    if (!t.trials.length) { const p = document.createElement('p'); p.textContent = 'His first little lesson is waiting in the Playground.'; $('#training-history').append(p); }
    for (const r of t.trials.slice(0, 5)) { const row = document.createElement('div'); row.className = `trial-row ${r.outcome}`; const name = document.createElement('span'), result = document.createElement('span'); name.textContent = `${r.kind === 'call' ? r.destination === 'you' ? 'Come to me' : 'Recall' : 'Flip'} · ${r.guided ? 'practice' : 'cue'}`; result.textContent = `${r.outcome}${r.latency === null ? '' : ` · ${r.latency.toFixed(1)}s`}`; row.append(name, result); $('#training-history').append(row); }
  }
}
