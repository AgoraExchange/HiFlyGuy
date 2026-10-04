// Rooftop stairwell footprint, padded for the fly's body and folded doorway wings.
const bounds = [-8.6, -3.4, -.8, 4.6];
export function crossesStairwell(a, b) {
  let lo = 0, hi = 1;
  for (const [axis, min, max] of [[0,bounds[0],bounds[1]],[1,bounds[2],bounds[3]]]) {
    const d = b[axis] - a[axis];
    if (Math.abs(d) < 1e-9) { if (a[axis] <= min || a[axis] >= max) return false; }
    else { const t1 = (min-a[axis])/d, t2 = (max-a[axis])/d; lo=Math.max(lo,Math.min(t1,t2)); hi=Math.min(hi,Math.max(t1,t2)); }
  }
  return lo < hi && hi > 0 && lo < 1;
}
export function roofWaypoint(x, z, dx, dz) {
  const start=[x,z], end=[x+dx,z+dz];
  // Older saves can start in the entrance apron; clear the doorway first.
  if (x > bounds[0] && x < bounds[1] && z > bounds[2] && z < bounds[3]) return [x,4.85];
  if (!crossesStairwell(start,end)) return end;
  // Do not steer toward a random/food target inside a solid building.
  if (end[0]>bounds[0] && end[0]<bounds[1] && end[1]>bounds[2] && end[1]<bounds[3]) {
    const edges=[[bounds[0]-.05,end[1]],[bounds[1]+.05,end[1]],[end[0],bounds[2]-.05],[end[0],bounds[3]+.05]];
    end.splice(0,2,...edges.sort((a,b)=>Math.hypot(a[0]-x,a[1]-z)-Math.hypot(b[0]-x,b[1]-z))[0]);
  }
  const nodes=[start,end,[-8.65,-.85],[-3.35,-.85],[-3.35,4.65],[-8.65,4.65]];
  const dist=nodes.map(()=>Infinity), prev=[], seen=new Set(); dist[0]=0;
  for(let k=0;k<nodes.length;k++) {
    let u=-1; for(let i=0;i<nodes.length;i++) if(!seen.has(i)&&(u<0||dist[i]<dist[u]))u=i;
    if(u<0||!Number.isFinite(dist[u]))break; seen.add(u);
    for(let v=1;v<nodes.length;v++) if(!seen.has(v)&&!crossesStairwell(nodes[u],nodes[v])) {
      const cost=dist[u]+Math.hypot(nodes[u][0]-nodes[v][0],nodes[u][1]-nodes[v][1]);
      if(cost<dist[v]){dist[v]=cost;prev[v]=u;}
    }
  }
  let next=1; while(prev[next]!==undefined&&prev[next]!==0)next=prev[next];
  return Number.isFinite(dist[1])?nodes[next]:start;
}
export function doorApron(room, exit) {
  return room === 'rooftop' ? [-6,6] : [exit[0],exit[1]+(room==='playground'?-1.5:1.5)];
}
