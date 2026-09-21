import * as T from 'three';
import {sampleTeslaTerminal,TESLA_TRADES} from './director-tesla-timeline.js';

const usd=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
export function createTeslaTerminal(materials){
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=800;
  const insert=document.createElement('canvas');insert.width=720;insert.height=1280;insert.className='tesla-terminal-insert';
  insert.setAttribute('aria-label','Fly Guy cinematic paper trading terminal');
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:texture,toneMapped:false});materials.add(material);
  let last='';
  function draw(canvas,f){
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,portrait=h>w;
    const state=sampleTeslaTerminal(f.terminalTime),trade=TESLA_TRADES[state.asset];
    ctx.fillStyle='#071118';ctx.fillRect(0,0,w,h);
    const text=(s,x,y,size=18,color='#a4bbc7',weight='400')=>{ctx.fillStyle=color;ctx.font=`${weight} ${size}px monospace`;ctx.fillText(s,x,y);};
    const line=(x1,y1,x2,y2,color='#1b303d')=>{ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
    const panel=(x,y,width,height)=>{ctx.fillStyle='#0b1a24';ctx.fillRect(x,y,width,height);ctx.strokeStyle='#203947';ctx.strokeRect(x,y,width,height);};
    const left=portrait?42:48,right=w-left;
    text('ASTER',left,portrait?115:65,portrait?31:27,'#a3f0de','700');
    text(f.wallet?'WALLET / OVERVIEW':'NIGHT DESK / TERMINAL',portrait?left:235,portrait?158:65,17,'#7ca3b5');
    text('DIRECTOR SESSION · PAPER TRADES',left,h-38,portrait?14:16,'#526d7a');
    line(left,portrait?187:93,right,portrait?187:93);
    if(f.wallet){
      const top=portrait?247:145;
      text('TOTAL EQUITY',left,top,18,'#8bb0b5');text(usd(104800),left,top+83,portrait?64:74,'#eefbf4','700');
      text('+ '+usd(state.profit)+'  REALIZED',left,top+133,portrait?26:27,'#93e3b1');
      text('3 CLOSED TRADES',left,top+178,17,'#809cab');
      const chartTop=top+215,chartHeight=portrait?230:115;
      panel(left,chartTop,w-left*2,chartHeight);ctx.beginPath();ctx.strokeStyle='#8cdeb5';ctx.lineWidth=3;
      for(let i=0;i<36;i++){const x=left+20+i/35*(w-left*2-40),y=chartTop+chartHeight-24-i/35*(chartHeight-48)-Math.sin(i*1.7)*7;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
      const rows=chartTop+chartHeight+65;
      text('ASSET',left,rows,16);text('REALIZED P&L',right-(portrait?208:230),rows,16);
      TESLA_TRADES.forEach((tr,i)=>{const y=rows+55+i*(portrait?83:47);line(left,y+22,right,y+22);text(tr.symbol,left,y,24,'#e4edf1','700');text('CLOSED',left+(portrait?120:210),y,15,'#698e92');text('+'+usd(tr.profit),right-(portrait?210:230),y,24,'#93e3b1');});
      return;
    }
    const top=portrait?229:132,tabWidth=portrait?195:180;
    TESLA_TRADES.forEach((tr,i)=>{const x=left+i*tabWidth;ctx.fillStyle=i===state.asset?'#183c40':'#101f2b';ctx.fillRect(x,top-28,tabWidth-12,46);text(tr.symbol+' / USD',x+12,top+2,18,i===state.asset?'#b8f9de':'#708d9e');});
    const price=trade.entry+(trade.exit-trade.entry)*(.35+state.progress*.65);
    text(usd(price),left,top+91,portrait?44:49,'#f0f6f7','700');text('+ '+((price/trade.entry-1)*100).toFixed(2)+'%',portrait?left:right-170,portrait?top+127:top+86,22,'#85d6af');
    const toolbar=top+(portrait?172:140);
    const labels=['CANDLES','EMA 20','RSI 14'];
    labels.forEach((label,i)=>{const x=left+i*(portrait?176:165),active=i===0||(i===1?state.ema:state.rsi);ctx.fillStyle=active?'#183c43':'#10232e';ctx.fillRect(x,toolbar-23,portrait?158:149,40);text(label,x+12,toolbar+3,17,active?'#a2efdf':'#678997');});
    const chartY=toolbar+43,chartH=portrait?360:260,chartW=w-left*2;
    panel(left,chartY,chartW,chartH);
    for(let i=1;i<6;i++)line(left,chartY+i*chartH/6,right,chartY+i*chartH/6);
    const candles=portrait?30:54,cw=(chartW-30)/candles;
    const values=[];
    for(let i=0;i<candles;i++){
      const v=.2+i/candles*.55+Math.sin(i*1.7+state.asset)*.055+Math.cos(i*.58)*.035;
      const prev=v+Math.sin(i*2.2)*.045,high=Math.max(v,prev)+.045,low=Math.min(v,prev)-.035;
      const x=left+16+i*cw,y=chartY+chartH*(1-v),yp=chartY+chartH*(1-prev),green=v>=prev;
      ctx.strokeStyle=green?'#76dfc3':'#d2758b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,chartY+chartH*(1-high));ctx.lineTo(x,chartY+chartH*(1-low));ctx.stroke();
      ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(x-cw*.28,Math.min(y,yp),cw*.56,Math.max(3,Math.abs(y-yp)));values.push([x,y]);
    }
    if(state.ema){ctx.strokeStyle='#d2bd7b';ctx.lineWidth=2;ctx.beginPath();values.forEach(([x,y],i)=>i?ctx.lineTo(x,y+14):ctx.moveTo(x,y+14));ctx.stroke();}
    const rsiY=chartY+chartH+14,rsiH=portrait?91:54;
    panel(left,rsiY,chartW,rsiH);text(state.rsi?'RSI 14 / 62.4':'VOLUME / USD',left+12,rsiY+20,13,'#7c92b3');
    ctx.strokeStyle='#9e94d7';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<80;i++){const x=left+16+i/79*(chartW-32),y=rsiY+rsiH*.6+Math.sin(i*.35)*rsiH*.16;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    const orderY=rsiY+rsiH+36;
    ctx.fillStyle='#214c43';ctx.fillRect(left,orderY,portrait?275:270,48);text(state.click?'ORDER FILLED':'CLOSE POSITION',left+16,orderY+31,20,'#b6f7d7','700');
    text('LIMIT / '+trade.symbol,portrait?left:right-200,portrait?orderY+88:orderY+30,17,'#819fad');
    const cursor=state.cursor==='symbol'?[left+state.asset*tabWidth+100,top+12]:state.cursor==='ema'?[left+225,toolbar+12]:[left+210,orderY+24];
    ctx.save();ctx.translate(...cursor);ctx.fillStyle='#eafef8';ctx.strokeStyle='#09151b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,24);ctx.lineTo(7,17);ctx.lineTo(15,29);ctx.lineTo(20,26);ctx.lineTo(12,14);ctx.lineTo(23,12);ctx.closePath();ctx.fill();ctx.stroke();
    if(state.click){ctx.strokeStyle='#8cffe0';ctx.beginPath();ctx.arc(5,8,27,0,Math.PI*2);ctx.stroke();}ctx.restore();
  }
  return {canvas,insert,material,update(f){
    const key=`${f.wallet}/${Math.floor(f.terminalTime*20)}`;if(key===last)return;last=key;
    draw(canvas,f);draw(insert,f);texture.needsUpdate=true;
    insert.dataset.view=f.wallet?'wallet':'chart';insert.dataset.symbol=TESLA_TRADES[sampleTeslaTerminal(f.terminalTime).asset].symbol;
  }};
}
