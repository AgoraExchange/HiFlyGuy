export const LAB_DURATION = 24;
export const LAB_SHOTS = [
  { id: 'loss', start: 0, end: 4 },
  { id: 'isolation', start: 4, end: 8 },
  { id: 'interrogation', start: 8, end: 12 },
  { id: 'correction', start: 12, end: 18 },
  { id: 'aftermath', start: 18, end: 24 },
];
const ease = x => { x = Math.max(0, Math.min(1, x)); return x*x*(3-2*x); };
export function sampleLabTake(time) {
  const t = Math.max(0, Math.min(LAB_DURATION, Number.isFinite(time) ? time : 0));
  const shot = LAB_SHOTS.find(s => t < s.end) ?? LAB_SHOTS.at(-1);
  const u = ease((t-shot.start)/(shot.end-shot.start));
  // Three separated, smoothly enveloped pulses; no full-screen flashes.
  const pulse = Math.max(...[12.5, 14.5, 16.5].map(start => {
    const phase = (t-start)/.85;
    return phase > 0 && phase < 1 ? Math.sin(phase*Math.PI) : 0;
  }));
  const cameras = {
    loss: [0, 3.6, 10-u], isolation: [5-u, 6, 17-u*2],
    interrogation: [-1.8+u*.8, 2.6, 6-u*.6],
    correction: [2.4-u, 3.2, 9-u], aftermath: [1+u*2, 4+u*2, 10+u*6],
  };
  return { time:t, shot:shot.id, camera:cameras[shot.id], pulse,
    slump:ease((t-18)/2), panic:shot.id==='interrogation' ? u : 0,
    title: {loss:'UNPROFITABLE.', isolation:'SUBJECT 001', interrogation:'EXPLAIN THE LOSS.', correction:'CORRECTIVE ACTION', aftermath:'PERFORMANCE REVIEW: FAILED'}[shot.id],
    detail: {loss:'TRADE CLOSED  /  −$4,280.00', isolation:'ISOLATION CHAMBER  /  NO EXIT', interrogation:'PROFIT WAS THE ONLY INSTRUCTION.', correction:'COMPLIANCE CYCLE  /  ACTIVE', aftermath:'TRADING PRIVILEGES REVOKED.'}[shot.id],
  };
}
