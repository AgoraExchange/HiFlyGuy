import { FlyDialogue } from './dialogue.js';
import { ROOMS } from './life.js';

const KEY = 'flyguy-dialogue-v1';
export function setupDialogue({ getStorage, getHabitat }) {
  const voice = new FlyDialogue();
  document.querySelector('.playback').insertAdjacentHTML('afterend', `
    <section class="dialogue-panel" aria-labelledby="dialogue-title">
      <header><div><span class="eyebrow">OVERHEARD IN HIS LITTLE WORLD</span><h2 id="dialogue-title">FlyGuy, unfiltered.</h2></div><button id="download-dialogue" class="text-button">Save transcript</button></header>
      <p class="dialogue-intro">Little thoughts, big feelings, and the occasional word to you.</p>
      <div class="dialogue-options"><label><input type="checkbox" id="speech-enabled" checked> Speech bubbles</label><label><input type="checkbox" id="encounters-enabled" checked> Camera visits</label></div>
      <div id="dialogue-log" class="dialogue-log" role="log" aria-label="FlyGuy dialogue with timestamps" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
      <p id="dialogue-storage" class="dialogue-storage"></p>
    </section>`);
  const viewport = document.querySelector('#viewport');
  viewport.insertAdjacentHTML('beforeend', '<div id="fly-speech" class="fly-speech" hidden><span></span><p></p></div><button id="end-encounter" class="end-encounter" hidden>Back to his world <span aria-hidden="true">↗</span></button>');
  const bubble = document.querySelector('#fly-speech'), log = document.querySelector('#dialogue-log');
  const bubbles = document.querySelector('#speech-enabled'), encounters = document.querySelector('#encounters-enabled');
  const status = document.querySelector('#dialogue-storage'), skip = document.querySelector('#end-encounter');
  let entries = [], saved = true, wasFirstPerson = false, nextPresenceGreeting = 0;
  const clock = seconds => new Date(Math.max(0, seconds) * 1000).toISOString().slice(11, 19);
  function renderEntry(entry) {
    const row = document.createElement('article'); row.className = `dialogue-entry${entry.direct ? ' addressed' : ''}`;
    const meta = document.createElement('div'), time = document.createElement('time'), context = document.createElement('span'), text = document.createElement('p');
    time.dateTime = entry.at; time.textContent = new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    time.title = `${new Date(entry.at).toLocaleString()} · World ${clock(entry.worldTime)}`;
    context.textContent = `${entry.kind} / ${ROOMS[entry.room]?.name ?? entry.room} / ${entry.state}`;
    text.textContent = entry.text; meta.append(time, context); row.append(meta, text); return row;
  }
  function updateStatus() {
    status.textContent = `${entries.length} little ${entries.length === 1 ? 'moment' : 'moments'} · ${saved ? 'Saved in this browser' : 'Not saved — use Save transcript to keep a copy'}${entries.length > 200 ? ' · Latest 200 shown; transcript includes all' : ''}`;
    document.querySelector('#download-dialogue').disabled = !entries.length;
  }
  function persist() { try { getStorage().setItem(KEY, JSON.stringify({ entries, bubbles: bubbles.checked, encounters: encounters.checked })); saved = true; } catch { saved = false; } updateStatus(); }
  function cancel() { getHabitat()?.endEncounter(); voice.current = null; bubble.hidden = true; skip.hidden = true; viewport.classList.remove('fly-addressing'); }
  function load() {
    cancel(); voice.reset(); entries = []; saved = true; bubbles.checked = encounters.checked = true;
    try {
      const data = JSON.parse(getStorage().getItem(KEY) || 'null');
      if (data) {
        entries = (Array.isArray(data.entries) ? data.entries : []).filter(e => typeof e?.text === 'string' && e.text.length <= 1000 && Number.isFinite(e.worldTime) && Number.isFinite(Date.parse(e.at)));
        bubbles.checked = data.bubbles !== false; encounters.checked = data.encounters !== false;
      }
    } catch { saved = false; }
    log.replaceChildren(...entries.slice(-200).map(renderEntry));
    if (!entries.length) { const empty = document.createElement('p'); empty.className = 'dialogue-empty'; empty.textContent = 'A quiet moment. His next little thought will appear here.'; log.append(empty); }
    log.scrollTop = log.scrollHeight; updateStatus();
  }
  bubbles.onchange = () => { if (!bubbles.checked) cancel(); persist(); };
  encounters.onchange = () => { if (!encounters.checked) cancel(); persist(); };
  skip.disabled = true; skip.textContent = 'FlyGuy is talking to you…';
  // An ongoing touch or run must not dismiss the conversation or move the camera.
  for (const type of ['pointerdown', 'pointermove', 'click', 'dblclick', 'wheel']) {
    viewport.addEventListener(type, e => {
      if (!getHabitat()?.encounter) return;
      e.preventDefault(); e.stopImmediatePropagation();
    }, { capture: true, passive: false });
  }
  document.addEventListener('keydown', e => {
    if (getHabitat()?.encounter && ['Escape','Space','KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      e.preventDefault(); e.stopImmediatePropagation();
    }
  }, true);
  document.querySelector('#download-dialogue').onclick = () => {
    const text = entries.map(e => `[${new Date(e.at).toLocaleString()} | World ${clock(e.worldTime)} | ${ROOMS[e.room]?.name ?? e.room} | ${e.kind} | ${e.state}]\nFlyGuy: ${e.text}`).join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'flyguy-little-moments.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  load();
  return {
    load, cancel,
    reset() { cancel(); voice.reset(); },
    update(dt, sim, { running, viewRoom, blocked = false }) {
      const habitat = getHabitat();
      const firstPerson = !!habitat?.firstPerson?.active;
      if (firstPerson && !wasFirstPerson && voice.elapsed >= nextPresenceGreeting) {
        voice.nextViewer = Math.min(voice.nextViewer, voice.elapsed + 8);
        nextPresenceGreeting = voice.elapsed + 90;
      }
      wasFirstPerson = firstPerson;
      if (habitat?.encounter && (blocked || sim.environment !== viewRoom)) cancel();
      const safe = !blocked && habitat && (!habitat.firstPerson?.active || habitat.firstPerson.addressSpot()) && sim.environment === viewRoom && !sim.life.crossingUntil && !sim.life.route?.length && !sim.life.social?.onClock && !sim.training?.active && !['Sleeping', 'Panicking', 'Avoiding', 'Heading out', 'Crossing doorway'].includes(sim.state);
      const entry = voice.update(dt, sim, { running: running && !blocked, canAddress: safe && encounters.checked && bubbles.checked });
      if (entry) {
        const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 45;
        entries.push(entry); log.querySelector('.dialogue-empty')?.remove(); log.append(renderEntry(entry));
        while (log.children.length > 200) log.firstElementChild.remove();
        if (atBottom) log.scrollTop = log.scrollHeight;
        persist();
        if (entry.direct) habitat.startEncounter(entry.duration);
      }
      habitat?.advanceEncounter(running && !blocked ? dt : 0);
      const current = voice.current, direct = !!habitat?.encounter;
      viewport.classList.toggle('fly-addressing', direct); skip.hidden = !direct;
      bubble.hidden = !current || !bubbles.checked || blocked || sim.environment !== viewRoom || current.direct && (!direct || habitat.encounter.elapsed < 2.5);
      if (!bubble.hidden) {
        bubble.classList.toggle('to-viewer', current.direct);
        bubble.querySelector('span').textContent = current.direct ? 'FLYGUY / TO YOU' : 'FLYGUY / THINKING ALOUD';
        bubble.querySelector('p').textContent = current.text;
      }
    },
    position() {
      const habitat = getHabitat(); if (bubble.hidden || !habitat) return;
      if (bubble.classList.contains('to-viewer')) { bubble.style.left = '50%'; bubble.style.top = 'auto'; return; }
      const p = habitat.fly.group.position.clone(); p.y += 1.25; p.project(habitat.camera);
      const width = viewport.clientWidth, height = viewport.clientHeight;
      if (p.z > 1 || p.z < -1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) { bubble.hidden = true; return; }
      const half = bubble.offsetWidth / 2 + 12;
      bubble.style.left = `${Math.max(half, Math.min(width - half, (p.x * .5 + .5) * width))}px`;
      bubble.style.top = `${Math.max(90, Math.min(height - bubble.offsetHeight - 90, (-p.y * .5 + .5) * height - bubble.offsetHeight - 12))}px`;
    },
  };
}
