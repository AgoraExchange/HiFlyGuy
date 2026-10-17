import * as T from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';

export const CITY_FOUNDATION = 148;
export const OUTER_BUILDINGS = Array.from({ length: 28 }, (_, i) => {
  const a = i / 28 * Math.PI * 2, x = Math.sin(a) * 64, z = Math.cos(a) * 58;
  return { x, z, width: 4 + i % 3, depth: 5, height: z > 10 ? 3 + i % 4 : 9 + i * 7 % 23 };
});
export const STATIONS = [[0, -3], [-6, 0], [6, 0]];
export function domainDeal(time, desk = 0) {
  const elapsed = Math.max(0, time) + desk * 4, cycle = Math.floor(elapsed / 30), phase = Math.floor(elapsed % 30 / 6);
  const names = ['wingcart.example', 'nectarcloud.example', 'buzzworks.example', 'orbitnest.example'];
  const cost = 120 + desk * 35, sale = 360 + desk * 65;
  return { name: names[(cycle + desk) % names.length], phase, status: ['Searching availability', 'Securing domain', 'Purchasing', 'Purchased - listing for resale', 'Resold'][phase], cost, sale, profit: sale - cost, closed: cycle + (phase === 4 ? 1 : 0) };
}
export function domainProfit(time) { return STATIONS.reduce((sum, _, i) => { const d = domainDeal(time, i); return sum + d.closed * d.profit; }, 0); }
const material = color => new T.MeshStandardMaterial({ color, roughness: .4, metalness: .65 });
const cube = new T.BoxGeometry(1, 1, 1);
function box(parent, size, position, mat) { const m = new T.Mesh(cube, mat); m.scale.set(...size); m.position.set(...position); parent.add(m); return m; }
function display(parent, width, height, position, w = 1000, h = 600) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const map = new T.CanvasTexture(canvas); map.colorSpace = T.SRGBColorSpace;
  const screen = new T.Mesh(new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({ map, toneMapped: false }));
  screen.position.set(...position); parent.add(screen); return screen;
}
const text = (c, value, x, y, size = 24, color = '#dce7f5') => { c.fillStyle = color; c.font = `${size}px Consolas, monospace`; c.fillText(value, x, y); };
function header(c, title, url) {
  c.fillStyle = '#0b101b'; c.fillRect(0, 0, 1000, 600);
  c.fillStyle = '#222c40'; c.fillRect(0, 0, 1000, 56);
  text(c, title, 25, 36, 22); text(c, 'https://' + url, 30, 92, 21, '#9cbbd4');
  c.fillStyle = '#172136'; c.fillRect(20, 109, 960, 2);
}
export class CityWorkstations {
  constructor(city) {
    this.city = city; this.group = new T.Group(); city.office.add(this.group);
    this.screens = []; this.lastFrame = -1; this.frames = []; this.mode = null;
    const alloy = material('#8a94a6'), dark = material('#111820'), key = material('#29333e');
    STATIONS.forEach(([x, z], i) => {
      box(this.group, [3.5, .12, 1.6], [x, 1.3, z - 1.55], alloy);
      box(this.group, [3.5, 2.16, .12], [x, 2.42, z - 2.35], dark);
      box(this.group, [3.3, .07, .12], [x, 1.4, z - 2.25], alloy);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 12; col++) box(this.group, [.21, .035, .15], [x - 1.38 + col * .25, 1.385, z - 1.2 - row * .22], key);
      box(this.group, [.8, .015, .25], [x, 1.37, z - .95], key);
      box(this.group, [.05, .05, .015], [x, 3.43, z - 2.28], alloy);
      const screen = display(this.group, 3.3, 1.98, [x, 2.42, z - 2.275]); screen.userData.desk = i; this.screens.push(screen);
      const mug = new T.Mesh(new T.CylinderGeometry(.16, .14, .32, 16), material('#849499')); mug.position.set(x + 2, 1.4, z - 1.25); this.group.add(mug);
      const lamp = new T.PointLight('#a2d4ff', 5, 5, 2); lamp.position.set(x, 2.8, z - 1.4); this.group.add(lamp);
    });
    box(this.group, [7.8, 2.9, .2], [3.6, 5.6, -8.1], dark);
    this.ledger = display(this.group, 7.5, 2.65, [3.6, 5.6, -7.98]);
    this.rack = new T.Group(); city.office.add(this.rack); this.phones = [];
    for (const x of [-9, -3]) box(this.rack, [.12, 5.1, .4], [x, 2.55, -6.8], alloy);
    for (let row = 0; row < 4; row++) {
      box(this.rack, [6.1, .1, .65], [-6, .35 + row * 1.2, -6.8], alloy);
      for (let col = 0; col < 5; col++) {
        const x = -8.4 + col * 1.2, y = 1 + row * 1.2;
        box(this.rack, [.62, 1.05, .08], [x, y, -6.6], dark);
        const phone = display(this.rack, .54, .92, [x, y, -6.55], 216, 368); this.phones.push(phone);
        box(this.rack, [.18, .035, .02], [x, y + .4, -6.52], dark);
        const points = [[x,y-.52,-6.6],[x,.15,-6.9],[-3,.15,-6.9]].map(p=>new T.Vector3(...p));
        this.rack.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#536876'})));
      }
    }
    box(this.rack, [1.7, .3, .8], [-3, .18, -6.9], dark);
    this.rack.visible = false;
    this.hole = new T.MeshBasicMaterial({ color: 0, opacity: 0, blending: T.NoBlending, side: T.FrontSide });
    this.canvasMaterials = this.screens.map(s => s.material);

  }
  ensureMarkets() {
    if (this.css) return;
    this.cssScene = new T.Scene(); this.css = new CSS3DRenderer(); this.css.domElement.className = 'computer-display-layer city-market-layer';
    this.city.habitat.container.prepend(this.css.domElement);
    this.screens.forEach((screen, i) => {
      const el = document.createElement('div'); el.style.cssText = 'width:1000px;height:600px;background:#0b101b;backface-visibility:hidden;pointer-events:none';
      const frame = document.createElement('iframe'); frame.title = `Wing Street workstation ${i + 1} - TradingView`; frame.style.cssText = 'width:100%;height:100%;border:0;pointer-events:none'; frame.tabIndex = -1;
      frame.src = `${import.meta.env.BASE_URL}market.html?cityDesk=${i}`; el.append(frame);
      frame.addEventListener('load', () => { frame.contentWindow?.postMessage({ type: 'market-mode', expanded: false }, location.origin); this.lastMarketStep = -1; });
      const surface = new CSS3DObject(el); surface.position.copy(screen.position); surface.scale.setScalar(.0033); this.cssScene.add(surface); this.frames.push(frame);
    });
  }
  setMode(id) {
    this.mode = id; this.rack.visible = id === 'cargo'; this.lastFrame = -1;
    if (id === 'power') { this.ensureMarkets(); this.lastMarketStep = -1; }
    this.screens.forEach((s, i) => s.material = id === 'power' ? this.hole : this.canvasMaterials[i]);
    if (this.css) this.css.domElement.hidden = id !== 'power';
    if (id !== 'power') this.frames.forEach(f => f.contentWindow?.postMessage({ type: 'desk-active', active: false }, location.origin));
  }
  hide() { this.lastMarketStep = -1; if (this.css) this.css.domElement.hidden = true; this.frames.forEach(f => f.contentWindow?.postMessage({ type: 'desk-active', active: false }, location.origin)); }
  focus(index = 0) {
    const h = this.city.habitat, [x,z] = STATIONS[index];
    h.follow = false; h.homeFraming = false; h.controls.enableDamping = false; h.controls.update();
    h.controls.target.set(x, 2.2, z - 1.8); h.camera.position.set(x + 2.4, 3.5, z + (h.camera.aspect < 1 ? 8 : 5.7));
    h.controls.update(); h.controls.enableDamping = true;
    this.city.panel.classList.add('collapsed'); this.city.panel.querySelector('[data-city-toggle]').setAttribute('aria-expanded','false'); this.city.panel.querySelector('[data-city-toggle]').textContent = '+';
  }
  update(time, running) {
    if (!this.mode) return;
    if (this.mode === 'power') {
      const h = this.city.habitat; this.css.domElement.hidden = false;
      this.css.setSize(h.container.clientWidth,h.container.clientHeight); this.css.render(this.cssScene,h.camera);
      const step = Math.floor(time / 8);
      if (this.lastMarketStep !== step || this.lastRunning !== running) {
        this.frames.forEach((frame, i) => {
          const send = data => frame.contentWindow?.postMessage(data, location.origin);
          send({type:'desk-active',active:running}); send({type:'flyguy-telemetry',state:'Locked in',energy:1,time,signals:{scent:.8,aversion:0,reward:.7,motor:.9}});
          if (running && step !== this.lastMarketStep) { send({type:'desk-action',step:step + i * 3,click:false}); send({type:'desk-action',step:step + i * 3,click:true}); }
        }); this.lastMarketStep = step; this.lastRunning = running;
      }
    }
    const tick = Math.floor(time * 6); if (tick === this.lastFrame) return; this.lastFrame = tick;
    this.screens.forEach((screen, i) => {
      const map = this.canvasMaterials[i].map, c = map.image.getContext('2d');
      if (this.mode === 'food') {
        const d = domainDeal(time, i); header(c, 'DOMAIN DYNASTY / ACQUISITIONS', 'registry.example' + ['/search?q=', '/reserve/', '/checkout/', '/portfolio/', '/sales/'][d.phase] + d.name);
        text(c,d.name,40,180,40,'#a4f5c4'); text(c,d.status.toUpperCase(),40,245,26);
        text(c,'Acquisition: $'+d.cost+'     Asking: $'+d.sale,40,300);
        c.fillStyle='#26374b';c.fillRect(40,345,900,15);c.fillStyle='#89e4bd';c.fillRect(40,345,900*((time+i*4)%30)/30,15);
        text(c,d.phase===4?'SALE SETTLED / PROFIT +$'+d.profit:d.phase===3?'Ownership confirmed. Buyer offers open.':'Checking registry and preparing the deal...',40,430,23,'#a4f5c4');
        text(c,'SIMULATED DEALS / '+d.closed+' completed',40,555,18,'#8095ad');
      } else if (this.mode === 'lab') {
        header(c,'BLACKWING / WORKSPACE '+(i+1),'editor.local/colony/'+['market-feed.ts','domain-checkout.ts','phone-console.ts'][i]);
        const lines = ['import { colony } from "./network";', '', 'export async function runTask(job) {', '  const client = await colony.connect();', '  const result = await client.process(job);', '  await client.verify(result);', '  return { status: "ready", result };', '}', '', '// build pipeline: lint > test > deploy', 'await runTask(queue.next());'];
        const cursor=Math.floor(time*6+i*8)%lines.join('').length;let offset=0;
        lines.forEach((line,row)=>{text(c,String(row+1).padStart(2,'0'),20,150+row*29,19,'#65758c');const shown=line.slice(0,Math.max(0,cursor-offset));text(c,shown,75,150+row*29,21,row%3===0?'#bd9dff':'#9ed8d0');offset+=line.length;});
        c.fillStyle='#172a26';c.fillRect(0,490,1000,110);text(c,'> build --watch    '+(Math.floor(time)%8<5?'Compiling modules...':'Build passed. Deploy ready.'),25,530,22,'#a9f5b1');text(c,'TERMINAL / '+Math.floor(time*7)+' operations',25,570,18,'#8fa2b9');
      } else if (this.mode === 'cargo') {
        header(c,'BUZZLINE / DEVICE CONTROL','studio.local/devices');
        text(c,'20 PHONES ONLINE   /   200 SIMULATED PROFILES',25,145,24,'#a7f1d4');
        for(let n=0;n<20;n++){const x=25+n%5*194,y=175+Math.floor(n/5)*83;const account=Math.floor(time/6+n)%10+1;c.fillStyle=n===Math.floor(time)%20?'#295a68':'#1c2a40';c.fillRect(x,y,182,70);text(c,'PHONE '+String(n+1).padStart(2,'0'),x+8,y+24,18);text(c,'PROFILE '+account+' / '+['SCROLL','PREVIEW','SYNC'][Math.floor(time/3)%3],x+8,y+51,14,'#98cbbd');}
        text(c,'SYNC ALL / previewing feeds across the rack',25,550,22,'#ffcd9a');text(c,'FICTIONAL STUDIO / NO CONNECTED ACCOUNTS',25,582,16,'#8195ad');
      } else { header(c,'APEX / EXECUTIVE DESK','holdings.local/portfolio');text(c,'FLY GUY HOLDINGS',40,180,42,'#e3ff9c');['Wing Street / markets online','Domain Dynasty / profit $'+domainProfit(time),'Blackwing / builds running','Buzzline / 20 devices connected'].forEach((line,j)=>text(c,line,40,260+j*60,25)); }
      // A moving cursor makes the fly's input visible without changing real accounts.
      if(this.mode!=='power'){const x=650+Math.sin(time*1.4+i)*180,y=200+(time*40+i*70)%300;c.fillStyle='#f0f6ff';c.beginPath();c.moveTo(x,y);c.lineTo(x+5,y+21);c.lineTo(x+11,y+13);c.lineTo(x+22,y+12);c.fill();}
      map.needsUpdate = true;
    });
    const c=this.ledger.material.map.image.getContext('2d');header(c,this.mode==='food'?'DOMAIN DYNASTY / REALIZED PROFIT':'COLONY / OPERATIONS','megacity.local/dashboard');
    if(this.mode==='food'){text(c,'+$'+domainProfit(time),40,270,98,'#a5ffbf');text(c,'Simulated profit / completed resales only',40,340,28);STATIONS.forEach((_,i)=>{const d=domainDeal(time,i);text(c,'DESK '+(i+1)+' / '+d.closed+' sold / +$'+d.closed*d.profit,40,415+i*48,25);});}
    else {text(c,this.mode==='cargo'?'20 PHONES / 200 PROFILES':this.mode==='lab'?'BUILD. TEST. SHIP.':this.mode==='power'?'WING STREET / LOCKED IN':'FLY GUY HOLDINGS',35,240,40,'#b9edff');text(c,this.mode==='power'?'TradingView terminals / stocks + crypto':this.mode==='cargo'?'Synchronized feed previews and device sessions':this.mode==='lab'?'Three engineers / three active workspaces':'Markets / Domains / Products / Media',35,325,25);text(c,'WATCH A WORKSTATION TO SEE THE DETAILS',35,475,23,'#8dacc1');}
    this.ledger.material.map.needsUpdate=true;
    if(this.mode==='cargo')this.phones.forEach((phone,i)=>{const c=phone.material.map.image.getContext('2d');c.fillStyle='#101925';c.fillRect(0,0,216,368);text(c,'BUZZ / '+(i+1),12,30,19,'#9ae7de');text(c,'Profile '+(Math.floor(time/6+i)%10+1),12,58,16);for(let j=0;j<3;j++){const y=80+j*145-(time*22%145);c.fillStyle=['#34466d','#5b3974','#285e62'][(j+i)%3];c.fillRect(10,y,196,105);text(c,'COLONY FEED',20,y+55,17);text(c,'Preview '+(Math.floor(time/6)+j),20,y+85,14);}phone.material.map.needsUpdate=true;});
  }
}
