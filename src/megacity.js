import { CityWorkstations, CITY_FOUNDATION, OUTER_BUILDINGS, domainDeal, domainProfit } from './megacity-workstations.js';
import * as T from 'three';

export const DEPARTMENTS = [
  {
    "id": "hq",
    "name": "Apex Spire",
    "tag": "FLY GUY HOLDINGS",
    "lead": "Fly Guy",
    "role": "Founder & chief executive",
    "task": "Funding ventures and steering the empire",
    "color": "#e3ff9c",
    "x": 0,
    "z": -8,
    "height": 38,
    "screens": [
      [
        "THE HOLDING COMPANY",
        "CAPITAL / STRATEGY / GROWTH"
      ],
      [
        "VENTURE PORTFOLIO",
        "WING STREET + DOMAIN DYNASTY"
      ],
      [
        "OPERATIONS",
        "BLACKWING LABS + BUZZLINE"
      ]
    ],
    "phases": [
      "Reviewing reports",
      "Allocating capital",
      "Approving the next venture"
    ],
    "output": "ventures reviewed"
  },
  {
    "id": "power",
    "name": "Wing Street Exchange",
    "tag": "STOCKS + CRYPTO",
    "lead": "Ticker",
    "role": "Head of trading",
    "task": "Watching stocks, crypto and market momentum",
    "color": "#80faff",
    "x": -23,
    "z": -12,
    "height": 24,
    "screens": [
      [
        "STOCK WATCH",
        "SIMULATED MARKET"
      ],
      [
        "CRYPTO DESK",
        "SIMULATED MARKET"
      ],
      [
        "TRADE JOURNAL",
        "RESEARCH / PAPER TRADE / REVIEW"
      ]
    ],
    "phases": [
      "Scanning the markets",
      "Paper trading the setup",
      "Reporting the results"
    ],
    "output": "market sessions reviewed"
  },
  {
    "id": "food",
    "name": "Domain Dynasty",
    "tag": "DOMAIN ACQUISITIONS",
    "lead": "Registrar",
    "role": "Domain acquisitions director",
    "task": "Finding undervalued names and flipping them for profit",
    "color": "#a6ffb8",
    "x": 23,
    "z": -15,
    "height": 22,
    "screens": [
      [
        "ACQUISITION DESK",
        "SCOUT / APPRAISE / BUY"
      ],
      [
        "DOMAIN PORTFOLIO",
        "SIMULATED INVENTORY"
      ],
      [
        "SALES DESK",
        "LIST / NEGOTIATE / FLIP"
      ]
    ],
    "phases": [
      "Scouting undervalued domains",
      "Buying and listing names",
      "Closing a domain flip"
    ],
    "output": "domain flips closed"
  },
  {
    "id": "lab",
    "name": "Blackwing Labs",
    "tag": "APPS + AUTOMATION",
    "lead": "Patch",
    "role": "Product & automation lead",
    "task": "Building apps, storefronts and tools for the colony",
    "color": "#c9a1ff",
    "x": -23,
    "z": 16,
    "height": 19,
    "screens": [
      [
        "BUILD PIPELINE",
        "DESIGN / CODE / TEST / SHIP"
      ],
      [
        "CLIENT PROJECTS",
        "DOMAIN STOREFRONTS + MARKET TOOLS"
      ],
      [
        "AUTOMATION QUEUE",
        "LISTINGS / ANALYTICS / REPORTING"
      ]
    ],
    "phases": [
      "Scoping the next product",
      "Building and testing",
      "Shipping the release"
    ],
    "output": "product releases shipped"
  },
  {
    "id": "cargo",
    "name": "Buzzline Studios",
    "tag": "MEDIA + ADVERTISING",
    "lead": "Hype",
    "role": "Device operations director",
    "task": "Operating 20 phones and 200 simulated social profiles",
    "color": "#ffb878",
    "x": 23,
    "z": 16,
    "height": 17,
    "screens": [
      [
        "CONTENT STUDIO",
        "SCRIPT / SHOOT / EDIT"
      ],
      [
        "CAMPAIGN DESK",
        "LAUNCHES + DOMAIN PROMOTIONS"
      ],
      [
        "AUDIENCE GROWTH",
        "VIEWS / CLICKS / NEW CUSTOMERS"
      ]
    ],
    "phases": [
      "Planning the campaign",
      "Producing content and ads",
      "Launching the campaign"
    ],
    "output": "campaigns launched"
  }
];
// One shared business cycle: market research -> acquisitions -> products -> promotion -> HQ.
// Deriving the ledger from simulation time preserves pause, speed, and saved worlds.
export function cityWork(time, index = 0) {
  const stage = [4, 0, 1, 2, 3][index] ?? 4;
  const elapsed = Math.max(0, time), cycle = Math.floor(elapsed / 120);
  const stageTime = elapsed % 120 - stage * 24;
  const progress = Math.max(0, Math.min(1, stageTime / 24));
  return { completed: cycle + (stageTime >= 24 ? 1 : 0), progress,
    stage: stageTime < 0 ? -1 : stageTime >= 24 ? 3 : progress < .25 ? 0 : progress < .8 ? 1 : 2,
    phase: stageTime < 0 ? 'Awaiting the team briefing' : stageTime >= 24 ? 'Report sent to headquarters' : progress < .25 ? 'Preparing' : progress < .8 ? 'Working' : 'Dispatching' };
}
const solid = color => new T.MeshStandardMaterial({ color, roughness: .48, metalness: .55 });
const glow = color => new T.MeshBasicMaterial({ color, toneMapped: false });
const cube = new T.BoxGeometry(1, 1, 1);
function box(parent, size, position, material) {
  const m = new T.Mesh(cube, material); m.scale.set(...size); m.position.set(...position); parent.add(m); return m;
}
function ring(parent, radius, y, color) {
  const m = new T.Mesh(new T.TorusGeometry(radius, .055, 6, 80), glow(color)); m.rotation.x = Math.PI / 2; m.position.y = y; parent.add(m); return m;
}
function sign(parent, title, subtitle, position, width, color = '#b8f7ff') {
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 192;
  const c = canvas.getContext('2d'); c.fillStyle = '#0b1024'; c.fillRect(0, 0, 768, 192);
  c.strokeStyle = color; c.lineWidth = 5; c.strokeRect(3, 3, 762, 186);
  c.textAlign = 'center'; c.fillStyle = color; c.font = 'bold 42px sans-serif'; c.fillText(title, 384, 80);
  c.fillStyle = '#e5eaf5'; c.font = '24px sans-serif'; c.fillText(subtitle, 384, 135);
  const map = new T.CanvasTexture(canvas); map.colorSpace = T.SRGBColorSpace;
  const m = new T.Sprite(new T.SpriteMaterial({ map })); m.position.set(...position); m.scale.set(width, width / 4, 1); parent.add(m); return m;
}
function worker(color) {
  const group = new T.Group(), body = solid('#30384a'), eye = glow('#e77665'), wings = [];
  const ball = (mat, p, s) => { const m = new T.Mesh(new T.SphereGeometry(1, 12, 8), mat); m.position.set(...p); m.scale.set(...s); group.add(m); };
  ball(body, [0, .1, -.35], [.32, .3, .55]); ball(solid(color), [0, .15, .2], [.35, .32, .36]);
  for (const side of [-1, 1]) {
    ball(eye, [side * .2, .23, .5], [.18, .21, .17]);
    const wing = new T.Mesh(new T.SphereGeometry(1, 10, 6), new T.MeshBasicMaterial({ color: '#c5eeff', transparent: true, opacity: .45, depthWrite: false }));
    wing.position.set(side * .45, .4, -.25); wing.scale.set(.55, .025, .7); group.add(wing); wings.push(wing);
    for (let i = 0; i < 3; i++) {
      const points = [[side * .2, 0, .3 - i * .3], [side * .55, -.2, .4 - i * .35], [side * .65, -.5, .5 - i * .4]].map(p => new T.Vector3(...p));
      group.add(new T.Line(new T.BufferGeometry().setFromPoints(points), new T.LineBasicMaterial({ color: '#c3bba3' })));
    }
  }
  return { group, wings };
}

export class Megacity {
  constructor(habitat, createWorker) {
    this.createWorker = createWorker;
    this.habitat = habitat; this.selected = null; this.lastTick = -1;
    this.scene = new T.Scene(); this.scene.background = new T.Color('#090920'); this.scene.fog = new T.Fog('#121033', 100, 220);
    this.scene.add(new T.HemisphereLight('#b6c8ff', '#33205c', 3));
    const light = new T.DirectionalLight('#d9ecff', 3); light.position.set(12, 45, 30); this.scene.add(light);
    this.city = new T.Group(); this.office = new T.Group(); this.scene.add(this.city, this.office);
    this.targets = []; this.commuters = []; this.crew = []; this.screens = [];
    this.buildCity(); this.buildOffice(); this.workstations = new CityWorkstations(this);
    this.panel = document.createElement('section'); this.panel.className = 'megacity-panel'; this.panel.setAttribute('aria-label', 'Megacity directory');
    this.panel.innerHTML = `<div class="megacity-heading"><span>MEGACITY <i>• LIVE</i></span><button data-city-toggle aria-label="Toggle city directory" aria-expanded="true">-</button><button data-city-back hidden>← Skyline</button></div><div class="megacity-body"><h3 data-city-title>A million wings. One city.</h3><p data-city-description>Explore a tower to meet the flies keeping this city alive.</p><div class="megacity-directory">${DEPARTMENTS.map(d => `<button data-building="${d.id}" style="--tower-color:${d.color}"><i></i><span>${d.name}<small>${d.tag}</small></span><b>↗</b></button>`).join('')}</div><div class="megacity-work" hidden><strong data-city-lead></strong><span data-city-task></span><div class="megacity-progress"><i></i></div><small data-city-status></small></div><div class="megacity-desks" hidden><button data-desk="0">Watch lead laptop</button><button data-desk="1">Watch desk 2</button><button data-desk="2">Watch desk 3</button><button data-office-wide>Office overview</button></div><div class="megacity-actions"><button data-city-hq>Follow Fly Guy · HQ</button><button data-city-invite>Invite Fly Guy here</button></div><small class="megacity-hint">Click a tower · Drag to orbit · Scroll to zoom</small></div>`;
    habitat.container.append(this.panel);
    const toggle = this.panel.querySelector('[data-city-toggle]');
    const collapse = value => { this.panel.classList.toggle('collapsed', value); toggle.setAttribute('aria-expanded', String(!value)); toggle.textContent = value ? '+' : '-'; };
    toggle.onclick = () => collapse(!this.panel.classList.contains('collapsed'));
    const mobile = window.matchMedia('(max-width: 650px)');
    collapse(mobile.matches); mobile.addEventListener('change', e => collapse(e.matches));
    this.panel.querySelectorAll('[data-building]').forEach(b => b.onclick = () => this.open(b.dataset.building));
    this.panel.querySelectorAll('[data-desk]').forEach(b => b.onclick = () => this.workstations.focus(Number(b.dataset.desk)));
    this.panel.querySelector('[data-office-wide]').onclick = () => this.frame();
    this.panel.querySelector('[data-city-back]').onclick = () => this.open(null);
    this.panel.querySelector('[data-city-hq]').onclick = () => { this.open('hq'); habitat.follow = true; };
    this.panel.querySelector('[data-city-invite]').onclick = () => document.querySelector('#invite-fly').click();
    this.escape = e => { if (e.key === 'Escape' && habitat.environment === 'megacity' && this.selected) this.open(null); };
    window.addEventListener('keydown', this.escape);
    this.open(null);
  }
  buildCity() {
    const dark = solid('#11132f');
    box(this.city, [CITY_FOUNDATION, 1.2, CITY_FOUNDATION], [0, -.6, 0], dark);
    const grid = new T.GridHelper(CITY_FOUNDATION, 74, '#4a4297', '#28224b'); grid.position.y = .015; this.city.add(grid);
    for (const r of [43, 45, 48]) ring(this.city, r, .4, '#7369ed');
    // A single instanced mesh holds the skyline windows.
    const windows = [], dummy = new T.Object3D();
    const tower = (x, z, width, height, depth, color, department) => {
      const m = box(this.city, [width, height, depth], [x, height / 2, z], dark);
      m.userData.buildingFootprint = { x, z, width, depth };
      if (department) { m.userData.department = department; this.targets.push(m); }
      for (const sx of [-1, 1]) box(this.city, [.07, height, .07], [x + sx * width / 2, height / 2, z + depth / 2], glow(color));
      box(this.city, [width + .5, .14, depth + .5], [x, height, z], glow(color));
      for (let y = 1; y < height - .5; y += 1.15) for (let u = -width / 2 + .65; u < width / 2; u += .85) {
        if (Math.sin(y * 19 + u * 12 + x) > -.4) windows.push([x + u, y, z + depth / 2 + .03, .25, .47, .025]);
        if (Math.cos(y * 12 + u * 9 + z) > -.3) windows.push([x + width / 2 + .03, y, z + u * depth / width, .025, .47, .25]);
      }
    };
    DEPARTMENTS.forEach(d => {
      box(this.city, [17, .6, 15], [d.x, .3, d.z], solid('#201b49'));
      for (let tier = 0; tier < 3; tier++) {
        const h = d.height * (.5 + tier * .25), w = 10 - tier * 2.4;
        tower(d.x, d.z, w, h, w, d.color, d.id);
      }
      const halo = ring(this.city, 4, d.height + 1, d.color); halo.position.x = d.x; halo.position.z = d.z;
      box(this.city, [.13, 7, .13], [d.x, d.height + 3.5, d.z], glow(d.color));
      const beam = new T.Mesh(new T.CylinderGeometry(.25, 1.4, 8, 12, 1, true), new T.MeshBasicMaterial({ color: d.color, transparent: true, opacity: .13, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
      beam.position.set(d.x, d.height + 4, d.z); this.city.add(beam);
      for (const side of [-1, 1]) { box(this.city, [17, .08, .08], [d.x, .65, d.z + side * 7.5], glow(d.color)); box(this.city, [.08, .08, 15], [d.x + side * 8.5, .65, d.z], glow(d.color)); }
      const label = sign(this.city, d.name.toUpperCase(), d.tag, [d.x, d.height + 9, d.z], 15, d.color); label.userData.department = d.id; this.targets.push(label);
      for (const side of [-1, 1]) tower(d.x + side * 6, d.z + 3, 3, 5 + (d.height % 7), 3, '#7776c4', d.id);
    });
    for (const b of OUTER_BUILDINGS) tower(b.x, b.z, b.width, b.height, b.depth, '#39366e');
    const panes = new T.InstancedMesh(cube, glow('#bbd5ff'), windows.length);
    windows.forEach((p, i) => { dummy.position.set(...p.slice(0, 3)); dummy.scale.set(...p.slice(3)); dummy.updateMatrix(); panes.setMatrixAt(i, dummy.matrix); }); this.city.add(panes);
    for (let i = 0; i < 24; i++) {
      const fly = worker(DEPARTMENTS[i % 5].color); fly.group.scale.setScalar(.65); this.city.add(fly.group); this.commuters.push(fly);
    }
    for (let i = 1; i < DEPARTMENTS.length; i++) {
      const d = DEPARTMENTS[i], points = [new T.Vector3(d.x, 7, d.z), new T.Vector3(0, 7, -8)];
      this.city.add(new T.Line(new T.BufferGeometry().setFromPoints(points), new T.LineBasicMaterial({ color: d.color, transparent: true, opacity: .3 })));
    }
    sign(this.city, 'THE COLONY', 'EVERY WING HAS A PURPOSE', [0, 3, 31], 19);
  }
  buildOffice() {
    const dark = solid('#12172b'), metal = solid('#35425b');
    box(this.office, [23, .3, 21], [0, -.2, 0], dark);
    const grid = new T.GridHelper(22, 22, '#4b526e', '#252d45'); grid.position.y = .01; this.office.add(grid);
    for (const x of [-11, 11]) box(this.office, [.16, 9, 20], [x, 4.5, 0], metal);
    for (let x = -10; x <= 10; x += 4) box(this.office, [.12, 9, .15], [x, 4.5, -9], glow('#797bba'));
    box(this.office, [22, .12, .15], [0, 8.8, -9], glow('#adabff'));
    // Panoramic windows are open to a miniature skyline beyond the office.
    for (let i = 0; i < 19; i++) {
      const x = (i - 9) * 2.7, h = 3 + i * 7 % 11;
      box(this.office, [2, h, 2], [x, h / 2 - 4, -17 - i % 3 * 3], solid('#1b2148'));
      for (let y = -2; y < h - 4; y += 1.1) box(this.office, [1.3, .18, .05], [x, y, -15.9 - i % 3 * 3], glow(i % 2 ? '#9987f7' : '#7fbdcd'));
    }
    const stations = [[0, -3], [-6, 0], [6, 0]];
    stations.forEach(([x, z], i) => {
      box(this.office, [4.8, .22, 2], [x, 1.12, z - 1.65], metal);
      for (const side of [-1, 1]) box(this.office, [.18, 1.1, 1.5], [x + side * 2, .55, z - 1.65], dark);
      box(this.office, [1.8, .3, 1.7], [x, 1.05, z], dark);
      box(this.office, [1.4, .65, .2], [x, 1.4, z + .9], metal);


      if (i) { const fly = this.createWorker(); fly.group.scale.setScalar(.65); fly.group.position.set(x, 1.8, z); fly.group.rotation.y = Math.PI; this.office.add(fly.group); this.crew.push(fly); }
    });
    this.lead = this.createWorker(); this.lead.group.scale.setScalar(.65); this.lead.group.position.set(0, 1.8, -3); this.lead.group.rotation.y = Math.PI; this.office.add(this.lead.group); this.crew.push(this.lead);
    this.officeSign = sign(this.office, 'APEX SPIRE', 'FLY GUY HOLDINGS', [0, 7, -8], 11);
    this.prop = new T.Group(); this.office.add(this.prop);
  }
  decorate(d) {
    this.prop.traverse(o => { if (o.isMesh) { if (o.geometry !== cube) o.geometry.dispose(); o.material.dispose(); } });
    this.prop.clear();
    const mat = glow(d.color);
    if (d.id === 'power') {
      // Green and red candlesticks across a market display wall.
      box(this.prop, [8, 3, .25], [-5, 2.5, -7], solid('#0a1823'));
      for (let i = 0; i < 14; i++) {
        const up = i % 3 !== 0, color = glow(up ? '#7affba' : '#ff7d96');
        const y = 2 + Math.sin(i * .7) * .65;
        box(this.prop, [.06, 1.1, .08], [-8.5 + i * .54, y, -6.8], color);
        box(this.prop, [.28, .35 + i % 3 * .15, .1], [-8.5 + i * .54, y, -6.7], color);
      }
    }
    if (d.id === 'food') {
      // Domain portfolio servers and an acquisitions counter.
      for (let i = 0; i < 3; i++) {
        box(this.prop, [1.1, 2.8, .8], [-7 + i * 1.6, 1.4, -6], solid('#1d3443'));
        for (let row = 0; row < 6; row++) box(this.prop, [.8, .08, .04], [-7 + i * 1.6, .4 + row * .4, -5.57], mat);
      }
    }
    if (d.id === 'lab' || d.id === 'hq') { const m = new T.Mesh(new T.IcosahedronGeometry(1.2, 1), new T.MeshBasicMaterial({ color: d.color, wireframe: true })); m.position.set(-6, 2, -6); this.prop.add(m); }

  }
  open(id) {
    const d = DEPARTMENTS.find(d => d.id === id); if (id && !d) return;
    this.lastTick = -1;
    this.workstations.setMode(id);
    this.selected = id; this.city.visible = !id; this.office.visible = !!id;
    this.panel.dataset.building = id || 'skyline'; this.habitat.container.dataset.cityBuilding = id || 'skyline';
    this.panel.querySelector('[data-city-back]').hidden = !id;
    this.panel.querySelector('.megacity-directory').hidden = !!id;
    this.panel.querySelector('.megacity-work').hidden = !id;
    this.panel.querySelector('.megacity-desks').hidden = !id;
    this.panel.querySelector('[data-city-title]').textContent = d?.name || 'A million wings. One city.';
    this.panel.querySelector('[data-city-description]').textContent = d ? `${d.tag} / ${d.role}` : 'Explore a tower to meet the flies keeping this city alive.';
    if (d) {
      this.panel.querySelector('[data-city-lead]').textContent = `${d.lead} + 2 crew flies`;
      this.panel.querySelector('[data-city-task]').textContent = d.task;
      this.lead.group.visible = id !== 'hq'; this.decorate(d);
      const old = this.officeSign; this.office.remove(old); old.material.map.dispose(); old.material.dispose();
      this.officeSign = sign(this.office, d.name.toUpperCase(), d.task, [-5.5, 5.8, -8], 8, d.color);
    }
    this.habitat.follow = false; this.frame();
  }
  frame() {
    const h = this.habitat, portrait = h.camera.aspect < 1;
    h.controls.enableDamping = false; h.controls.update();
    h.controls.maxDistance = this.selected ? 40 : 180;
    h.controls.target.set(0, this.selected ? 2 : 13, this.selected ? -3 : 0);
    h.camera.position.set(...(this.selected ? (portrait ? [17, 13, 27] : [12, 9, 18]) : portrait ? [90, 85, 125] : [96, 76, 118]));
    h.controls.update(); h.controls.enableDamping = true;
  }
  pick(ray) { if (this.selected) { const hit = ray.intersectObjects(this.workstations.screens, false)[0]; if (hit) this.workstations.focus(hit.object.userData.desk); return; } const hit = ray.intersectObjects(this.targets, false)[0]; if (hit) this.open(hit.object.userData.department); }
  update(sim, animateFly, running) {
    const h = this.habitat, here = sim.environment === 'megacity', inside = this.selected === 'hq';
    this.scene.add(h.fly.group); h.fly.group.visible = here && (!this.selected || inside);
    h.fly.group.scale.setScalar(this.selected ? 1 : .35);
    h.fly.group.position.set(inside ? sim.x : sim.x * .2, inside ? sim.y + 1.15 : 39 + sim.y * .2, inside ? sim.z : -8 + sim.z * .2);
    h.fly.group.rotation.y = sim.heading; animateFly(h.fly, sim);
    if (h.follow && here && inside) { const p = h.fly.group.position; h.controls.target.lerp(p, .08); }
    this.commuters.forEach((fly, i) => {
      const chain = [1, 2, 3, 4, 0], a = DEPARTMENTS[chain[i % 5]], b = DEPARTMENTS[chain[(i + 1) % 5]], u = (sim.time * .035 + i / 24) % 1;
      fly.group.position.set(a.x + (b.x - a.x) * u, 9 + Math.sin(u * Math.PI) * 10 + i % 4, a.z + (b.z - a.z) * u);
      fly.group.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      fly.wings.forEach((w, j) => w.rotation.z = Math.sin(sim.time * 55 + i) * .5 * (j ? 1 : -1));
    });
    this.crew.forEach((fly, i) => animateFly(fly, { time: sim.time * 1.65 + i, state: 'Working', speed: 0, y: .87, environment: 'megacity' }));
    this.prop.rotation.y = 0;
    if (this.selected === 'lab' || this.selected === 'hq') this.prop.children[0].rotation.y = sim.time * .4;
    const index = DEPARTMENTS.findIndex(d => d.id === this.selected), work = cityWork(sim.time, Math.max(0, index));
    this.panel.querySelector('.megacity-progress i').style.width = `${work.progress * 100}%`;
    if (Math.floor(sim.time * 2) !== this.lastTick) {
      this.lastTick = Math.floor(sim.time * 2);
      const department = DEPARTMENTS[index];
      if (department) {
        const activity = work.stage >= 0 && work.stage < 3 ? department.phases[work.stage] : work.phase;
        this.panel.querySelector('[data-city-task]').textContent = department.task + ' / ' + activity;

      }
      this.panel.querySelector('[data-city-status]').textContent = `${work.phase} · ${work.completed} ${DEPARTMENTS[index]?.output ?? 'business cycles completed'} · shared colony network`;
      if (this.selected === 'food') {
        const deal = domainDeal(sim.time);
        this.panel.querySelector('[data-city-task]').textContent = deal.name + ' / ' + deal.status;
        this.panel.querySelector('[data-city-status]').textContent = 'Realized simulated profit: +$' + domainProfit(sim.time) + ' / 3 acquisition desks';
      } else if (this.selected === 'cargo') {
        this.panel.querySelector('[data-city-task]').textContent = '20 phones / 10 profiles each / synchronized scrolling';
        this.panel.querySelector('[data-city-status]').textContent = 'Simulated device console / all 20 phones online';
      } else if (this.selected === 'lab') {
        this.panel.querySelector('[data-city-task]').textContent = 'Locked in / coding market tools, domain systems and device software';
        this.panel.querySelector('[data-city-status]').textContent = '3 workspaces / type, build, test, repeat';
      } else if (this.selected === 'power') {
        this.panel.querySelector('[data-city-task]').textContent = 'Locked in / monitoring stocks and crypto on TradingView';
        this.panel.querySelector('[data-city-status]').textContent = '3 market terminals / select a laptop for a closer view';
      }
      this.panel.querySelector('[data-city-invite]').hidden = here;
      if (inside) this.panel.querySelector('[data-city-lead]').textContent = here ? 'Fly Guy · at headquarters / 2 crew flies' : '2 crew flies on duty · Invite Fly Guy to his HQ';
    }
    h.container.dataset.flyPresent = String(here); h.container.dataset.flyRoom = sim.environment;
    h.controls.update(); this.workstations.update(sim.time, running); h.renderer.render(this.scene, h.camera);
  }
}
