export const DESTROY_DURATION=22;
export const DESTROY_VOICEOVER="Most people would've swatted him. I gave him an apartment. Now look at this little bastard - straight to the desk. Switching coins. Checking charts. Counting paper profits like he pays the fucking rent. Easy, FlyGuy. You still owe me for the Wi-Fi.";
export function destroyTiming({drop=5}={}){
  return {drop:Number.isFinite(drop)?Math.max(3,Math.min(9,drop)):5,duration:DESTROY_DURATION};
}
const CUTS=[
  ['lock-in',0,.10],['hands',.10,.17],['chart',.17,.24],['wallet',.24,.32],
  ['side',.32,.39],['chart',.39,.46],['wallet',.46,.54],['eyes',.54,.61],
  ['hands',.61,.68],['chart',.68,.74],['wallet',.74,.82],['over-shoulder',.82,.89],['hero',.89,1],
];
export function sampleDestroyTake(time,settings={}){
  const {drop,duration}=destroyTiming(settings),t=Math.max(0,Math.min(duration,Number.isFinite(time)?time:0));
  const montage=t>=drop,progress=(t-drop)/(duration-drop);
  const [shot,start,end]=montage?(CUTS.find(c=>progress<c[2])??CUTS.at(-1)):
    t<drop*.30?['check-in',0,.30]:t<drop*.78?['walk-in',.30,.78]:['sit-down',.78,1];
  const p=Math.max(0,Math.min(1,((montage?progress:t/drop)-start)/(end-start))),u=p*p*(3-2*p);
  const closedTrades=progress>=.74?3:progress>=.46?2:progress>=.24?1:0;
  return {time:t,shot,u,drop:montage,typing:montage,wallet:shot==='wallet',insert:shot==='wallet'||shot==='chart',
    closedTrades,terminalTime:Math.max(0,t-drop)*1.2,smoke:false,lighting:0,girls:false,
    caption:shot==='check-in'?'CHECKING IN ON FLYGUY.':shot==='hero'?'TINY BRAIN. BIG NIGHT SHIFT.':''};
}
