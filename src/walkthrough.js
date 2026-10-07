// Keep the visitor on each room's visible floor, inside its walls and railings.
export const WALKTHROUGH = {
  habitat: { bounds: [-9.5,9.5,-8.5,9.5], home: [0,2.05,5] },
  fireescape: { bounds: [-9.5,9.5,-7.3,9.5], home: [0,2.05,4] },
  computer: { bounds: [-13.8,13.8,-13.4,12.8], home: [0,2.05,3] },
  bar: { bounds: [-10.5,10.5,-8.5,9.5], home: [0,2.05,7] },
  rooftop: { bounds: [-10.8,10.8,-9,10.8], home: [0,2.05,6] },
  store: { bounds: [-9.5,9.5,-8.5,9.5], home: [0,2.05,5] },
};

// Read solid furniture directly from the rendered room, including counter tops,
// beds, stools, laptop, stairwell walls and the water tower. Skip scenery outside.
export function roomColliders(habitat) {
  const room=habitat.environment, config=WALKTHROUGH[room];
  if (!config) return [];
  const root=room==='computer'?habitat.computerRoom.group:habitat.lifeScenes.rooms.get(room);
  const result=[];root?.updateMatrixWorld(true);
  root?.traverseVisible(mesh=>{
    if (!mesh.isMesh || !['BoxGeometry','CylinderGeometry','ConeGeometry','SphereGeometry'].includes(mesh.geometry.type)) return;
    if (mesh.material.transparent && mesh.material.opacity<.8) return;
    mesh.geometry.computeBoundingBox();
    const box=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    const [left,right,back,front]=config.bounds;
    if(box.max.y<=.06||box.min.y>10||box.max.x<left||box.min.x>right||box.max.z<back||box.min.z>front)return;
    result.push(box);
  });
  return result;
}

export function constrainRoom(point, colliders, bounds) {
  const [left,right,back,front]=bounds;
  point.x=Math.max(left,Math.min(right,point.x));point.z=Math.max(back,Math.min(front,point.z));
  for(const box of colliders){
    if(point.y-2.05>=box.max.y-.01||point.y+.2<=box.min.y)continue;
    const l=box.min.x-.32,r=box.max.x+.32,b=box.min.z-.32,f=box.max.z+.32;
    if(point.x<=l||point.x>=r||point.z<=b||point.z>=f)continue;
    const distances=[point.x-l,r-point.x,point.z-b,f-point.z];
    const side=distances.indexOf(Math.min(...distances));
    if(side===0)point.x=l;else if(side===1)point.x=r;else if(side===2)point.z=b;else point.z=f;
  }
  point.x=Math.max(left,Math.min(right,point.x));point.z=Math.max(back,Math.min(front,point.z));
  return point;
}

export function insideRoom(point, bounds) {
  return point.x>=bounds[0]&&point.x<=bounds[1]&&point.z>=bounds[2]&&point.z<=bounds[3]&&point.y>=.6&&point.y<=9;
}
