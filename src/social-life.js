// Fictional money and compressed work hours; all timers use simulation time.
const clamp = n => Math.max(0, Math.min(1, n));
export const SHIFT_SECONDS = 120;
export function newSocial() {
  return { cash: 24, bills: 0, groceries: 3, shifts: 0, worked: 0, earned: 0, onClock: false, overtime: false, breakUntil: 0, shoppingUntil: 0, nextShift: 90, visitors: 0, visits: 0, circleSize: 1, nextFriendCall: 0, together: 0, arrivedAt: 0, leaveAt: 0, nextVisit: 0, socialReward: 0 };
}
export function decodeSocial(value) {
  if (value === undefined) return newSocial();
  if (!value || typeof value !== 'object') return null;
  const s = { ...newSocial(), ...value };
  // Preserve existing visitors when migrating worlds created before call-based growth.
  if (value.circleSize === undefined) s.circleSize = Math.min(5, Math.max(1, s.visitors, 1 + Math.floor(s.visits / 2)));
  if (value.nextFriendCall === undefined) s.nextFriendCall = s.visits && s.circleSize < 5 ? s.visits + 2 : 0;
  for (const key of Object.keys(newSocial()).filter(k => !['onClock','overtime'].includes(k)))
    if (!Number.isFinite(s[key]) || s[key] < 0 || s[key] > 1e10) return null;
  if (typeof s.onClock !== 'boolean' || typeof s.overtime !== 'boolean') return null;
  for (const key of ['groceries','shifts','visitors','visits','circleSize','nextFriendCall']) if (!Number.isSafeInteger(s[key])) return null;
  if (s.circleSize < 1 || s.circleSize > 5 || s.visitors > s.circleSize || s.groceries > 99) return null;
  return Object.fromEntries(Object.keys(newSocial()).map(k => [k,s[k]]));
}
export function callBuzz(sim) {
  const s = sim.life.social;
  if (s.onClock || sim.environment === 'store' || sim.life.route.includes('store') || s.visitors || sim.time < s.nextVisit) return false;
  s.visits++;
  if (s.circleSize < 5 && s.nextFriendCall && s.visits >= s.nextFriendCall) {
    s.circleSize++; s.nextFriendCall = 0;
    sim.log('A new friend joined his Buzz circle.');
  }
  if (s.circleSize < 5 && !s.nextFriendCall) s.nextFriendCall = s.visits + 1 + Math.floor(sim.random() * 3);
  // One friend always answers; the others independently decide whether to join.
  s.visitors = 1;
  for (let i = 1; i < s.circleSize; i++) if (sim.random() < .65) s.visitors++;
  s.arrivedAt = sim.time; s.leaveAt = sim.time + 300 + sim.random() * 720;
  sim.log('Calling The Buzz. ' + s.visitors + ' of ' + s.circleSize + ' friends can make it.');
  return true;
}
export function dismissBuzz(sim, message = 'The Buzz heads out. Call them again another time.') {
  const s = sim.life.social;
  if (!s.visitors) return;
  s.visitors = 0; s.leaveAt = sim.time; s.nextVisit = sim.time + 180; s.socialReward = 0;
  sim.log(message);
}
export function finishShift(sim, paidEarly = false) {
  const s = sim.life.social;
  if (!s.onClock) return false;
  const fullPay = s.overtime ? 80 : 64;
  if (paidEarly) s.cash += Math.max(0, fullPay - s.earned);
  s.onClock = false; s.shifts++; s.nextShift = sim.time + 600; s.breakUntil = 0;
  s.bills += 44; const payment = Math.min(s.cash, s.bills); s.cash -= payment; s.bills -= payment;
  const food = Math.min(3, Math.floor(s.cash / 4)); s.cash -= food * 4; s.groceries = Math.min(99, s.groceries + food); s.shoppingUntil = food ? sim.time + 12 : 0;
  sim.life.action = null; sim.life.nextDecision = sim.time; sim.life.holdUntil = 0;
  sim.life.mood = clamp(sim.life.mood + (paidEarly ? .18 : .06));
  sim.log(`Clocked out${paidEarly ? ' early, fully paid' : ''}. Bills $ ${payment.toFixed(0)}. Bought ${food} groceries.`);
  return true;
}
export function workPerk(sim, kind) {
  const s = sim.life.social;
  if (!s.onClock || sim.environment !== 'store') return false;
  if (kind === 'early') return finishShift(sim, true);
  if (kind === 'overtime') {
    if (s.overtime) return false;
    s.overtime = true; sim.life.stress = clamp(sim.life.stress + .12);
    sim.log('Two extra paid hours. Staying until 7 PM.'); return true;
  }
  if (kind === 'smoke' && sim.time >= s.breakUntil) {
    s.breakUntil = sim.time + 14; sim.log('A cigarette break outside the shop. The register can wait.'); return true;
  }
  return false;
}
export function updateSocial(sim, dt) {
  const l = sim.life, s = l.social;
  s.socialReward = 0;
  // Also repair older saves that already brought visitors into a shift.
  if (s.onClock || sim.environment === 'store') dismissBuzz(sim, 'The Buzz heads home. Work time is his own.');
  if (s.visitors) {
    if (sim.time >= s.leaveAt) {
      dismissBuzz(sim);
    } else if (!s.onClock && sim.time > s.arrivedAt + 8) {
      s.together += dt; s.socialReward = .32;
      l.mood = clamp(l.mood + dt * .002); l.stress = clamp(l.stress - dt * .002);
      if (l.action === 'Sleeping') sim.energy = clamp(sim.energy + dt * .003);
    }
  }
  if (l.autonomous && s.shifts > 0 && !sim.roomObjects().some(o => o.kind !== 'peppermint' && o.amount > .04) && !s.onClock && s.groceries && sim.hunger > .65 && sim.environment === 'habitat' && !l.route.length) {
    s.groceries--; sim.hunger = Math.max(.08,sim.hunger - .55); sim.energy = clamp(sim.energy + .12);
    sim.log('Home groceries. A quick meal before the next thing.');
  }
  if (s.onClock && sim.environment === 'store' && sim.state === 'Working' && sim.time >= s.breakUntil) {
    const limit = SHIFT_SECONDS + (s.overtime ? 30 : 0);
    const seconds = Math.min(dt, Math.max(0, limit - s.worked));
    s.worked += seconds; s.earned += seconds * 64 / SHIFT_SECONDS; s.cash += seconds * 64 / SHIFT_SECONDS;
    l.stress = clamp(l.stress + dt * .0015); sim.energy = clamp(sim.energy - dt * .0014);
    s.socialReward = .07;
    if (s.worked >= limit) finishShift(sim);
  }
}
export function shiftClock(s) {
  const minutes = 9 * 60 + Math.min(s.worked / SHIFT_SECONDS * 480, s.overtime ? 600 : 480);
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(Math.floor(minutes % 60)).padStart(2,'0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

