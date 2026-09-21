export const TESLA_BPM=110;
// User's Instagram excerpt: approximately song 0:06 to a drop near 0:18.
export const TESLA_DROP=12;
export const TESLA_MONTAGE_BEATS=24;
export const TESLA_INTRO=[
  ['nightdesk-open',0,1],['elevator-crew',1,5],['scooter-mount',5,8],
  ['scooter-ride',8,11],['desk-arrival',11,13],['terminal',13,16],
  ['wallet',16,18],['light-up',18,20],['crew-smoke',20,24],
];
export const TESLA_CUTS=['solo-low','screen-candles','hands','profile-smoke','screen-indicators','crew',
  'solo-orbit','screen-wallet','eyes','keys','crew-wide','hero'];
export const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function teslaTiming(settings={}){
  const bpm=Number.isFinite(+settings.bpm)?Math.max(70,Math.min(160,+settings.bpm)):TESLA_BPM;
  const drop=Number.isFinite(+settings.drop)?Math.max(8,Math.min(40,+settings.drop)):TESLA_DROP;
  return {bpm,drop,beat:60/bpm,duration:drop+TESLA_MONTAGE_BEATS*60/bpm};
}
export function sampleTeslaTake(time,settings={}){
  const timing=teslaTiming(settings),t=Math.max(0,Math.min(timing.duration,Number.isFinite(time)?time:0));
  const introBeat=t/timing.drop*24,drop=t>=timing.drop;
  const montageBeat=Math.min(TESLA_MONTAGE_BEATS-.00001,Math.max(0,(t-timing.drop)/timing.beat));
  const cut=Math.floor(montageBeat/2),part=TESLA_INTRO.find(s=>introBeat<s[2])??TESLA_INTRO.at(-1);
  const shot=drop?TESLA_CUTS[cut]:part[0],u=drop?ease((montageBeat%2)/2):ease((introBeat-part[1])/(part[2]-part[1]));
  const suite=['elevator-crew','scooter-mount','scooter-ride'].includes(shot);
  const wallet=shot==='wallet'||shot==='screen-wallet';
  const smoke=['light-up','crew-smoke','profile-smoke','crew','crew-wide','hero'].includes(shot);
  return {time:t,...timing,shot,u,drop,cut,suite,wallet,smoke,
    flyVisible:shot!=='nightdesk-open',
    girls:suite||['crew-smoke','crew','crew-wide'].includes(shot),
    insert:wallet||['terminal','screen-candles','screen-indicators'].includes(shot),
    typing:!suite&&!wallet&&!['nightdesk-open','desk-arrival','light-up','crew-smoke'].includes(shot),
    lighting:shot==='light-up'?ease(u*2):smoke?1:0,
    terminalTime:drop?9+(t-timing.drop):Math.max(0,(introBeat-12)*.7),
    caption:shot==='nightdesk-open'?'I GAVE A FLY A TRADING DESK.':shot==='wallet'?'HE HAD OTHER PLANS.':shot==='hero'?'MEET FLY GUY.':'',
  };
}

export const TESLA_TRADES=[
  {symbol:'BTC',name:'Bitcoin',quantity:.8,entry:78000,exit:80100,profit:1680},
  {symbol:'ETH',name:'Ethereum',quantity:12,entry:2500,exit:2620,profit:1440},
  {symbol:'SOL',name:'Solana',quantity:40,entry:106,exit:148,profit:1680},
];
export function sampleTeslaTerminal(time){
  const t=Math.max(0,Number.isFinite(time)?time:0),step=Math.floor(t/.7);
  const asset=Math.floor(step/3)%3,action=step%3;
  return {asset,action,ema:action>=1,rsi:action===2,cursor:action===0?'symbol':action===1?'ema':'order',
    click:(t%.7)/.7>.65,progress:Math.min(1,t/5),profit:TESLA_TRADES.reduce((sum,trade)=>sum+trade.profit,0)};
}
