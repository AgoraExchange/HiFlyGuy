import { NEW_ITEMS, RADIO_STATIONS } from './world-items.js';
import './hotbar.css';

const drawings={
 water:'<ellipse cx="32" cy="38" rx="22" ry="10"/><path d="M10 37v8c0 13 44 13 44 0v-8M32 9c-10 13-8 20 0 20s10-7 0-20Z"/>',
 sugar:'<path d="m12 22 20-11 20 11v24L32 57 12 46Zm0 0 20 11 20-11M32 33v24"/><path d="m20 37 2 1m19 4 2-1m-12-20 2 1"/>',
 mirror:'<rect x="16" y="7" width="32" height="43" rx="12"/><path d="m25 34 14-16m-8 22 9-10M32 50v7M19 58h26"/>',
 radio:'<rect x="7" y="24" width="50" height="31" rx="5"/><path d="m42 24 8-17M14 32h22m-22 7h22m-22 7h22m8-13h6"/><circle cx="47" cy="45" r="4"/>',
 box:'<path d="m10 27 22 10 22-10v25L32 61 10 52ZM10 27 3 16l22-9 7 12 7-12 22 9-7 11M32 37v24M10 27l22-8 22 8"/>',
 note:'<path d="M13 7h29l10 11v39H13ZM42 7v12h10M21 29h22m-22 9h22m-22 9h13"/>',
 hoop:'<path d="M9 7h46v25H9ZM24 19h16v12M32 46v13m-12 0h24M20 35l5 12h14l5-12"/><ellipse cx="32" cy="33" rx="14" ry="4"/>',
 lamp:'<path d="M23 8h18l13 25H10Zm9 25v22M20 57h24M9 43l5-3m41 3-5-3M32 4V1"/>',
 airplane:'<path d="M4 24 60 7 41 57 29 37Zm25 13L60 7M29 37l-4 16 10-9"/>',
 couch:'<path d="M12 30V17c0-5 40-5 40 0v13M12 43h40M8 28h9v13h30V28h9v25H8Zm7 25v6m34-6v6"/>',
};
export const itemIcon=kind=>`<svg viewBox="0 0 64 64" fill="none" stroke="${NEW_ITEMS[kind]?.color??'currentColor'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[kind]??''}</svg>`;
const category=kind=>NEW_ITEMS[kind]?.category??(kind==='peppermint'?'Tools':'Care');
export function hotbarHTML(stimuli,art,swatterArt){
  return `<div id="world-hotbar"><div class="hotbar-categories" role="group" aria-label="Object categories">${['Care','Play','Cozy','Tools'].map(c=>`<button data-category="${c}" aria-pressed="${c==='Care'}">${c}</button>`).join('')}</div>
  <div class="stimulus-cards hotbar-slots">${Object.entries(stimuli).map(([kind,o])=>`<button class="stimulus-card hotbar-slot" data-category-item="${category(kind)}" data-stimulus="${kind}" aria-label="Place ${o.name.toLowerCase()}" aria-pressed="false" ${category(kind)!=='Care'?'hidden':''}><div class="food-art">${art(kind)}</div><strong>${o.name}</strong></button>`).join('')}<button class="hotbar-slot" data-category-item="Tools" data-tool="swatter" aria-label="Use fly swatter" aria-pressed="false" hidden><div class="food-art">${swatterArt}</div><strong>Fly Swatter</strong></button></div>
  <p id="hotbar-detail" class="hotbar-detail" aria-live="polite">A snack, a new hobby, or a little comfort. Choose an object, then place it in his world.</p>
  <label id="note-options" class="item-options" hidden>Your note <input id="gift-note" maxlength="120" value="Glad you are here, little guy." placeholder="Leave him a few words…"></label>
  <label id="radio-options" class="item-options" hidden>Station <select id="gift-station">${RADIO_STATIONS.map(s=>`<option>${s}</option>`).join('')}</select><small>FlyGuy reacts to the station; radio audio is off.</small></label></div>
  <p id="belonging-memory" class="belonging-memory" aria-live="polite"></p>`;
}
export function setupHotbar(stimuli,{sim,save}){
  const $=s=>document.querySelector(s),bar=$('#world-hotbar'),anchor=document.createComment('world hotbar home');bar.before(anchor);
  const dialog=document.createElement('dialog');dialog.id='object-catalog-dialog';dialog.setAttribute('aria-labelledby','object-catalog-title');
  dialog.innerHTML='<div class="catalog-heading"><h2 id="object-catalog-title">Something for his world</h2><button id="catalog-close" aria-label="Close object catalog">×</button></div><div id="catalog-content"></div><button id="catalog-done" class="primary-btn">Back to the world</button>';
  document.body.append(dialog);
  const close=()=>dialog.close();$('#catalog-close').onclick=close;$('#catalog-done').onclick=close;
  dialog.addEventListener('close',()=>anchor.after(bar));
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  bar.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{
    bar.querySelectorAll('[data-category]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));
    bar.querySelectorAll('[data-category-item]').forEach(c=>c.hidden=c.dataset.categoryItem!==b.dataset.category);
  });
  let editing=null;
  const options=()=>({text:$('#gift-note').value,station:$('#gift-station').value});
  const details=(kind)=>{
    bar.querySelector(`[data-category="${category(kind)}"]`)?.click();
    $('#note-options').hidden=kind!=='note';$('#radio-options').hidden=kind!=='radio';
    $('#hotbar-detail').textContent=stimuli[kind]?.description??'Choose an object, then place it in his world.';
    $('#catalog-done').textContent=kind?'Place in the world':'Back to the world';
  };
  const editSave=()=>{const o=sim.objects.find(o=>o.id===editing);if(!o)return;if(o.kind==='note')o.text=$('#gift-note').value.trim()||'Glad you are here, little guy.';if(o.kind==='radio')o.station=$('#gift-station').value;save();};
  $('#gift-note').addEventListener('change',editSave);$('#gift-station').addEventListener('change',editSave);
  return {
    options,
    select(kind){editing=null;details(kind);},
    open(){(document.fullscreenElement??document.body).append(dialog);$('#catalog-content').append(bar);dialog.showModal();},
    inspect(id){const o=sim.objects.find(o=>o.id===id);if(!o)return;editing=id;details(o.kind);if(o.kind==='note')$('#gift-note').value=o.text;if(o.kind==='radio')$('#gift-station').value=o.station;const m=sim.belongings.memories.find(m=>m.id===id),b=sim.belongings,station=b.stationPlays.indexOf(Math.max(...b.stationPlays));const extra=o.kind==='hoop'?` Practice: ${Math.round(b.basketSkill*100)}%.`:o.kind==='radio'&&b.stationPlays[station]>0?` Most listened to: ${RADIO_STATIONS[station]}.`:'';$('#hotbar-detail').textContent=`${stimuli[o.kind].name} · You left this here · ${m?.visits??0} visits${m?.visits>=3?' · A familiar favorite':''}. ${stimuli[o.kind].description}${extra}`;this.open();$('#catalog-done').textContent='Done';},
    update(){const favorites=[...sim.belongings.memories].filter(m=>m.visits>=1).sort((a,b)=>b.seconds-a.seconds).slice(0,3);$('#belonging-memory').textContent=favorites.length?'His familiar things: '+favorites.map(m=>`${stimuli[m.kind].name} (${m.visits} ${m.visits===1?'visit':'visits'}${sim.objects.some(o=>o.id===m.id)?'':', remembered'})`).join(' · '):'';},
  };
}
