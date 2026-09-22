import { DirectorStage } from './director-stage.js';
import { OpponentStage } from './director-opponent-stage.js';
import { TeslaStage } from './director-tesla-stage.js';
import { teslaTiming } from './director-tesla-timeline.js';
import { LabStage } from './director-lab-stage.js';
import { ComebackStage } from './director-comeback-stage.js';
import { COMEBACK_DURATION } from './director-comeback-timeline.js';
import { LAB_DURATION } from './director-lab-timeline.js';
import { LEAD_IN, TAKE_DURATION } from './director-timeline.js';
import './director.css';

export function setupDirector({ viewport, prepare, authorize=()=>true, allowed=()=>true }) {
  const toggle=document.querySelector('#director-btn'),actions=document.querySelector('#director-actions-btn');
  const panel=document.createElement('dialog');panel.id='director-actions';panel.setAttribute('aria-labelledby','director-title');
  panel.innerHTML=`<div class="director-panel-head"><span>DIRECTORS MODE / ACTIONS</span><button id="director-close" aria-label="Close actions">&times;</button></div><h2 id="director-title">Give him a scene.</h2><p>One action. Every camera move. Ready for your edit.</p><button id="maybach-action" class="director-action"><span class="director-action-art" aria-hidden="true">28<span>PH</span></span><span><strong>MMM MAYBACH MUSIC</strong><small>Elevator &rarr; apartment &rarr; Aster Wallet &rarr; chair lean</small><em>2 SEC LEAD-IN &nbsp; / &nbsp; 22 SEC TAKE</em></span><b aria-hidden="true">&#8599;</b></button><button id="lab-action" class="director-action director-action-lab"><span class="director-action-art" aria-hidden="true">04<span>LAB</span></span><span><strong>PROFIT IS MANDATORY</strong><small>Losing trade &rarr; isolation &rarr; interrogation &rarr; electric correction</small><em>2 SEC LEAD-IN &nbsp; / &nbsp; 24 SEC TAKE</em></span><b aria-hidden="true">&#8599;</b></button><button id="comeback-action" class="director-action director-action-comeback"><span class="director-action-art" aria-hidden="true">06<span>FEET</span></span><span><strong>SIX FEET. THREE PAIRS.</strong><small>Lab comeback &rarr; profit &rarr; elevator fit &rarr; six sandals &rarr; feet on desk</small><em>2 SEC LEAD-IN &nbsp; / &nbsp; 18 SEC TAKE</em></span><b aria-hidden="true">&#8599;</b></button><button id="tesla-action" class="director-action director-action-tesla"><span class="director-action-art" aria-hidden="true">03<span>AM</span></span><span><strong>NIGHT SHIFT / TESLA</strong><small>Fly girls &rarr; scooter &rarr; laptop trades &rarr; profit &rarr; smoke &rarr; drop montage</small><em>2 SEC LEAD-IN &nbsp; / &nbsp; <span id="tesla-duration">25.1</span> SEC TAKE</em></span><b aria-hidden="true">&#8599;</b></button><div class="tesla-timing"><label>Drop after <span><input id="tesla-drop" type="number" min="8" max="40" step="0.1" value="12" /> sec</span></label><label>Montage tempo <span><input id="tesla-bpm" type="number" min="70" max="160" step="1" value="110" /> BPM</span></label><p>Start your song near 0:06. Drop near 0:18. Adjust to match your Instagram excerpt. Trading screens are a staged paper-trading session.</p></div><button id="opponent-action" class="director-action director-action-opponent"><span class="director-action-art" aria-hidden="true">02<span>SELF</span></span><span><strong>THE OPPONENT</strong><small>A reflection moves alone &rarr; the other Fly &rarr; red / green match cuts &rarr; become him</small><em>2 SEC LEAD-IN &nbsp; / &nbsp; 14 SEC TAKE</em></span><b aria-hidden="true">&#8599;</b></button><p class="opponent-audio">For Your next opponent is you (Super Slowed) by Eclipse. Add your Instagram excerpt from 0:06 to 0:20 after recording.</p><p class="director-instructions">Start your screen recording first. Controls disappear, then the scene starts after two seconds. Double-tap the scene or press Escape to stop.</p><p class="director-audio">Silent takes &middot; Night Shift: tesla (slowed electro mix) by Fixupboy. Comeback: LV Sandals by EsDeeKid, fakemink &amp; Rico Ace. Lab: Locrian Dominant by Aloboi. Add your sound in your editor.</p><p id="director-error" role="status" hidden></p>`;
  const cinema=document.createElement('div');cinema.id='director-cinema';cinema.hidden=true;
  cinema.innerHTML=`<div id="director-frame" tabindex="-1"></div><button id="director-stop" class="director-stop">Stop take</button><div id="director-finish" hidden><span>THAT'S A TAKE</span><h2 id="director-finish-title">Ready for the edit.</h2><p>Your world is waiting right where you left it.</p><div><button id="director-replay">Replay take</button><button id="director-return">Back to world</button></div></div>`;
  viewport.append(panel,cinema);
  const $=s=>document.querySelector(s),frame=$('#director-frame'),finish=$('#director-finish');
  let selected='maybach',stageKind=null;
  let stage=null,enabled=false,state='idle',elapsed=0,startedAt=0,lastTap=-Infinity,enteredFullscreen=false;
  function ensureStage(){
    if(stage && stageKind!==selected){stage.dispose();stage=null;}
    if(!stage){stage=selected==='opponent'?new OpponentStage(frame):selected==='tesla'?new TeslaStage(frame):selected==='comeback'?new ComebackStage(frame):selected==='lab'?new LabStage(frame):new DirectorStage(frame);stageKind=selected;}
    return stage;
  }
  function ready(){try{ensureStage();$('#director-error').hidden=true;return true;}catch(error){console.error(error);$('#director-error').textContent='The filming scene could not load. Check that hardware acceleration is enabled, then try again.';$('#director-error').hidden=false;return false;}}
  function close(){
    if(cinema.hidden)return;
    state='idle';cinema.hidden=true;finish.hidden=true;document.body.classList.remove('director-recording');
    if(document.fullscreenElement===cinema)void document.exitFullscreen().catch(()=>{});
    enteredFullscreen=false;actions.focus();
  }
  function complete(interrupted=false){
    state='complete';cinema.dataset.state=state;finish.hidden=false;
    $('#director-finish-title').textContent=interrupted?'Take stopped. Try another?':'Ready for the edit.';
    $('#director-replay').focus({preventScroll:true});
  }
  function start(){
    if(!authorize())return;
    if(!ready())return;
    if(selected==='tesla')stage.configure(teslaSettings());
    prepare();panel.close();cinema.hidden=false;finish.hidden=true;document.body.classList.add('director-recording');
    state='lead-in';elapsed=0;lastTap=-Infinity;cinema.dataset.state=state;stage.resize();stage.render(0);startedAt=performance.now();frame.focus({preventScroll:true});
    if(cinema.requestFullscreen&&document.fullscreenElement!==cinema)void cinema.requestFullscreen().then(()=>{if(!cinema.hidden)enteredFullscreen=true;else if(document.fullscreenElement===cinema)void document.exitFullscreen();}).catch(()=>{});
  }
  toggle.onclick=()=>{
    if(!authorize())return;
    enabled=!enabled;toggle.setAttribute('aria-pressed',String(enabled));toggle.classList.toggle('active',enabled);actions.hidden=!enabled;
    if(enabled){ready();}else{panel.close();close();stage?.dispose();stage=null;}
  };
  actions.onclick=()=>{if(!authorize())return;panel.showModal();ready();$('#maybach-action').focus();};
  $('#director-close').onclick=()=>panel.close();
  $('#maybach-action').onclick=()=>{selected='maybach';start();};
  $('#lab-action').onclick=()=>{selected='lab';start();};
  $('#comeback-action').onclick=()=>{selected='comeback';start();};
  document.querySelector('#opponent-action').onclick=()=>{selected='opponent';start();};
  const teslaSettings=()=>({drop:parseFloat($('#tesla-drop').value),bpm:parseFloat($('#tesla-bpm').value)});
  for(const id of ['#tesla-drop','#tesla-bpm'])$(id).addEventListener('input',()=>{$('#tesla-duration').textContent=teslaTiming(teslaSettings()).duration.toFixed(1);});
  $('#tesla-action').onclick=()=>{selected='tesla';start();};
  $('#director-replay').onclick=start;$('#director-return').onclick=close;$('#director-stop').onclick=()=>complete(true);
  cinema.addEventListener('pointerup',e=>{
    if(state==='complete'||e.target.closest('button'))return;
    const now=performance.now();if(now-lastTap<350){complete(true);lastTap=-Infinity;}else lastTap=now;
  });
  document.addEventListener('keydown',e=>{
    if(cinema.hidden)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(state==='complete')close();else complete(true);}
    else if(e.key==='Tab'&&state!=='complete'){e.preventDefault();$('#director-stop').focus();}
    else if([' ','1','2','3','4','Delete'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  document.addEventListener('fullscreenchange',()=>{if(enteredFullscreen&&document.fullscreenElement!==cinema){enteredFullscreen=false;if(!cinema.hidden&&state!=='complete')complete(true);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&!cinema.hidden&&state!=='complete')complete(true);});
  return {
    get busy(){return !cinema.hidden;},
    update(){
      if(!allowed()){panel.close();close();return;}
      if(cinema.hidden||state==='complete'||document.hidden)return;
      elapsed=Math.max(0,(performance.now()-startedAt)/1000);
      state=elapsed<LEAD_IN?'lead-in':'playing';cinema.dataset.state=state;
      stage.render(Math.max(0,elapsed-LEAD_IN));
      if(elapsed>=LEAD_IN+(stage.duration??(selected==='comeback'?COMEBACK_DURATION:selected==='lab'?LAB_DURATION:TAKE_DURATION)))complete();
    },
  };
}
