export const OPPONENT_DURATION=14;
export const OPPONENT_SHOTS=[
  ['red-desk',0,3],['reflection',3,5],['chair-turn',5,7],
  ['anxious-eyes',7,7.65],['calm-eyes',7.65,8.3],
  ['frantic-hands',8.3,8.95],['precise-hands',8.95,9.6],
  ['red-chart',9.6,10.3],['green-chart',10.3,11],
  ['empty-chair',11,12.2],['become',12.2,14],
];
export function sampleOpponentTake(time){
  const t=Math.max(0,Math.min(OPPONENT_DURATION,Number.isFinite(time)?time:0));
  const [shot,start,end]=OPPONENT_SHOTS.find(s=>t<s[2])??OPPONENT_SHOTS.at(-1);
  const p=Math.min(1,(t-start)/(end-start)),u=p*p*(3-2*p);
  const future=['calm-eyes','precise-hands','green-chart','empty-chair','become'].includes(shot);
  return {time:t,shot,u,future,reflection:shot==='reflection',opponent:shot==='chair-turn',
    freeze:shot==='reflection',transformed:t>=11,
    caption:shot==='become'?'HE WAS ALWAYS THE COMPETITION.':''};
}
