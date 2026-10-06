// Shared dimensions for the park's geometry, landing surfaces, and navigation.
export const PARK = { radius: 40, flyRadius: 38, objectRadius: 37, eyeHeight: 2.05, walkSpeed: 4.2, runSpeed: 8.4 };
export const PARK_PERCHES = [
  // Keep the original three indices and positions so saved lessons still work.
  { name: 'Sun pad', x: -5, z: -3, height: .55, radius: 1.55, color: '#edbd68', kind: 'stump' },
  { name: 'Sky pad', x: 4, z: -4, height: 1.05, radius: 1.55, color: '#78c9d4', kind: 'stump' },
  { name: 'Bloom pad', x: 3, z: 4, height: .75, radius: 1.55, color: '#cd94bf', kind: 'stump' },
  { name: 'Big slide platform', x: -18, z: -15, height: 3.1, radius: 2.35, color: '#dfbc78', kind: 'slideTower' },
  { name: 'Rope tower', x: -9, z: -20, height: 2.6, radius: 2.1, color: '#b8c8a3', kind: 'tower' },
  { name: 'Treehouse deck', x: 21.4, z: -8, height: 2.1, radius: 1.1, color: '#e0b98a', kind: 'deck' },
  { name: 'Picnic table', x: 19, z: 17, height: 1.35, radius: 1.5, color: '#d4c29c', kind: 'table' },
  { name: 'Boulder garden', x: -21, z: 16, height: 1.6, radius: 1.65, color: '#acb9bf', kind: 'rock' },
];
export const PARK_TREES = [{ x: 8, z: -22, radius: 3, height: 1.5 }, { x: 19, z: -8, radius: 3.6, height: 2.1 }, { x: 12, z: 12, radius: 3, height: 1.2 }];
export const PARK_SLIDES = [{ id: 'big-slide', top: { x: -18, y: 3.1, z: -12.65 }, bottom: { x: -13, y: .95, z: -9 }, stairs: { x: -21.1, z: -13.3, topY: 3.1, radius: 1.25 } }];
export function parkSurfaceHeight(x, z) {
  const heights = [0];
  for (const p of PARK_PERCHES) if (Math.hypot(x - p.x, z - p.z) <= p.radius) heights.push(p.height);
  for (const p of PARK_TREES) if (Math.hypot(x - p.x, z - p.z) <= p.radius) heights.push(p.height);
  return Math.max(...heights);
}
