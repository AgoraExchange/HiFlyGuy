import { Vector3, Quaternion } from 'three';

// Includes his body, extended wings, and a little breathing room for the camera.
export const FLY_PERSONAL_SPACE = 2.15;
const v = p => new Vector3(p.x, p.y, p.z);

// Sweep in relative space so neither a fast camera nor a moving fly can tunnel through.
export function separateViewer(from, desired, flyBefore, flyNow, radius = FLY_PERSONAL_SPACE) {
  const start = v(from).sub(v(flyBefore)), end = v(desired).sub(v(flyNow));
  const delta = end.clone().sub(start), a = delta.lengthSq(), b = 2 * start.dot(delta);
  const c = start.lengthSq() - radius * radius, discriminant = b * b - 4 * a * c;
  if (c >= -1e-6 && a > 1e-10 && discriminant >= 0) {
    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
    if (t >= 0 && t <= 1) {
      const contact = start.clone().addScaledVector(delta, t), normal = contact.clone().normalize();
      const remaining = delta.clone().multiplyScalar(1 - t);
      remaining.addScaledVector(normal, -Math.min(0, remaining.dot(normal)));
      end.copy(contact).add(remaining);
    }
  }
  if (end.length() < radius) {
    if (end.lengthSq() < 1e-10) end.copy(start.lengthSq() ? start : new Vector3(0, 0, 1));
    end.setLength(radius);
  }
  return end.add(v(flyNow));
}

// Arc around the viewer rather than flying through their eyes when approaching from behind.
export function approachViewer(origin, destination, eye, progress) {
  const from = v(origin).sub(v(eye)), to = v(destination).sub(v(eye));
  const distance = Math.max(FLY_PERSONAL_SPACE + .1, from.length() * (1 - progress) + to.length() * progress);
  from.normalize(); to.normalize();
  const rotation = new Quaternion().setFromUnitVectors(from, to);
  return from.applyQuaternion(new Quaternion().slerp(rotation, progress)).multiplyScalar(distance).add(v(eye));
}

export function noticeViewer(sim, dt) {
  const eye = sim.observer;
  if (!eye || sim.environment !== 'playground' || sim.speed > .1 || !['Grooming', 'Resting', 'Perching', 'Exploring'].includes(sim.state)) return;
  if (Math.hypot(eye.x - sim.x, eye.y - sim.y, eye.z - sim.z) > 7) return;
  const heading = Math.atan2(eye.x - sim.x, eye.z - sim.z);
  sim.heading += Math.atan2(Math.sin(heading - sim.heading), Math.cos(heading - sim.heading)) * Math.min(1, dt * 2.5);
}
