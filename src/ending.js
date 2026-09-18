// The ending. Once every story rests on the rug, a gardenia opens over the room and keeps
// opening until nothing is left but its petals, and the night is over.
// The flower is drawn petal by petal on a 2D canvas, in the same hand-made spirit as the room.
export const BLOOM_SECONDS=11;
// Whorls from the outside in, as a fraction of the flower's radius. The outer petals open
// first and the furled heart last, the way a gardenia unwinds.
export const WHORLS=[
 {count:9,length:1,width:.68,start:0},
 {count:8,length:.82,width:.6,start:.13},
 {count:7,length:.64,width:.52,start:.26},
 {count:6,length:.47,width:.44,start:.39},
 {count:5,length:.31,width:.36,start:.52},
];
const OPEN_TIME=.42;
const clamp01=x=>Math.min(1,Math.max(0,x));
const ease=x=>x*x*(3-2*x);
// How far one whorl has unfolded at time t (0..1 across the bloom).
export function openness(whorl,t){return ease(clamp01((t-whorl.start)/OPEN_TIME));}
// The flower's size as a fraction of the size that covers the screen: a bud, then a slow swell.
export function growth(t){return .1+.9*Math.pow(clamp01(t),2.1);}
// Petals, growth and the final wash of cream that settles over everything.
export function bloomState(t){return {growth:growth(t),open:WHORLS.map(w=>openness(w,t)),cover:clamp01(5*t-4)};}

export function createEnding({onRestart}){
 const root=document.querySelector('#ending'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
 let active=false,startedAt=0,raf=0;
 root.querySelector('#again').addEventListener('click',()=>{stop();onRestart();});
 function resize(){const dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 window.addEventListener('resize',()=>{if(active)resize();});
 function start(){
  if(active)return;active=true;root.hidden=false;resize();
  startedAt=performance.now();
  // Without motion the flower is simply there, fully open, with the words on it.
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)startedAt-=BLOOM_SECONDS*1000;
  void root.offsetWidth;root.classList.add('showing');
  frame();
 }
 function stop(){active=false;cancelAnimationFrame(raf);root.hidden=true;root.classList.remove('showing','done');}
 function frame(){
  if(!active)return;
  const t=Math.min(1,(performance.now()-startedAt)/1000/BLOOM_SECONDS);
  draw(t);
  if(t>=.88)root.classList.add('done');
  if(t<1)raf=requestAnimationFrame(frame);
 }
 function petal(L,W,o){
  // Obovate, rounded at the tip, with the slight inward twist of a petal not yet flat.
  ctx.beginPath();ctx.moveTo(0,0);
  ctx.bezierCurveTo(-W*.35,-L*.15,-W,-L*.55,-W*.55,-L*.88);
  ctx.quadraticCurveTo(0,-L*1.08,W*.55,-L*.88);
  ctx.bezierCurveTo(W,-L*.55,W*.35,-L*.15,0,0);
  ctx.closePath();
  const g=ctx.createLinearGradient(0,0,0,-L);
  g.addColorStop(0,'#e6d4a2');g.addColorStop(.3,'#f6eed6');g.addColorStop(.75,'#fdf9ec');g.addColorStop(1,'#fffef8');
  ctx.fillStyle=g;
  ctx.shadowColor='rgba(30,40,24,.4)';ctx.shadowBlur=L*.09;ctx.shadowOffsetY=L*.025;
  ctx.fill();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  // A soft crease down the middle; it fades as the petal flattens.
  ctx.strokeStyle=`rgba(205,188,140,${.4*(1-.5*o)})`;ctx.lineWidth=Math.max(1,L*.012);
  ctx.beginPath();ctx.moveTo(0,-L*.08);ctx.quadraticCurveTo(-W*.06,-L*.5,0,-L*.86);ctx.stroke();
  // Waxy sheen along one edge.
  ctx.strokeStyle='rgba(255,255,250,.35)';ctx.lineWidth=Math.max(1,L*.008);
  ctx.beginPath();ctx.moveTo(W*.1,-L*.2);ctx.bezierCurveTo(W*.7,-L*.5,W*.5,-L*.8,W*.15,-L*.95);ctx.stroke();
 }
 function leaves(cx,cy,R,spin){
  for(let i=0;i<7;i++){
   const a=-spin*.5+i/7*Math.PI*2+.5,L=R*1.6,W=R*.42;
   ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
   ctx.beginPath();ctx.moveTo(0,-R*.15);ctx.bezierCurveTo(-W,-L*.35,-W*.9,-L*.8,0,-L);ctx.bezierCurveTo(W*.9,-L*.8,W,-L*.35,0,-R*.15);ctx.closePath();
   const g=ctx.createLinearGradient(0,0,0,-L);g.addColorStop(0,'#1c3325');g.addColorStop(.5,'#2e5636');g.addColorStop(1,'#17291f');
   ctx.fillStyle=g;ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=R*.12;ctx.fill();ctx.shadowColor='transparent';ctx.shadowBlur=0;
   ctx.strokeStyle='rgba(170,205,160,.2)';ctx.lineWidth=Math.max(1,R*.012);
   ctx.beginPath();ctx.moveTo(0,-R*.2);ctx.lineTo(0,-L*.94);ctx.stroke();
   ctx.restore();
  }
 }
 function draw(t){
  const w=innerWidth,h=innerHeight,cx=w/2,cy=h*.52,{growth,open,cover}=bloomState(t);
  const diagonal=Math.hypot(w,h),R=growth*diagonal*.64,spin=t*.3;
  // Night behind the flower, and a faint glow the petals seem to give off.
  const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,diagonal*.6);bg.addColorStop(0,'#22342a');bg.addColorStop(1,'#0c1410');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const glow=ctx.createRadialGradient(cx,cy,R*.2,cx,cy,R*1.5);glow.addColorStop(0,'rgba(255,246,214,.22)');glow.addColorStop(1,'rgba(255,246,214,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  leaves(cx,cy,R,spin);
  WHORLS.forEach((whorl,k)=>{
   const o=open[k];
   for(let i=0;i<whorl.count;i++){
    const a=spin+(i/whorl.count)*Math.PI*2+k*.37;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(a+(1-o)*.9);ctx.translate(0,-R*.03);
    // Furled petals read short and narrow; open ones lie at their full length.
    petal(R*whorl.length*(.22+.78*o),R*whorl.width*(.4+.6*o),o);
    ctx.restore();
   }
  });
  // The heart: a warm yellow-cream where the innermost petals meet.
  const heart=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.09);heart.addColorStop(0,'#f2dc9c');heart.addColorStop(.6,'rgba(242,220,156,.55)');heart.addColorStop(1,'rgba(242,220,156,0)');
  ctx.fillStyle=heart;ctx.beginPath();ctx.arc(cx,cy,R*.09,0,Math.PI*2);ctx.fill();
  if(cover>0){ctx.fillStyle=`rgba(250,245,232,${cover*.86})`;ctx.fillRect(0,0,w,h);}
 }
 return {start,stop,active:()=>active};
}
