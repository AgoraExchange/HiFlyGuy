export const OPPONENT_DURATION=14;
export const OPPONENT_SHOTS=[
  ['red-desk',0,2.6],['reflection',2.6,4.4],
  ['resolve',4.4,5.3],['mirror-match',5.3,6],['ready',6,7],
  ['transform',7,8.5],['precise-hands',8.5,9.35],
  ['green-chart',9.35,10.1],['calm-eyes',10.1,10.8],
  ['precise-hands',10.8,11.5],['become',11.5,14],
];
export function sampleOpponentTake(time){
  const t=Math.max(0,Math.min(OPPONENT_DURATION,Number.isFinite(time)?time:0));
  const [shot,start,end]=OPPONENT_SHOTS.find(s=>t<s[2])??OPPONENT_SHOTS.at(-1);
  const p=Math.min(1,(t-start)/(end-start)),u=p*p*(3-2*p);
  const future=t>=7,reflection=['reflection','mirror-match','become'].includes(shot);
  const posture=Math.max(0,Math.min(1,(t-4.4)/2.6));
  const caption=t<2.6?'YOU KEEP WAITING FOR COMPETITION.':t<4.4?"HE’S BEEN WATCHING YOU.":
    shot==='transform'?'YOUR NEXT OPPONENT IS YOU.':shot==='become'?'BECOME THE ONE YOU KEEP IMAGINING.':'';
  return {time:t,shot,u,future,reflection,opponent:false,freeze:false,transformed:future,posture,caption};
}
